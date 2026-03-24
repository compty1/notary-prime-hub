import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, MapPin, Monitor, Download, ArrowLeft, Shield, Upload, ChevronRight, FileText, Wifi, Video } from "lucide-react";
import TechCheck from "@/components/TechCheck";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

function generateICS(appt: any): string {
  const dtStart = `${appt.scheduled_date.replace(/-/g, "")}T${appt.scheduled_time.replace(/:/g, "").substring(0, 6)}00`;
  const startDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const dtEnd = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Notar//NotarDex.com//EN",
    "BEGIN:VEVENT", `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `SUMMARY:Notarization — ${appt.service_type}`,
    `DESCRIPTION:${appt.notarization_type === "ron" ? "Remote Online Notarization (RON) session" : "In-person notarization appointment"} with Notar`,
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
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("id");
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLink, setZoomLink] = useState<string>("");

  useEffect(() => {
    if (!appointmentId || !user) { setLoading(false); return; }
    Promise.all([
      supabase.from("appointments").select("*").eq("id", appointmentId).single(),
      supabase.from("platform_settings").select("setting_value").eq("setting_key", "zoom_meeting_link").single(),
    ]).then(([apptRes, zoomRes]) => {
      if (apptRes.data) setAppointment(apptRes.data);
      if (zoomRes.data?.setting_value) setZoomLink(zoomRes.data.setting_value);
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
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 text-center">
        <p className="text-muted-foreground">Appointment not found.</p>
        <Link to="/portal" className="mt-4"><Button>Go to Portal</Button></Link>
      </div>
    );
  }

  const checklist = getChecklist(appointment);
  const crossSells = getCrossSells(appointment);

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="font-display text-lg font-bold text-foreground">Notar</span>
          </Link>
          <Link to="/portal"><Button variant="outline" size="sm">My Portal</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
        </div>

        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Appointment Confirmed!</h1>
        <p className="mb-8 text-muted-foreground">Your notarization appointment has been booked successfully.</p>

        <Card className="mb-6 border-border/50 text-left">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {appointment.notarization_type === "ron" ? <Monitor className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                Type
              </span>
              <Badge className="bg-accent/20 text-accent-foreground">
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
                <span className="text-sm font-bold text-accent">${parseFloat(appointment.estimated_price).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={downloadICS} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Add to Calendar (.ics)
          </Button>
          {/* Phase 5.3: Upload documents button */}
          <Link to="/portal?tab=documents">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <Upload className="h-4 w-4" /> Upload Documents
            </Button>
          </Link>
          <Link to="/portal">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark sm:w-auto">
              Go to Portal
            </Button>
          </Link>
        </div>

        {/* Phase 5.1: Service-specific checklist */}
        <div className="mt-8 rounded-lg border border-accent/30 bg-accent/5 p-4 text-left text-sm text-muted-foreground">
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
          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4 text-left">
            <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-accent" /> Zoom Meeting
            </p>
            <p className="text-xs text-muted-foreground mb-3">Your consultation will take place via Zoom. Click below to join when it's time.</p>
            <a href={zoomLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark gap-2">
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
              <FileText className="h-4 w-4 text-accent" /> You may also need:
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
    </div>
  );
}
