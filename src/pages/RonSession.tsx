import { usePageTitle } from "@/lib/usePageTitle";
import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen, Save, Loader2, XCircle, FileCheck, CreditCard, ExternalLink, Video, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const oathScripts = {
  acknowledgment: null,
  jurat: "Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?",
  oath: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?",
};

const STEPS = [
  { label: "Paste Link", icon: Link2 },
  { label: "Verify ID / KBA", icon: Shield },
  { label: "Administer Oath", icon: BookOpen },
  { label: "Finalize", icon: FileCheck },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isDone && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
              isActive && "bg-primary/10 text-primary ring-1 ring-primary/30",
              !isActive && !isDone && "bg-muted text-muted-foreground"
            )}>
              {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1 min-w-4", isDone ? "bg-emerald-300 dark:bg-emerald-700" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RonSession() {
  usePageTitle("RON Session");
  const { user, isAdmin, isNotary } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("id");
  const isAdminOrNotary = isAdmin || isNotary;

  const [oathType, setOathType] = useState<keyof typeof oathScripts>("jurat");
  const [oathAdministered, setOathAdministered] = useState(false);
  const [oathTimestamp, setOathTimestamp] = useState<string | null>(null);

  const [appointment, setAppointment] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commissionExpired, setCommissionExpired] = useState(false);

  // Session link
  const [participantLink, setParticipantLink] = useState<string | null>(null);
  const [sessionLink, setSessionLink] = useState("");
  const [sessionUniqueId, setSessionUniqueId] = useState<string | null>(null);

  // Recording consent (Ohio two-party consent, item 334-335)
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [recordingConsentAt, setRecordingConsentAt] = useState<string | null>(null);

  // ID Verification fields
  const [idVerified, setIdVerified] = useState(false);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiration, setIdExpiration] = useState("");

  const [kbaCompleted, setKbaCompleted] = useState(false);

  // Voice-to-notes
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const [sessionStatus, setSessionStatus] = useState<string>("scheduled");

  // Compute current step
  const currentStep = (() => {
    if (!participantLink) return 0;
    if (!idVerified || !kbaCompleted) return 1;
    if (!oathAdministered) return 2;
    return 3;
  })();

  // Load appointment data
  useEffect(() => {
    const loadData = async () => {
      if (!appointmentId) {
        setLoadError("No appointment ID provided. Please open this page from an appointment.");
        return;
      }

      const { data: appt, error: apptError } = await supabase.from("appointments").select("*").eq("id", appointmentId).single();
      if (apptError || !appt) {
        setLoadError("Appointment not found or you don't have access.");
        return;
      }

      setAppointment(appt);
      if (appt.admin_notes && isAdminOrNotary) setNotes(appt.admin_notes);

      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", appt.client_id).single();
      if (profile) setClientProfile(profile);

      // Load existing session data
      const { data: session } = await supabase.from("notarization_sessions").select("*").eq("appointment_id", appointmentId).single();
      if (session) {
        setIdVerified(session.id_verified || false);
        setKbaCompleted(session.kba_completed || false);
        setSessionStatus(session.status || "scheduled");
        if ((session as any).participant_link) setParticipantLink((session as any).participant_link);
        if ((session as any).session_unique_id) setSessionUniqueId((session as any).session_unique_id);
        if ((session as any).recording_consent) {
          setRecordingConsent(true);
          setRecordingConsentAt((session as any).recording_consent_at || null);
        }
      }

      // Check commission expiry (Ohio ORC §147.03)
      if (isAdminOrNotary) {
        const { data: expirySetting } = await supabase.from("platform_settings").select("setting_value").eq("setting_key", "commission_expiry_date").single();
        if (expirySetting?.setting_value) {
          const expiryDate = new Date(expirySetting.setting_value);
          if (expiryDate < new Date()) {
            setCommissionExpired(true);
          }
        }
      }
    };
    loadData();
  }, [appointmentId]);

  // Subscribe to realtime updates on notarization_sessions
  useEffect(() => {
    if (!appointmentId) return;
    const channel = supabase
      .channel(`session-${appointmentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notarization_sessions",
        filter: `appointment_id=eq.${appointmentId}`,
      }, (payload: any) => {
        const newRow = payload.new;
        if (newRow) {
          setSessionStatus(newRow.status || "scheduled");
          if (newRow.participant_link) setParticipantLink(newRow.participant_link);
          setIdVerified(newRow.id_verified || false);
          setKbaCompleted(newRow.kba_completed || false);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [appointmentId]);

  // Voice recognition setup
  useEffect(() => {
    if (!isAdminOrNotary) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            finalTranscriptRef.current += " " + transcript;
            setNotes((prev) => prev + " " + transcript);
          }
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
        toast({ title: "Voice recognition error", description: "Could not capture audio.", variant: "destructive" });
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isAdminOrNotary]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({ title: "Not supported", description: "Voice recognition is not available in this browser.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      finalTranscriptRef.current = "";
      recognitionRef.current.start();
      setIsListening(true);
      toast({ title: "Listening...", description: "Speak clearly — notes will be captured automatically." });
    }
  };

  const administerOath = async () => {
    const timestamp = new Date().toISOString();
    setOathAdministered(true);
    setOathTimestamp(timestamp);
    toast({ title: "Oath recorded", description: `Oath administered at ${new Date(timestamp).toLocaleTimeString()}` });

    if (appointmentId) {
      const oathNote = `\n[Oath: ${oathType} administered at ${new Date(timestamp).toLocaleTimeString()}]`;
      await supabase.from("appointments").update({ admin_notes: (notes || "") + oathNote }).eq("id", appointmentId);
    }
  };

  // Save session link
  const saveSessionLink = async () => {
    if (!appointmentId || !sessionLink.trim()) return;

    // Validate URL
    try {
      new URL(sessionLink.trim());
    } catch {
      toast({ title: "Invalid URL", description: "Please paste a valid URL starting with https://", variant: "destructive" });
      return;
    }

    setSaving(true);
    const link = sessionLink.trim();
    const { data: existing } = await supabase.from("notarization_sessions").select("id").eq("appointment_id", appointmentId).single();
    if (existing) {
      await supabase.from("notarization_sessions").update({
        participant_link: link,
        status: "confirmed" as any,
      }).eq("appointment_id", appointmentId);
    } else {
      await supabase.from("notarization_sessions").insert({
        appointment_id: appointmentId,
        session_type: "ron" as any,
        participant_link: link,
        status: "confirmed" as any,
      });
    }
    setParticipantLink(link);
    setSessionStatus("confirmed");
    setSaving(false);
    toast({ title: "Session link saved", description: "The client can now access this signing link from their portal." });
  };

  const saveSessionData = async () => {
    if (!appointmentId) {
      toast({ title: "No appointment linked", description: "Open this session from an appointment to save data.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await supabase.from("appointments").update({ admin_notes: notes }).eq("id", appointmentId);
    await supabase.from("notarization_sessions").update({
      id_verified: idVerified,
      kba_completed: kbaCompleted,
      status: oathAdministered ? ("completed" as any) : ("in_session" as any),
      completed_at: oathAdministered ? new Date().toISOString() : null,
    }).eq("appointment_id", appointmentId);

    await supabase.from("audit_log").insert({
      user_id: user?.id,
      action: "ron_session_saved",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: { oath_administered: oathAdministered, oath_type: oathType, oath_timestamp: oathTimestamp, id_verified: idVerified, kba_completed: kbaCompleted, notes_length: notes.length },
    });

    setSaving(false);
    toast({ title: "Session data saved", description: "Notes, oath, and verification status have been recorded." });
  };

  const completeAndFinalize = async () => {
    if (!appointmentId || !user || !appointment) return;
    if (!idVerified || !kbaCompleted) {
      toast({ title: "Cannot complete", description: "ID verification and KBA must both be completed before finalizing.", variant: "destructive" });
      return;
    }
    setCompleting(true);

    await supabase.from("appointments").update({ status: "completed" as any, admin_notes: notes }).eq("id", appointmentId);
    await supabase.from("notarization_sessions").update({ id_verified: true, kba_completed: true, status: "completed" as any, completed_at: new Date().toISOString() }).eq("appointment_id", appointmentId);
    await supabase.from("documents").update({ status: "notarized" as any }).eq("appointment_id", appointmentId);

    const fee = appointment.estimated_price || 5;

    await supabase.from("payments").insert({
      client_id: appointment.client_id,
      appointment_id: appointmentId,
      amount: fee,
      status: "pending",
      notes: `RON session completed — ${appointment.service_type}`,
    });

    await supabase.from("notary_journal").insert({
      appointment_id: appointmentId,
      created_by: user.id,
      signer_name: clientProfile?.full_name || "Unknown Signer",
      document_type: appointment.service_type || "General",
      service_performed: oathType === "acknowledgment" ? "acknowledgment" : oathType,
      notarization_type: "ron" as any,
      fees_charged: fee,
      oath_administered: oathAdministered,
      oath_timestamp: oathTimestamp,
      id_type: idType || null,
      id_number: idNumber || null,
      id_expiration: idExpiration || null,
      notes: notes || null,
    });

    const { data: docs } = await supabase.from("documents").select("id, file_name").eq("appointment_id", appointmentId).limit(1);
    if (docs && docs.length > 0) {
      await supabase.from("e_seal_verifications").insert({
        document_id: docs[0].id,
        document_name: docs[0].file_name,
        appointment_id: appointmentId,
        created_by: user.id,
        signer_name: clientProfile?.full_name || null,
        notary_name: "Notar",
        commissioned_state: "OH",
        status: "valid",
      });
    }

    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "ron_session_completed",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: { oath_type: oathType, oath_timestamp: oathTimestamp, id_type: idType },
    });

    setCompleting(false);
    toast({ title: "Session finalized", description: "Appointment completed, journal entry & e-seal created, documents marked as notarized." });
    navigate("/admin/appointments");
  };

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="font-sans text-xl font-bold text-foreground mb-2">Session Error</h2>
            <p className="text-sm text-muted-foreground mb-6">{loadError}</p>
            <Link to={isAdminOrNotary ? "/admin/appointments" : "/portal"}>
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Commission expired
  if (commissionExpired && isAdminOrNotary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="font-sans text-xl font-bold text-foreground mb-2">Commission Expired</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Your notary commission has expired. Per Ohio ORC §147.03, you cannot perform notarial acts with an expired commission.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please renew your commission and update the expiry date in Settings before starting a RON session.
            </p>
            <div className="flex gap-3">
              <Link to="/admin/settings"><Button variant="default">Update Settings</Button></Link>
              <Link to="/admin/appointments"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Client view
  if (!isAdminOrNotary) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border/50 bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Portal
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Secure RON Session</span>
            </div>
          </div>
        </nav>

        <div className="container mx-auto max-w-3xl px-4 py-8">
          {appointment && (
            <Card className="mb-4 border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-3 text-sm">
                <Badge className="bg-primary/20 text-primary-foreground">RON Session</Badge>
                <span>{appointment.service_type}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {new Date(appointment.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6 border-border/50">
            <CardContent className="p-6">
              <h2 className="mb-4 font-sans text-xl font-semibold">Session Checklist</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Government-Issued Photo ID Ready</p>
                    <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Camera & Microphone Access</p>
                    <p className="text-sm text-muted-foreground">Required for identity verification and session recording</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Knowledge-Based Authentication (KBA)</p>
                    <p className="text-sm text-muted-foreground">
                      You'll answer 5 identity verification questions from public records (4/5 correct within 2 minutes).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              {participantLink ? (
                <div className="space-y-4">
                  <Video className="mx-auto h-16 w-16 text-primary" />
                  <h3 className="font-sans text-xl font-semibold text-foreground">Your Session is Ready</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Click the button below to join your RON session. You'll complete ID verification and KBA within the platform.
                  </p>
                  <a href={participantLink} target="_blank" rel="noopener noreferrer">
                    <Button size="lg"><ExternalLink className="mr-2 h-5 w-5" /> Join RON Session</Button>
                  </a>
                  <p className="text-xs text-muted-foreground">Opens in a new tab — secure signing platform</p>
                </div>
              ) : (
                <>
                  <Monitor className="mb-4 h-16 w-16 text-primary/50" />
                  <h3 className="mb-2 font-sans text-xl font-semibold text-foreground">Waiting for Session</h3>
                  <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    Your notary will start the session shortly. You'll receive a signing link here once the document is ready.
                  </p>
                  <Badge variant="secondary">
                    {sessionStatus === "in_session" ? "Session Active" : "Waiting for Notary"}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin/Notary view
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/admin/appointments" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Appointments
          </Link>
          <div className="flex items-center gap-3">
            {clientProfile && (
              <span className="text-sm text-muted-foreground">Client: <span className="font-medium text-foreground">{clientProfile.full_name}</span></span>
            )}
            <Badge variant="outline" className="text-xs capitalize">{sessionStatus}</Badge>
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">RON Session</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {appointment && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-4 p-3 text-sm">
              <Badge className="bg-primary/20 text-primary-foreground">{appointment.notarization_type === "ron" ? "RON" : "In-Person"}</Badge>
              <span>{appointment.service_type}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {new Date(appointment.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main session area */}
          <div className="lg:col-span-2">
            {/* Step 1: Paste SignNow Link */}
            <Card className="mb-6 border-border/50">
              <CardContent className="p-6">
                <h2 className="mb-1 font-sans text-xl font-semibold flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" /> Session Link
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Open SignNow, prepare the document and signing session there, then paste the signing link below. The client will see this link in their portal.
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://app.signnow.com/webapp/document/..."
                    value={sessionLink}
                    onChange={(e) => setSessionLink(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveSessionLink} disabled={saving || !sessionLink.trim()}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                    Save Link
                  </Button>
                </div>

                {participantLink && (
                  <div className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Session link active — client can join</p>
                    </div>
                    <a href={participantLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                      {participantLink}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pre-notarization checklist */}
            <Card className="mb-6 border-border/50">
              <CardContent className="p-6">
                <h2 className="mb-4 font-sans text-xl font-semibold">Verification Checklist</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {participantLink ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Session Link {participantLink ? "✓ Active" : "— Paste above"}</p>
                      <p className="text-sm text-muted-foreground">SignNow signing link shared with client</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {idVerified ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Government-Issued Photo ID {idVerified ? "✓ Verified" : "— Pending"}</p>
                      <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {kbaCompleted ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Knowledge-Based Authentication (KBA) {kbaCompleted ? "✓ Passed" : "— Pending"}</p>
                      <p className="text-sm text-muted-foreground">Required under Ohio law (ORC §147.66). 5 identity questions via MISMO-compliant provider.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {oathAdministered ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Oath / Affirmation {oathAdministered ? "✓ Administered" : "— Pending"}</p>
                      <p className="text-sm text-muted-foreground">Administer the appropriate oath using the sidebar panel</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar tools */}
          <div className="space-y-4">
            {/* ID Verification Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" /> ID Verification
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="state_id">State ID</SelectItem>
                        <SelectItem value="military_id">Military ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">ID Number</Label>
                    <Input className="h-8 text-xs" placeholder="Last 4 digits..." value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Expiration Date</Label>
                    <Input type="date" className="h-8 text-xs" value={idExpiration} onChange={(e) => setIdExpiration(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={idVerified} onCheckedChange={setIdVerified} />
                    <Label className="text-xs">ID Verified — matches signer</Label>
                  </div>
                  {idVerified && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* KBA Status Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" /> Knowledge-Based Authentication
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={kbaCompleted} onCheckedChange={setKbaCompleted} />
                  <Label className="text-xs">KBA {kbaCompleted ? "Passed" : "Pending"}</Label>
                </div>
                {kbaCompleted ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs"><CheckCircle className="mr-1 h-3 w-3" /> KBA Passed</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs"><AlertCircle className="mr-1 h-3 w-3" /> Awaiting KBA</Badge>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  KBA is handled during the session. Toggle manually after confirmation.
                </p>
              </CardContent>
            </Card>

            {/* Digital Oath/Affirmation */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" /> Oath / Affirmation
                </h3>
                <div className="mb-3 flex flex-wrap gap-1">
                  {(Object.keys(oathScripts) as (keyof typeof oathScripts)[]).filter((k) => oathScripts[k]).map((key) => (
                    <Button key={key} size="sm" variant={oathType === key ? "default" : "outline"} className={`text-xs ${oathType === key ? "bg-primary text-primary-foreground" : ""}`} onClick={() => { setOathType(key); setOathAdministered(false); }}>
                      {key}
                    </Button>
                  ))}
                </div>
                {oathScripts[oathType] && (
                  <div className="mb-3 rounded-lg bg-muted/50 p-3">
                    <p className="text-xs italic text-muted-foreground">Script to read:</p>
                    <p className="mt-1 text-sm font-medium text-foreground">"{oathScripts[oathType]}"</p>
                  </div>
                )}
                {!oathAdministered ? (
                  <Button size="sm" className="w-full" onClick={administerOath}>Mark Oath Administered</Button>
                ) : (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2 text-center">
                    <p className="flex items-center justify-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="h-3 w-3" /> Oath administered at {oathTimestamp ? new Date(oathTimestamp).toLocaleTimeString() : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice-to-Notes */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-sans text-sm font-semibold"><Mic className="h-4 w-4 text-primary" /> Session Notes</h3>
                  <Button size="sm" variant={isListening ? "destructive" : "outline"} className="text-xs" onClick={toggleVoice}>
                    {isListening ? <><MicOff className="mr-1 h-3 w-3" /> Stop</> : <><Mic className="mr-1 h-3 w-3" /> Dictate</>}
                  </Button>
                </div>
                {isListening && <Badge variant="destructive" className="mb-2 text-xs animate-pulse">● Recording</Badge>}
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type or dictate session notes..." rows={6} className="text-sm" />
                <Button size="sm" className="mt-3 w-full" onClick={saveSessionData} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save Session Data
                </Button>
              </CardContent>
            </Card>

            {/* Complete & Finalize */}
            <Card className="border-border/50 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Complete & Finalize
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">Marks appointment as completed, creates journal entry, e-seal verification, and payment record.</p>
                <ul className="mb-3 space-y-1 text-xs">
                  <li className="flex items-center gap-1">{participantLink ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />} Session Link</li>
                  <li className="flex items-center gap-1">{idVerified ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />} ID Verification</li>
                  <li className="flex items-center gap-1">{kbaCompleted ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />} KBA Completed</li>
                  <li className="flex items-center gap-1">{oathAdministered ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />} Oath Administered</li>
                </ul>
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={!idVerified || !kbaCompleted || completing} onClick={completeAndFinalize}>
                  {completing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileCheck className="mr-1 h-4 w-4" />} Complete Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
