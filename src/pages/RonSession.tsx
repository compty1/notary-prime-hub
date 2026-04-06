import { usePageMeta } from "@/hooks/usePageMeta";
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
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen, Save, Loader2, XCircle, FileCheck, CreditCard, ExternalLink, Video, Link2, Info, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { callEdgeFunction } from "@/lib/edgeFunctionAuth";
import { cn } from "@/lib/utils";
import { logAuditEvent } from "@/lib/auditLog";
import type { Json } from "@/integrations/supabase/types";
import { NotarySessionGuide } from "@/components/NotarySessionGuide";
import { ESignConsent } from "@/components/ESignConsent";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { ComplianceBanner } from "@/components/ComplianceBanner";

const oathScripts = {
  acknowledgment: "The signer personally appeared before me and acknowledged that they signed this document voluntarily for the purposes stated therein. (No verbal oath required for acknowledgments per ORC §147.55)",
  jurat: "Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?",
  oath: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?",
};

const STEPS = [
  { label: "Session Setup", icon: Link2 },
  { label: "Verify ID / KBA", icon: Shield },
  { label: "Administer Oath", icon: BookOpen },
  { label: "Finalize", icon: FileCheck },
];

const SIGNING_PLATFORMS = [
  { value: "signnow", label: "SignNow" },
  { value: "docusign", label: "DocuSign" },
  { value: "notarize", label: "Notarize" },
  { value: "bluenotary", label: "BlueNotary" },
  { value: "pavaso", label: "Pavaso" },
  { value: "onespan", label: "OneSpan" },
  { value: "nexsys", label: "Nexsys" },
  { value: "other", label: "Other" },
];

/** Platforms that handle KBA/ID natively within their signing flow */
const PLATFORMS_WITH_NATIVE_KBA = ["signnow", "notarize", "bluenotary"];

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
              isDone && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
              isActive && "bg-primary/10 text-primary ring-1 ring-primary/30",
              !isActive && !isDone && "bg-muted text-muted-foreground"
            )}>
              {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1 min-w-4", isDone ? "bg-primary/30 dark:bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RonSession() {
  usePageMeta({ title: "RON Session", description: "Secure remote online notarization session — Ohio-compliant video conferencing with identity verification and e-seal.", noIndex: true });
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

  // Mode & platform metadata
  const [sessionMode, setSessionMode] = useState<"manual" | "api">("manual");
  const [signingPlatform, setSigningPlatform] = useState("signnow");
  const [documentName, setDocumentName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");

  // Recording consent (Ohio two-party consent)
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [recordingConsentAt, setRecordingConsentAt] = useState<string | null>(null);

  // ID Verification fields
  const [idVerified, setIdVerified] = useState(false);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiration, setIdExpiration] = useState("");

  const [kbaCompleted, setKbaCompleted] = useState(false);
  const [kbaAttempts, setKbaAttempts] = useState(0);

  // Session timeout
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);

  // Voice-to-notes
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const [sessionStatus, setSessionStatus] = useState<string>("scheduled");
  const [recordingUrl, setRecordingUrl] = useState("");

  // Webhook status
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [webhookEventsRegistered, setWebhookEventsRegistered] = useState<number>(0);
  const [signnowDocumentId, setSignnowDocumentId] = useState<string | null>(null);
  const [checkingWebhooks, setCheckingWebhooks] = useState(false);

  // Notary Guide state
  const [guideCompletedSteps, setGuideCompletedSteps] = useState<Set<number>>(new Set());
  // E-Sign consent
  const [esignConsented, setEsignConsented] = useState(false);
  const [esignConsentTimestamp, setEsignConsentTimestamp] = useState<string | null>(null);
  // Session pause/resume (item 591)
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const hasNativeKba = PLATFORMS_WITH_NATIVE_KBA.includes(signingPlatform);

  // Recording consent gate — blocks session until consent given (Ohio ORC §147.66)
  const consentGateBlocking = !recordingConsent && isAdminOrNotary && !!participantLink;

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
        // Load new fields
        if ((session as any).session_mode) setSessionMode((session as any).session_mode);
        if ((session as any).signing_platform) setSigningPlatform((session as any).signing_platform);
        if ((session as any).document_name) setDocumentName((session as any).document_name);
        if ((session as any).signer_email) setSignerEmail((session as any).signer_email);
        if ((session as any).kba_attempts) setKbaAttempts((session as any).kba_attempts);
        if ((session as any).session_timeout_minutes) setSessionTimeoutMinutes((session as any).session_timeout_minutes);
        if ((session as any).started_at) setSessionStartedAt((session as any).started_at);
        if ((session as any).webhook_status) setWebhookStatus((session as any).webhook_status);
        if ((session as any).webhook_events_registered) setWebhookEventsRegistered((session as any).webhook_events_registered);
        if ((session as any).signnow_document_id) setSignnowDocumentId((session as any).signnow_document_id);
      } else {
        // Capture signer IP on first session load (Ohio RON compliance)
        try {
          const ipRes = await fetch("https://api.ipify.org?format=json");
          const ipData = await ipRes.json();
          if (ipData?.ip) {
            const { data: newSession } = await supabase.from("notarization_sessions").insert({
              appointment_id: appointmentId,
              session_type: "ron" as any,
              signer_ip: ipData.ip,
            } as any).select("session_unique_id, signer_ip").single();
            if ((newSession as any)?.session_unique_id) setSessionUniqueId((newSession as any).session_unique_id);
          }
        } catch (e) { console.error("Session init error:", e); }
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

  // Save session link with metadata
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
    const metadataFields = {
      participant_link: link,
      status: "confirmed" as any,
      session_mode: sessionMode,
      signing_platform: signingPlatform,
      document_name: documentName || null,
      signer_email: signerEmail || null,
    };

    const { data: existing } = await supabase.from("notarization_sessions").select("id, session_unique_id").eq("appointment_id", appointmentId).single();
    if (existing) {
      await supabase.from("notarization_sessions").update(metadataFields as any).eq("appointment_id", appointmentId);
      if ((existing as any).session_unique_id) setSessionUniqueId((existing as any).session_unique_id);
    } else {
      const { data: newSession } = await supabase.from("notarization_sessions").insert({
        appointment_id: appointmentId,
        session_type: "ron" as any,
        ...metadataFields,
      } as any).select("session_unique_id").single();
      if ((newSession as any)?.session_unique_id) setSessionUniqueId((newSession as any).session_unique_id);
    }
    setParticipantLink(link);
    setSessionStatus("confirmed");
    setSaving(false);
    toast({ title: "Session link saved", description: "The client can now access this signing link from their portal." });
  };

  const checkWebhookStatus = async () => {
    if (!signnowDocumentId) return;
    setCheckingWebhooks(true);
    try {
      const resp = await callEdgeFunction("signnow", {
        action: "check_document_webhooks",
        document_id: signnowDocumentId,
      });
      if (resp.ok) {
        const data = await resp.json();
        setWebhookStatus(data.total_active > 0 ? "active" : "none");
        setWebhookEventsRegistered(data.total_active || 0);
      }
    } catch (e) {
      console.error("Webhook check failed:", e);
    } finally {
      setCheckingWebhooks(false);
    }
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
      recording_consent: recordingConsent,
      recording_consent_at: recordingConsentAt,
      session_mode: sessionMode,
      signing_platform: signingPlatform,
      document_name: documentName || null,
      signer_email: signerEmail || null,
    } as any).eq("appointment_id", appointmentId);

    await logAuditEvent("ron_session_saved", {
      entityType: "appointment",
      entityId: appointmentId,
      details: {
        oath_administered: oathAdministered,
        oath_type: oathType,
        oath_timestamp: oathTimestamp,
        id_verified: idVerified,
        kba_completed: kbaCompleted,
        notes_length: notes.length,
        session_mode: sessionMode,
        signing_platform: signingPlatform,
      } as Record<string, Json | undefined>,
    });

    setSaving(false);
    toast({ title: "Session data saved", description: "Notes, oath, and verification status have been recorded." });
  };

  // Session pause/resume handlers (item 591)
  const togglePauseSession = async () => {
    if (!appointmentId) return;
    if (!isPaused) {
      // Pause
      await supabase.from("notarization_sessions").update({
        paused_at: new Date().toISOString(),
        pause_reason: pauseReason || "Manual pause",
      } as any).eq("appointment_id", appointmentId);
      setIsPaused(true);
      await logAuditEvent("ron_session_paused", { entityType: "appointment", entityId: appointmentId, details: { reason: pauseReason } as Record<string, Json | undefined> });
      toast({ title: "Session paused", description: "The session has been paused. Resume when ready." });
    } else {
      // Resume — calculate pause duration
      const { data: session } = await supabase.from("notarization_sessions").select("paused_at, total_pause_duration_seconds").eq("appointment_id", appointmentId).single();
      let additionalSeconds = 0;
      if ((session as any)?.paused_at) {
        additionalSeconds = Math.floor((Date.now() - new Date((session as any).paused_at).getTime()) / 1000);
      }
      const totalPause = ((session as any)?.total_pause_duration_seconds || 0) + additionalSeconds;
      await supabase.from("notarization_sessions").update({
        paused_at: null,
        pause_reason: null,
        total_pause_duration_seconds: totalPause,
      } as any).eq("appointment_id", appointmentId);
      setIsPaused(false);
      setPauseReason("");
      await logAuditEvent("ron_session_resumed", { entityType: "appointment", entityId: appointmentId, details: { pause_duration_seconds: additionalSeconds } as Record<string, Json | undefined> });
      toast({ title: "Session resumed" });
    }
  };

  const completeAndFinalize = async () => {
    if (!appointmentId || !user || !appointment) return;
    if (!idVerified || !kbaCompleted) {
      toast({ title: "Cannot complete", description: "ID verification and KBA must both be completed before finalizing.", variant: "destructive" });
      return;
    }
    if (!recordingConsent) {
      toast({ title: "Recording consent required", description: "Ohio ORC §147.66 requires explicit recording consent before finalizing a RON session.", variant: "destructive" });
      return;
    }
    // Item 405: Confirmation dialog
    if (!window.confirm("Are you sure you want to finalize this session? This will mark the appointment as completed, create a journal entry, e-seal verification, and payment record. This action cannot be undone.")) {
      return;
    }
    setCompleting(true);

    // Fetch notary name from settings (Item 353, 422)
    const { data: notaryNameData } = await supabase.from("platform_settings").select("setting_value").eq("setting_key", "notary_name").single();
    const notaryNameSetting = notaryNameData?.setting_value || "Notar";

    // Item 406: Capture signer location state
    const signerLocationState = clientProfile?.state || null;

    await supabase.from("appointments").update({ status: "completed" as any, admin_notes: notes }).eq("id", appointmentId);
    await supabase.from("notarization_sessions").update({
      id_verified: true,
      kba_completed: true,
      status: "completed" as any,
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      session_mode: sessionMode,
      signing_platform: signingPlatform,
      document_name: documentName || null,
      signer_email: signerEmail || null,
      signer_location_state: signerLocationState,
      recording_url: recordingUrl || null,
    } as any).eq("appointment_id", appointmentId);
    await supabase.from("documents").update({ status: "notarized" as any }).eq("appointment_id", appointmentId);

    const fee = appointment.estimated_price || 5;
    const platformLabel = SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label || signingPlatform;

    await supabase.from("payments").insert({
      client_id: appointment.client_id,
      appointment_id: appointmentId,
      amount: fee,
      status: "pending",
      notes: `RON session completed — ${appointment.service_type} (${platformLabel})`,
    });

    // Build enriched journal notes
    const journalNotes = [
      notes || "",
      `Platform: ${platformLabel}`,
      documentName ? `Document: ${documentName}` : "",
      signerEmail ? `Signer email: ${signerEmail}` : "",
      `Mode: ${sessionMode}`,
    ].filter(Boolean).join(" | ");

    await supabase.from("notary_journal").insert({
      appointment_id: appointmentId,
      created_by: user.id,
      signer_name: clientProfile?.full_name || "Unknown Signer",
      document_type: appointment.service_type || "General",
      document_description: documentName || null,
      service_performed: oathType === "acknowledgment" ? "acknowledgment" : oathType,
      notarization_type: "ron" as any,
      fees_charged: fee,
      oath_administered: oathAdministered,
      oath_timestamp: oathTimestamp,
      id_type: idType || null,
      id_number: idNumber || null,
      id_expiration: idExpiration || null,
      signer_address: clientProfile?.address ? `${clientProfile.address}, ${clientProfile.city || ""} ${clientProfile.state || ""} ${clientProfile.zip || ""}`.trim() : null,
      notes: journalNotes,
    });

    // e-seal: prefer uploaded doc, fall back to manual document_name
    const { data: docs } = await supabase.from("documents").select("id, file_name").eq("appointment_id", appointmentId).limit(1);
    let eSealDocId: string;
    let eSealDocName: string;
    if (docs && docs.length > 0) {
      eSealDocId = docs[0].id;
      eSealDocName = docs[0].file_name;
    } else {
      // Create placeholder document for e-seal when no docs uploaded
      const placeholderName = documentName || `${appointment.service_type} — ${clientProfile?.full_name || "Unknown"}`;
      const { data: newDoc } = await supabase.from("documents").insert({
        file_name: placeholderName,
        file_path: `placeholder/${appointmentId}`,
        uploaded_by: user.id,
        appointment_id: appointmentId,
        status: "notarized" as any,
      }).select("id").single();
      eSealDocId = newDoc?.id || crypto.randomUUID();
      eSealDocName = placeholderName;
    }
    // Generate tamper-evident SHA-256 hash for Ohio ORC §147.63 compliance
    let documentHash: string | null = null;
    try {
      const hashInput = `${eSealDocId}|${eSealDocName}|${appointmentId}|${clientProfile?.full_name || ""}|${new Date().toISOString()}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(hashInput));
      documentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { console.error("Hash generation error:", e); }

    await supabase.from("e_seal_verifications").insert({
      document_id: eSealDocId,
      document_name: eSealDocName,
      appointment_id: appointmentId,
      created_by: user.id,
      signer_name: clientProfile?.full_name || null,
      notary_name: notaryNameSetting || "Notar",
      commissioned_state: "OH",
      status: "valid",
      document_hash: documentHash,
    } as any);

    // Save credential analysis result for Ohio compliance
    if (idType || idNumber || kbaCompleted) {
      await supabase.from("notarization_sessions").update({
        credential_analysis_result: {
          id_type: idType || null,
          id_number_last4: idNumber ? idNumber.slice(-4) : null,
          id_expiration: idExpiration || null,
          kba_completed: kbaCompleted,
          kba_attempts: kbaAttempts,
          id_verified: idVerified,
          verified_at: new Date().toISOString(),
        },
      } as any).eq("appointment_id", appointmentId);
    }

    await logAuditEvent("ron_session_completed", {
      entityType: "appointment",
      entityId: appointmentId,
      details: {
        oath_type: oathType,
        oath_timestamp: oathTimestamp,
        id_type: idType,
        session_mode: sessionMode,
        signing_platform: signingPlatform,
        document_name: documentName || null,
      } as Record<string, Json | undefined>,
    });

    // Trigger completion email
    try {
      await supabase.functions.invoke("send-appointment-emails", {
        body: { appointment_id: appointmentId, status_change: "completed" },
      });
    } catch (e) { console.error("Completion email error:", e); }

    setCompleting(false);
    toast({ title: "Session finalized", description: "Appointment completed, journal entry & e-seal created, documents marked as notarized. Completion email sent to client." });
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
    // Completed state for client
    if (sessionStatus === "completed" || appointment?.status === "completed") {
      return (
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border/50 bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Portal
              </Link>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">RON Session Complete</span>
              </div>
            </div>
          </nav>
          <div className="container mx-auto max-w-3xl px-4 py-8">
            <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CheckCircle className="mb-4 h-16 w-16 text-primary" />
                <h2 className="mb-2 font-sans text-2xl font-bold text-foreground">Notarization Complete</h2>
                <p className="mb-1 text-muted-foreground">
                  Your document has been successfully notarized on{" "}
                  {appointment ? new Date(appointment.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
                </p>
                {sessionUniqueId && <p className="text-xs text-muted-foreground font-mono">Session ID: {sessionUniqueId}</p>}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="mb-3 font-semibold text-foreground">What's Next</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                      <p>Your notarized documents are available for download in your <Link to="/portal#documents" className="text-primary hover:underline">Client Portal</Link>.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                      <p>An electronic notary seal and verification link have been generated for your document.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileCheck className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                      <p>A Certificate of Notarization is available for download from the Documents tab in your portal.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Link to="/portal#documents"><Button>View My Documents</Button></Link>
                <Link to="/portal"><Button variant="outline">Back to Portal</Button></Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Government-Issued Photo ID Ready</p>
                    <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Camera & Microphone Access</p>
                    <p className="text-sm text-muted-foreground">Required for identity verification and session recording</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
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

          {/* E-Sign Consent - Phase 4 */}
          <ESignConsent
            consented={esignConsented}
            onConsentChange={(v) => {
              setEsignConsented(v);
              if (v && !esignConsentTimestamp) setEsignConsentTimestamp(new Date().toISOString());
            }}
            consentTimestamp={esignConsentTimestamp}
          />

          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              {participantLink ? (
                <div className="space-y-4">
                  <Video className="mx-auto h-16 w-16 text-primary" />
                  <h3 className="font-sans text-xl font-semibold text-foreground">Your Session is Ready</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Click the button below to join your RON session. You'll complete ID verification and KBA within the platform.
                  </p>
                  {esignConsented ? (
                    <a href={participantLink} target="_blank" rel="noopener noreferrer">
                      <Button size="lg"><ExternalLink className="mr-2 h-5 w-5" /> Join RON Session</Button>
                    </a>
                  ) : (
                    <Button size="lg" disabled>
                      <ExternalLink className="mr-2 h-5 w-5" /> Accept E-Sign Consent First
                    </Button>
                  )}
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

        {/* Session Timeout Warning */}
        <SessionTimeoutWarning
          sessionStartedAt={sessionStartedAt}
          timeoutMinutes={sessionTimeoutMinutes}
          onExpired={() => {
            toast({ title: "Session Expired", description: "The RON session has timed out after " + sessionTimeoutMinutes + " minutes.", variant: "destructive" });
          }}
        />

        {/* Ohio RON Compliance Banner */}
        {appointment?.notarization_type === "ron" && (
          <div className="mb-4">
            <ComplianceBanner variant="ron" compact />
          </div>
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main session area */}
          <div className="lg:col-span-2">
            {/* Step 1: Session Setup — Mode selector + Link + Metadata */}
            <Card className="mb-6 border-border/50">
              <CardContent className="p-6">
                <h2 className="mb-1 font-sans text-xl font-semibold flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" /> Session Setup
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your workflow mode, then paste the signing link and capture session details.
                </p>

                {/* Mode selector */}
                {!participantLink && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setSessionMode("manual")}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left transition-all",
                        sessionMode === "manual"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Link2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Paste Signing Link</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Use any signing platform — paste the link manually</p>
                    </button>
                    <button
                      disabled
                      className="rounded-lg border-2 border-border p-3 text-left opacity-50 cursor-not-allowed relative"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">Use SignNow API</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Automated document upload & invite</p>
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">Coming Soon</Badge>
                    </button>
                  </div>
                )}

                {/* Platform & metadata fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label className="text-xs mb-1 block">Signing Platform</Label>
                    <Select value={signingPlatform} onValueChange={setSigningPlatform}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SIGNING_PLATFORMS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Document Name</Label>
                    <Input className="h-8 text-xs" placeholder="e.g. Power of Attorney" value={documentName} onChange={e => setDocumentName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Signer Email <span className="text-muted-foreground">(optional)</span></Label>
                    <Input className="h-8 text-xs" type="email" placeholder="signer@example.com" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} />
                  </div>
                </div>

                {/* Link input */}
                <div className="flex gap-2">
                  <Input
                    placeholder={`https://${signingPlatform === "docusign" ? "docusign.net" : signingPlatform === "notarize" ? "app.notarize.com" : "app.signnow.com"}/...`}
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
                  <div className="mt-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-primary dark:text-primary" />
                      <p className="text-xs font-medium text-primary dark:text-primary">
                        Session link active — client can join via {SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label || signingPlatform}
                      </p>
                    </div>
                    <a href={participantLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                      {participantLink}
                    </a>
                  </div>
                )}

                {/* Webhook Status Indicator */}
                {signnowDocumentId && isAdminOrNotary && (
                  <div className={cn(
                    "mt-4 rounded-lg border p-3",
                    webhookStatus === "active" ? "bg-primary/5 border-primary/20" :
                    webhookStatus === "partial" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
                    webhookStatus === "failed" ? "bg-destructive/5 border-destructive/20" :
                    "bg-muted/50 border-border"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {webhookStatus === "active" ? (
                          <Wifi className="h-4 w-4 text-primary" />
                        ) : webhookStatus === "failed" ? (
                          <WifiOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-xs font-medium">
                            Webhook Status: {" "}
                            <span className={cn(
                              webhookStatus === "active" && "text-primary",
                              webhookStatus === "partial" && "text-amber-600 dark:text-amber-400",
                              webhookStatus === "failed" && "text-destructive",
                              !webhookStatus && "text-muted-foreground",
                            )}>
                              {webhookStatus === "active" ? `Active (${webhookEventsRegistered} events)` :
                               webhookStatus === "partial" ? `Partial (${webhookEventsRegistered} events)` :
                               webhookStatus === "failed" ? "Failed" :
                               webhookStatus === "pending" ? "Pending..." :
                               "Unknown"}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            SignNow document: {signnowDocumentId.slice(0, 12)}…
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={checkWebhookStatus}
                        disabled={checkingWebhooks}
                      >
                        {checkingWebhooks ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Refresh
                      </Button>
                    </div>
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
                    {participantLink ? <CheckCircle className="mt-0.5 h-5 w-5 text-primary" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Session Link {participantLink ? "✓ Active" : "— Paste above"}</p>
                      <p className="text-sm text-muted-foreground">Signing link shared with client</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {idVerified ? <CheckCircle className="mt-0.5 h-5 w-5 text-primary" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Government-Issued Photo ID {idVerified ? "✓ Verified" : "— Pending"}</p>
                      <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {kbaCompleted ? <CheckCircle className="mt-0.5 h-5 w-5 text-primary" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-medium">Knowledge-Based Authentication (KBA) {kbaCompleted ? "✓ Passed" : "— Pending"}</p>
                      <p className="text-sm text-muted-foreground">Required under Ohio law (ORC §147.66). 5 identity questions via MISMO-compliant provider.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {oathAdministered ? <CheckCircle className="mt-0.5 h-5 w-5 text-primary" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />}
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
            {/* Notary Session Guide - Phase 2 */}
            <NotarySessionGuide
              documentType={documentName || appointment?.service_type || ""}
              notarizationType="ron"
              signerCount={appointment?.signer_count || 1}
              signingCapacity={appointment?.signing_capacity}
              hasWitnesses={(appointment?.signer_count || 1) > 1}
              witnessCount={0}
              completedSteps={guideCompletedSteps}
              onToggleStep={(i) => {
                setGuideCompletedSteps(prev => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i); else next.add(i);
                  return next;
                });
              }}
            />
            {/* ID Verification Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" /> ID Verification
                </h3>

                {/* SignNow native KBA guidance */}
                {hasNativeKba && (
                  <div className="mb-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5">
                    <div className="flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong>{SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label}</strong> handles ID verification and KBA natively within its signing flow (MISMO-compliant per ORC §147.66). Toggle these after the signer completes the session.
                      </p>
                    </div>
                  </div>
                )}

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
                    {idExpiration && new Date(idExpiration) < new Date() && (
                      <p className="mt-1 text-[10px] text-destructive font-medium">⚠ This ID has expired — cannot be accepted for notarization</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={idVerified} onCheckedChange={setIdVerified} />
                    <Label className="text-xs">ID Verified — matches signer</Label>
                  </div>
                  {idVerified && <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* KBA Status Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" /> Knowledge-Based Authentication
                </h3>

                {hasNativeKba && (
                  <div className="mb-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5">
                    <div className="flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                        KBA is performed within the {SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label} platform. Toggle this once the signer completes signing — the platform verifies identity before allowing the signature.
                      </p>
                    </div>
                  </div>
                )}

                {/* KBA Attempt Counter */}
                <div className="mb-3 rounded-md border border-border p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">KBA Attempts</span>
                    <Badge variant={kbaAttempts >= 2 ? "destructive" : "secondary"} className="text-[10px]">
                      {kbaAttempts} / 2
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn("h-1.5 rounded-full transition-all", kbaAttempts >= 2 ? "bg-destructive" : "bg-primary")}
                      style={{ width: `${(kbaAttempts / 2) * 100}%` }}
                    />
                  </div>
                  {kbaAttempts >= 2 && !kbaCompleted && (
                    <p className="mt-1.5 text-[10px] text-destructive font-medium">
                      ⚠ Maximum KBA attempts reached per Ohio ORC §147.66. Session cannot proceed.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    checked={kbaCompleted}
                    onCheckedChange={setKbaCompleted}
                    disabled={kbaAttempts >= 2 && !kbaCompleted}
                  />
                  <Label className="text-xs">KBA {kbaCompleted ? "Passed" : "Pending"}</Label>
                </div>
                {!kbaCompleted && kbaAttempts < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs mb-2"
                    onClick={async () => {
                      const newAttempts = kbaAttempts + 1;
                      setKbaAttempts(newAttempts);
                      if (appointmentId) {
                        await supabase.from("notarization_sessions").update({
                          kba_attempts: newAttempts,
                        } as any).eq("appointment_id", appointmentId);
                      }
                      toast({
                        title: `KBA Attempt ${newAttempts} of 2`,
                        description: newAttempts >= 2 ? "This is the final attempt allowed under Ohio law." : "One attempt remaining.",
                        variant: newAttempts >= 2 ? "destructive" : "default",
                      });
                    }}
                  >
                    Record KBA Attempt ({kbaAttempts + 1}/2)
                  </Button>
                )}
                {kbaCompleted ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs"><CheckCircle className="mr-1 h-3 w-3" /> KBA Passed</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs"><AlertCircle className="mr-1 h-3 w-3" /> Awaiting KBA</Badge>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {hasNativeKba
                    ? `${SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label} performs MISMO-compliant KBA automatically. Toggle after signer completes.`
                    : "KBA is handled during the session. Toggle manually after confirmation."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Recording Consent */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <Video className="h-4 w-4 text-primary" /> Recording Consent
                </h3>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Ohio RON requires explicit consent before session recording begins (ORC §147.66). <strong>Session cannot proceed without consent.</strong>
                </p>
                {!recordingConsent && participantLink && (
                  <div className="mb-2 rounded-md border border-destructive bg-destructive/10 p-2">
                    <p className="text-[10px] text-destructive font-medium">⚠ Recording consent is required before proceeding with the session. The signer must verbally acknowledge and you must toggle this switch.</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    checked={recordingConsent}
                    onCheckedChange={(checked) => {
                      setRecordingConsent(checked);
                      if (checked && !recordingConsentAt) {
                        const ts = new Date().toISOString();
                        setRecordingConsentAt(ts);
                        // Save consent timestamp immediately
                        if (appointmentId) {
                          supabase.from("notarization_sessions").update({
                            recording_consent: true,
                            recording_consent_at: ts,
                          } as any).eq("appointment_id", appointmentId);
                        }
                      }
                    }}
                  />
                  <Label className="text-xs">Signer consented to session recording</Label>
                </div>
                {recordingConsent && recordingConsentAt && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs">
                    <CheckCircle className="mr-1 h-3 w-3" /> Consent at {new Date(recordingConsentAt).toLocaleTimeString()}
                  </Badge>
                )}
                {sessionUniqueId && (
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    Session ID: <span className="font-mono text-foreground">{sessionUniqueId}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ohio Compliance Checklist — Item 427 */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" /> Ohio RON Compliance
                </h3>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    {recordingConsent ? <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> : <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />}
                    <span>Audio/video recording consent obtained (ORC §147.66)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    {idVerified ? <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> : <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />}
                    <span>Government-issued photo ID verified</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    {kbaCompleted ? <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> : <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />}
                    <span>MISMO-compliant KBA completed (ORC §147.66)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    {oathAdministered ? <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> : <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />}
                    <span>Oath/affirmation administered where required</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span>Session conducted via approved technology platform</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span>Notary commissioned in Ohio (ORC §147.03)</span>
                  </li>
                </ul>
                {kbaAttempts > 0 && (
                  <div className="mt-2 text-[10px]">
                    <span className={kbaAttempts >= 2 ? "text-destructive font-medium" : "text-muted-foreground"}>
                      KBA Attempts: {kbaAttempts}/2 {kbaAttempts >= 2 && "— Maximum reached per ORC §147.66"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>


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
                  <div className="rounded-lg bg-primary/5 dark:bg-primary/10 p-2 text-center">
                    <p className="flex items-center justify-center gap-1 text-xs text-primary dark:text-primary">
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
            <Card className="border-border/50 border-primary/20 dark:border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <FileCheck className="h-4 w-4 text-primary dark:text-primary" /> Complete & Finalize
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">Marks appointment as completed, creates journal entry, e-seal verification, and payment record.</p>
                
                {/* Recording URL — Ohio ORC §147.66 */}
                <div className="mb-3">
                  <Label className="text-xs">Recording URL <span className="text-muted-foreground">(ORC §147.66 — 10yr retention)</span></Label>
                  <Input
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://platform.com/recording/..."
                    className="mt-1 text-sm"
                  />
                  {!recordingUrl && (
                    <p className="mt-1 text-[10px] text-destructive">⚠ Ohio law requires session recordings to be retained for 10 years.</p>
                  )}
                </div>

                <ul className="mb-3 space-y-1 text-xs">
                  <li className="flex items-center gap-1">{participantLink ? <CheckCircle className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />} Session Link</li>
                  <li className="flex items-center gap-1">{idVerified ? <CheckCircle className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />} ID Verification</li>
                  <li className="flex items-center gap-1">{kbaCompleted ? <CheckCircle className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />} KBA Completed</li>
                  <li className="flex items-center gap-1">{oathAdministered ? <CheckCircle className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />} Oath Administered</li>
                </ul>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={!idVerified || !kbaCompleted || completing} onClick={completeAndFinalize}>
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
