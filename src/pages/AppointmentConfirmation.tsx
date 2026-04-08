import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, MapPin, Monitor, Download, ArrowLeft, Shield, Upload, ChevronRight, FileText, Wifi, Video, User, CreditCard } from "lucide-react";
import TechCheck from "@/components/TechCheck";
import PaymentForm from "@/components/PaymentForm";
import { CalendarDownload } from "@/components/CalendarDownload";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

import { formatDate, formatTime } from "@/lib/utils";

function generateICS(appt: any): string {
  const dtStart = `${appt.scheduled_date.replace(/-/g, "")}T${appt.scheduled_time.replace(/:/g, "").substring(0, 6)}00`;
  const startDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const dtEnd = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Notar//NotarDex.com//EN",
    "BEGIN:VEVENT", `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `SUMMARY:Notarization — ${appt.service_type}`,
    `DESCRIPTION:${appt.notarization_type === "ron" ? "Remote Online Notarization (RON) session" : "In-person notarization appointment"} with NotarDex`,
    `LOCATION:${appt.location || (appt.notarization_type === "ron" ? "Online — Video Call" : "TBD")}`,
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

// Phase 5.1: Category-specific checklists
const serviceChecklists: Record<string, string[]> = {
  ron: [
    "Computer with working camera and microphone",
    "Stable internet connection (recommended: 5+ Mbps)",
    "Valid government-issued photo ID (driver's license, passport, or state ID)",
    "Documents to be notarized in digital format (PDF preferred)",
    "Quiet, well-lit room for the video session",
  ],
  in_person: [
    "Valid, unexpired government-issued photo ID",
    "Original document(s) to be notarized — do NOT sign beforehand",
    "Payment method (card, cash, or digital payment)",
  ],
  apostille: [
    "Original notarized document(s)",
    "Ohio SOS apostille request form (we can help prepare this)",
    "Prepaid return envelope (if mailing)",
    "Destination country information",
  ],
  immigration: [
    "All USCIS forms completed (do NOT sign until before the notary)",
    "Certified translations of foreign-language documents",
    "Valid passport or photo ID",
    "Supporting evidence/documentation as required by your form",
  ],
  i9: [
    "Employer's I-9 form (Section 1 must be completed by employee first)",
    "One List A document (proves both identity AND work authorization):",
    "  • U.S. Passport or Passport Card, Permanent Resident Card (Green Card), Employment Authorization Document (EAD/I-766), or Foreign passport with I-94",
    "OR one List B document (identity) PLUS one List C document (work authorization):",
    "  • List B: Driver's license, state ID, school ID with photo, voter registration card, or U.S. military card",
    "  • List C: Social Security card (unrestricted), U.S. birth certificate, or Certification of Birth Abroad (FS-545/DS-1350)",
  ],
  real_estate: [
    "Closing documents from title company",
    "Valid government-issued photo ID",
    "Wire transfer confirmation (if applicable)",
    "Contact information for title company / lender",
  ],
};

const getChecklist = (appt: any): string[] => {
  const type = appt.notarization_type;
  const service = (appt.service_type || "").toLowerCase();
  const notes = (appt.notes || "").toLowerCase();

  if (service.includes("apostille") || service.includes("authentication")) return serviceChecklists.apostille;
  if (service.includes("immigration") || notes.includes("uscis") || notes.includes("i-130") || notes.includes("i-485")) return serviceChecklists.immigration;
  if (service.includes("i-9") || service.includes("employment verification")) return serviceChecklists.i9;
  if (service.includes("real estate") || service.includes("closing") || service.includes("deed")) return serviceChecklists.real_estate;
  if (type === "ron") return serviceChecklists.ron;
  return serviceChecklists.in_person;
};

// Phase 5.4: Cross-sell bundles
const crossSellMap: Record<string, { name: string; desc: string }[]> = {
  apostille: [{ name: "Translation Coordination", desc: "Need your documents translated? We coordinate with certified translators." }],
  real_estate: [{ name: "Witness Service", desc: "Need an additional witness? Add for $10." }],
  notarization: [{ name: "Certified Copy", desc: "Need certified copies of your notarized documents?" }],
};

const getCrossSells = (appt: any) => {
  const service = (appt.service_type || "").toLowerCase();
  if (service.includes("apostille")) return crossSellMap.apostille;
  if (service.includes("real estate")) return crossSellMap.real_estate;
  return crossSellMap.notarization || [];
};

export default function AppointmentConfirmation() {
  usePageMeta({ title: "Appointment Confirmed — NotarDex", description: "Your notarization appointment has been confirmed. Review your session details, download a calendar invite, and prepare for your appointment." });
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("id");
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLink, setZoomLink] = useState<string>("");
  const [notaryProfile, setNotaryProfile] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!appointmentId || !user) { setLoading(false); return; }
    Promise.all([
      supabase.from("appointments").select("*").eq("id", appointmentId).single(),
      supabase.from("platform_settings").select("setting_value").eq("setting_key", "zoom_meeting_link").single(),
    ]).then(async ([apptRes, zoomRes]) => {
      if (apptRes.data) setAppointment(apptRes.data);
      if (zoomRes.data?.setting_value) setZoomLink(zoomRes.data.setting_value);
      // Fetch notary/admin profile to show "Your Notary" info
      const { data: adminRoles } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "notary"]).limit(1);
      if (adminRoles && adminRoles.length > 0) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", adminRoles[0].user_id).single();
        if (prof) setNotaryProfile(prof);
      }
      setLoading(false);
    });
  }, [appointmentId, user]);

  const downloadICS = () => {
    if (!appointment) return;
    const ics = generateICS(appointment);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `notarization-${appointment.scheduled_date}.ics`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (!appointment) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <p className="text-muted-foreground">Appointment not found.</p>
          <Link to="/portal" className="mt-4"><Button>Go to Portal</Button></Link>
        </div>
      </PageShell>
    );
  }

  const checklist = getChecklist(appointment);
  const crossSells = getCrossSells(appointment);

  return (
    <PageShell>
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Breadcrumbs />
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="mb-2 font-sans text-3xl font-bold text-foreground">Appointment Confirmed!</h1>
        <p className="mb-8 text-muted-foreground">Your notarization appointment has been booked successfully.</p>

        <Card className="mb-6 border-border/50 text-left">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {appointment.notarization_type === "ron" ? <Monitor className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                Type
              </span>
              <Badge className="bg-primary/20 text-primary-foreground">
                {appointment.notarization_type === "ron" ? "Remote (RON)" : "In-Person"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" /> Service</span>
              <span className="text-sm font-medium">{appointment.service_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Date</span>
              <span className="text-sm font-medium">{formatDate(appointment.scheduled_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Time</span>
              <span className="text-sm font-medium">{formatTime(appointment.scheduled_time)}</span>
            </div>
            {appointment.location && appointment.location !== "Remote" && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> Location</span>
                <span className="text-sm font-medium text-right max-w-[60%]">{appointment.location}</span>
              </div>
            )}
            {appointment.estimated_price && (
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm text-muted-foreground">Est. Total</span>
                <span className="text-sm font-bold text-primary">${parseFloat(appointment.estimated_price).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Notary Card */}
        {notaryProfile && (
          <Card className="mb-6 border-border/50 text-left">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Your Notary</p>
              <p className="text-sm font-medium">{notaryProfile.full_name || "NotarDex"}</p>
              {notaryProfile.phone && <p className="text-xs text-muted-foreground mt-1">📞 {notaryProfile.phone}</p>}
              {notaryProfile.email && <p className="text-xs text-muted-foreground">✉️ {notaryProfile.email}</p>}
              {notaryProfile.state && <p className="text-xs text-muted-foreground">Commissioned in {notaryProfile.state}</p>}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <CalendarDownload
            date={appointment.scheduled_date}
            time={appointment.scheduled_time}
            serviceType={appointment.service_type}
            notarizationType={appointment.notarization_type}
            location={appointment.location}
          />
          {/* ID 42: Upload documents prompt */}
          <Link to="/portal?tab=documents">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <Upload className="h-4 w-4" /> Upload Documents Now
            </Button>
          </Link>
          {/* ID 239: Portal access CTA */}
          <Link to="/portal">
            <Button className="w-full sm:w-auto">
              Access Your Portal
            </Button>
          </Link>
        </div>

        {/* ID 239: Portal access reminder for new users */}
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-left text-sm">
          <p className="font-medium text-foreground flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Your Portal is Ready</p>
          <p className="text-muted-foreground mt-1">Log in to your Client Portal to track your appointment, upload documents, and communicate with your notary. Use the email address you provided during booking.</p>
        </div>

        {/* Pay Now Section */}
        {appointment.estimated_price && parseFloat(appointment.estimated_price) > 0 && (
          <div className="mt-6">
            {!showPayment ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-center space-y-3">
                  <p className="text-sm font-medium flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" /> Pay Now (Optional)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pay your estimated total of <strong>${parseFloat(appointment.estimated_price).toFixed(2)}</strong> now to secure your appointment. Payment can also be made at the time of service.
                  </p>
                  <Button onClick={() => setShowPayment(true)} className="w-full sm:w-auto">
                    <CreditCard className="mr-2 h-4 w-4" /> Pay ${parseFloat(appointment.estimated_price).toFixed(2)}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" /> Secure Payment
                  </p>
                  <PaymentForm
                    defaultAmount={parseFloat(appointment.estimated_price)}
                    appointmentId={appointment.id}
                    description={`Notarization — ${appointment.service_type}`}
                    onSuccess={() => {
                      setShowPayment(false);
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Phase 5.1: Service-specific checklist */}
        <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-4 text-left text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">What to bring / prepare:</p>
          <ul className="space-y-1">
            {checklist.map((item, i) => (
              <li key={i}>✓ {item}</li>
            ))}
          </ul>
        </div>

        {/* Phase 5.2: What happens next */}
        <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4 text-left text-sm">
          <p className="mb-2 font-medium text-foreground">What happens next:</p>
          <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
            <li>Your notary will confirm the appointment within 2 hours</li>
            <li>Upload your documents via your portal for faster processing</li>
            <li>You'll receive a confirmation email with session details</li>
            {appointment.notarization_type === "ron" && (
              <li>Run a tech check before your session (see below)</li>
            )}
          </ol>
        </div>

        {/* Zoom link for consultation appointments */}
        {zoomLink && (appointment.service_type || "").toLowerCase().includes("consult") && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-left">
            <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" /> Zoom Meeting
            </p>
            <p className="text-xs text-muted-foreground mb-3">Your consultation will take place via Zoom. Click below to join when it's time.</p>
            <a href={zoomLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className=" gap-2">
                <Video className="h-4 w-4" /> Join Zoom Meeting
              </Button>
            </a>
          </div>
        )}

        {/* TechCheck for RON appointments */}
        {appointment.notarization_type === "ron" && (
          <div className="mt-4">
            <TechCheck />
          </div>
        )}

        {/* Phase 5.4: Cross-sell (after tech check) */}
        {crossSells.length > 0 && (
          <div className="mt-4 rounded-lg border border-border/50 bg-card p-4 text-left">
            <p className="mb-3 text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> You may also need:
            </p>
            {crossSells.map((cs, i) => (
              <div key={i} className="flex items-center justify-between mb-2 last:mb-0">
                <div>
                  <p className="text-sm font-medium">{cs.name}</p>
                  <p className="text-xs text-muted-foreground">{cs.desc}</p>
                </div>
                <Link to={`/services`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    View <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
