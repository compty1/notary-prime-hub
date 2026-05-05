/**
 * Multi-step booking flow for free RON consultations.
 * Captures: service interest, signer count, location/state, preferred time
 * windows, contact info — then writes to `service_requests` and pushes a
 * tentative event into the connected Google Calendar via the
 * `google-calendar-sync` edge function.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Monitor,
  CalendarClock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { z } from "zod";

const SERVICE_OPTIONS = [
  { id: "ron_general", label: "General RON Notarization" },
  { id: "ron_loan_signing", label: "Loan Signing (RON)" },
  { id: "ron_estate", label: "Estate / Trust Documents" },
  { id: "ron_apostille", label: "Apostille Pre-Notarization" },
  { id: "ron_business", label: "Business / Corporate Filing" },
  { id: "ron_other", label: "Other — discuss on call" },
] as const;

const TIME_WINDOWS = [
  { id: "weekday_morning", label: "Weekday Morning", desc: "Mon–Fri · 9:00 AM – 12:00 PM ET", startHour: 9, endHour: 12, weekdays: [1, 2, 3, 4, 5] },
  { id: "weekday_afternoon", label: "Weekday Afternoon", desc: "Mon–Fri · 12:00 PM – 5:00 PM ET", startHour: 12, endHour: 17, weekdays: [1, 2, 3, 4, 5] },
  { id: "weekday_evening", label: "Weekday Evening", desc: "Mon–Fri · 5:00 PM – 7:00 PM ET", startHour: 17, endHour: 19, weekdays: [1, 2, 3, 4, 5] },
  { id: "saturday", label: "Saturday", desc: "Sat · 10:00 AM – 4:00 PM ET", startHour: 10, endHour: 16, weekdays: [6] },
  { id: "sunday", label: "Sunday (by appointment)", desc: "Sun · 12:00 PM – 4:00 PM ET", startHour: 12, endHour: 16, weekdays: [0] },
] as const;

type WindowId = (typeof TIME_WINDOWS)[number]["id"];

const intakeSchema = z.object({
  service: z.string().min(1, "Choose a service"),
  signerCount: z.number().int().min(1).max(20),
  signerState: z.string().min(2, "State is required"),
  documentSummary: z.string().max(1000).optional(),
});

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Name required"),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().min(10, "Phone required"),
  preferredDate: z.string().min(1, "Pick a target date"),
  windows: z.array(z.string()).min(1, "Select at least one time window"),
  consentContact: z.literal(true, {
    errorMap: () => ({ message: "Please consent to contact" }),
  }),
});

type Step = 0 | 1 | 2 | 3;

function nextWeekdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  // Skip to Monday if weekend
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function buildWindowDateTimes(dateISO: string, windowId: WindowId) {
  const win = TIME_WINDOWS.find((w) => w.id === windowId);
  if (!win) return null;
  // Build naive ET range; calendar sync will set timezone explicitly.
  const start = `${dateISO}T${String(win.startHour).padStart(2, "0")}:00:00`;
  const end = `${dateISO}T${String(win.endHour).padStart(2, "0")}:00:00`;
  return { start, end, label: win.label, desc: win.desc };
}

export default function BookRonConsult() {
  usePageMeta({
    title: "Book a RON Consultation — Notar",
    description:
      "Schedule a free Remote Online Notarization consultation. Pick a recommended time window and we'll confirm via your calendar.",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    calendarEvent?: { id?: string; htmlLink?: string };
    calendarConnected: boolean;
  } | null>(null);

  // Step 0/1 intake
  const [service, setService] = useState<string>("ron_general");
  const [signerCount, setSignerCount] = useState<number>(1);
  const [signerState, setSignerState] = useState("OH");
  const [documentSummary, setDocumentSummary] = useState("");

  // Step 2 contact + scheduling
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState<string>(nextWeekdayDate());
  const [windows, setWindows] = useState<WindowId[]>(["weekday_morning"]);
  const [consentContact, setConsentContact] = useState(false);

  // Prefill from logged-in profile
  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email || "");
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName((n) => n || data.full_name || "");
          setPhone((p) => p || (data as any).phone || "");
        }
      });
  }, [user]);

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  const toggleWindow = (id: WindowId) => {
    setWindows((cur) =>
      cur.includes(id) ? cur.filter((w) => w !== id) : [...cur, id],
    );
  };

  const validateStep = (s: Step): string | null => {
    if (s === 0) {
      const r = intakeSchema.safeParse({
        service,
        signerCount,
        signerState,
        documentSummary,
      });
      if (!r.success) return r.error.issues[0]?.message || "Invalid input";
      return null;
    }
    if (s === 1) {
      if (windows.length === 0) return "Pick at least one preferred time window";
      if (!preferredDate) return "Pick a target date";
      return null;
    }
    if (s === 2) {
      const r = contactSchema.safeParse({
        fullName,
        email,
        phone,
        preferredDate,
        windows,
        consentContact,
      });
      if (!r.success) return r.error.issues[0]?.message || "Invalid input";
      return null;
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast({ title: "Please fix the form", description: err, variant: "destructive" });
      return;
    }
    setStep((s) => (Math.min(3, s + 1) as Step));
  };

  const submitConsult = async () => {
    const err = validateStep(2);
    if (err) {
      toast({ title: "Please fix the form", description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const serviceLabel =
        SERVICE_OPTIONS.find((s) => s.id === service)?.label || service;

      // Build a human summary of selected windows
      const windowDetails = windows
        .map((w) => buildWindowDateTimes(preferredDate, w))
        .filter(Boolean) as Array<{ start: string; end: string; label: string; desc: string }>;

      const intake = {
        consult_type: "RON",
        service_interest: service,
        service_label: serviceLabel,
        signer_count: signerCount,
        signer_state: signerState,
        document_summary: documentSummary || null,
        full_name: fullName,
        email,
        phone,
        preferred_date: preferredDate,
        preferred_windows: windowDetails,
        consent_contact: true,
      };

      // Create service request record
      const { data: insertData, error: insertErr } = await supabase
        .from("service_requests")
        .insert({
          client_id: user?.id || null,
          service_name: `RON Consultation — ${serviceLabel}`,
          intake_data: intake,
          status: "new",
          priority: "normal",
          notes: `Preferred date ${preferredDate}; windows: ${windowDetails
            .map((w) => w.label)
            .join(", ")}`,
        })
        .select("id, reference_number")
        .single();

      if (insertErr) throw insertErr;
      const reference = insertData?.reference_number || insertData?.id;

      // Push a tentative event for the FIRST chosen window into Google Calendar
      let calendarConnected = false;
      let calendarEvent: { id?: string; htmlLink?: string } | undefined;

      const first = windowDetails[0];
      if (first) {
        try {
          const { data: calRes } = await supabase.functions.invoke(
            "google-calendar-sync",
            {
              body: {
                action: "create_event",
                summary: `RON Consult — ${fullName} (${serviceLabel})`,
                description: [
                  `Service: ${serviceLabel}`,
                  `Signer state: ${signerState}`,
                  `Signers: ${signerCount}`,
                  `Phone: ${phone}`,
                  `Email: ${email}`,
                  documentSummary ? `Notes: ${documentSummary}` : "",
                  ``,
                  `Preferred windows:`,
                  ...windowDetails.map((w) => ` • ${w.label} (${w.desc})`),
                  ``,
                  `Reference: ${reference}`,
                ]
                  .filter(Boolean)
                  .join("\n"),
                start: first.start,
                end: first.end,
                location: "Zoom (link sent at confirmation)",
                timeZone: "America/New_York",
              },
            },
          );
          if (calRes?.connected) {
            calendarConnected = true;
            calendarEvent = calRes.event;
          }
        } catch (e) {
          console.warn("Calendar push skipped:", e);
        }
      }

      setConfirmation({
        reference: String(reference),
        calendarConnected,
        calendarEvent,
      });
      setStep(3);
    } catch (e: any) {
      toast({
        title: "Submission failed",
        description: e?.message || "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <section className="bg-gradient-hero py-10">
        <div className="container mx-auto max-w-3xl px-4">
          <Breadcrumbs />
          <div className="mt-4 flex items-center gap-3">
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              <Monitor className="mr-1 h-3 w-3" /> RON Consultation
            </Badge>
            <Badge variant="outline">Free · 15–20 min · Zoom</Badge>
          </div>
          <h1 className="mt-3 font-sans text-3xl font-bold text-foreground md:text-4xl">
            Book a RON Consultation
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tell us what you need notarized and your preferred times. We'll
            confirm a Zoom slot and add it to the calendar.
          </p>
          <div className="mt-6">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Service</span>
              <span>Time Windows</span>
              <span>Contact</span>
              <span>Confirmation</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto max-w-3xl px-4">
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What do you need notarized?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Service interest *</Label>
                    <RadioGroup value={service} onValueChange={setService} className="grid gap-2 sm:grid-cols-2">
                      {SERVICE_OPTIONS.map((s) => (
                        <label
                          key={s.id}
                          htmlFor={`svc-${s.id}`}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${
                            service === s.id ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <RadioGroupItem id={`svc-${s.id}`} value={s.id} className="mt-0.5" />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Number of signers *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={signerCount}
                        onChange={(e) => setSignerCount(Math.max(1, parseInt(e.target.value || "1", 10)))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Signer state *</Label>
                      <Input
                        value={signerState}
                        onChange={(e) => setSignerState(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="OH"
                        maxLength={2}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Notary must be located in Ohio (ORC §147.65). Signer can be in any U.S. state.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Brief description (optional)</Label>
                    <Textarea
                      value={documentSummary}
                      onChange={(e) => setDocumentSummary(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="What document(s)? Any deadline?"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarClock className="h-5 w-5 text-primary" /> Preferred time windows
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Target date *</Label>
                    <Input
                      type="date"
                      value={preferredDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setPreferredDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pick all that work for you *</Label>
                    <div className="grid gap-2">
                      {TIME_WINDOWS.map((w) => {
                        const checked = windows.includes(w.id);
                        return (
                          <label
                            key={w.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                              checked ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleWindow(w.id)}
                            />
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {w.label}
                              </div>
                              <div className="text-xs text-muted-foreground">{w.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your contact info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full name *</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      maxLength={255}
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
                    <Checkbox
                      checked={consentContact}
                      onCheckedChange={(v) => setConsentContact(!!v)}
                      className="mt-0.5"
                    />
                    <span className="text-muted-foreground">
                      I consent to be contacted by Notar at the email and phone number above to confirm this consultation. I understand this is not legal advice (see ORC §4705.07).
                    </span>
                  </label>

                  <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-semibold text-foreground">Summary</p>
                    <p>Service: {SERVICE_OPTIONS.find((s) => s.id === service)?.label}</p>
                    <p>
                      Date: {preferredDate} · Windows:{" "}
                      {windows
                        .map((w) => TIME_WINDOWS.find((t) => t.id === w)?.label)
                        .join(", ")}
                    </p>
                    <p>Signers: {signerCount} · Signer state: {signerState}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && confirmation && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-success/30 bg-success/5">
                <CardContent className="space-y-4 p-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-success" />
                  <h2 className="font-sans text-2xl font-bold">Consultation requested!</h2>
                  <p className="text-sm text-muted-foreground">
                    Reference: <span className="font-mono font-semibold">{confirmation.reference}</span>
                  </p>
                  {confirmation.calendarConnected ? (
                    <p className="text-sm text-success">
                      Tentative event added to the team Google Calendar — we'll
                      reply with the final Zoom link within 2 business hours.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      We'll review and reply with the final Zoom link within 2 business hours.
                    </p>
                  )}
                  {confirmation.calendarEvent?.htmlLink && (
                    <a
                      href={confirmation.calendarEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary underline"
                    >
                      <CalendarIcon className="h-3 w-3" /> View on Google Calendar
                    </a>
                  )}
                  <div className="flex justify-center gap-2 pt-2">
                    <Button variant="outline" onClick={() => navigate("/services")}>
                      Browse services
                    </Button>
                    <Button onClick={() => navigate("/")}>Back to home</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step !== 3 && (
            <div className="mt-6 flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => (Math.max(0, s - 1) as Step))}
                disabled={step === 0 || submitting}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              {step < 2 ? (
                <Button onClick={goNext}>
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submitConsult} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Submit consultation request <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
