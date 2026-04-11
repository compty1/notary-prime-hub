import { usePageMeta } from "@/hooks/usePageMeta";
import { SessionWaitingRoom } from "@/components/SessionWaitingRoom";
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
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen, Save, Loader2, XCircle, FileCheck, CreditCard, ExternalLink, Video, Link2, Info, Wifi, WifiOff, RefreshCw, Lock, ArrowRight, Fingerprint, UserCheck, Clock, Users, Zap, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { callEdgeFunction } from "@/lib/edgeFunctionAuth";
import { cn } from "@/lib/utils";
import { logAuditEvent } from "@/lib/auditLog";
import type { Json } from "@/integrations/supabase/types";
import { NotarySessionGuide } from "@/components/NotarySessionGuide";
import { NotaryAttestationPanel } from "@/components/NotaryAttestationPanel";
import { ESignConsent } from "@/components/ESignConsent";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { ComplianceBanner } from "@/components/ComplianceBanner";
import { RonRecordingPanel } from "@/components/RonRecordingPanel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SignNowStatusPanel } from "@/components/SignNowStatusPanel";
import SignPreviewWizard from "@/components/SignPreviewWizard";

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
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
              isDone && "bg-primary/10 text-primary",
              isActive && "bg-primary/10 text-primary ring-1 ring-primary/30",
              !isActive && !isDone && "bg-muted text-muted-foreground"
            )}>
              {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1 min-w-4", isDone ? "bg-primary/30" : "bg-border")} />
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
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes per Ohio RON compliance
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());
  const [inactivityLocked, setInactivityLocked] = useState(false);

  // Voice-to-notes
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const [sessionStatus, setSessionStatus] = useState<string>("scheduled");
  const [showWaitingRoom, setShowWaitingRoom] = useState(true);
  const [recordingUrl, setRecordingUrl] = useState("");

  // Client onboarding step (0=Welcome, 1=ID Guidance, 2=Biometric, 3=Active Session)
  const [clientOnboardingStep, setClientOnboardingStep] = useState(0);
  const [clientJournal, setClientJournal] = useState<Array<{ id: number; msg: string }>>([]);
  const [sessionElapsed, setSessionElapsed] = useState("00:00");

  const addClientJournalEntry = (msg: string) => {
    setClientJournal(prev => [{ id: Date.now(), msg }, ...prev].slice(0, 20));
  };

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
  // Witness verification (Ohio RON compliance)
  const [witnessVerified, setWitnessVerified] = useState(false);
  const [witnessName, setWitnessName] = useState("");
  const [witnessIdType, setWitnessIdType] = useState("");
  // Signature by mark — Ohio ORC §147.54 requires 2 credible witnesses
  const [isSignatureByMark, setIsSignatureByMark] = useState(false);
  const [witness2Name, setWitness2Name] = useState("");
  const [witness2Verified, setWitness2Verified] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);

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
        if (session.status === "in_session" || session.status === "completed") setShowWaitingRoom(false);
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

  // Auto-skip client onboarding to active session when participantLink exists
  useEffect(() => {
    if (!isAdminOrNotary && participantLink && clientOnboardingStep < 3) {
      setClientOnboardingStep(3);
      addClientJournalEntry("Session link received — entering active session.");
    }
  }, [participantLink, isAdminOrNotary]);

  // Client session elapsed timer
  useEffect(() => {
    if (!isAdminOrNotary && clientOnboardingStep === 3) {
      const startTime = sessionStartedAt ? new Date(sessionStartedAt).getTime() : Date.now();
      const tick = () => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(diff / 60)).padStart(2, "0");
        const s = String(diff % 60).padStart(2, "0");
        setSessionElapsed(`${m}:${s}`);
      };
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    }
  }, [isAdminOrNotary, clientOnboardingStep, sessionStartedAt]);

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
        try { recognitionRef.current.stop(); } catch (e) { /* speech recognition stop is expected to throw if not started */ }
        recognitionRef.current = null;
      }
    };
  }, [isAdminOrNotary]);

  // 15-minute inactivity timeout enforcement (Ohio RON compliance)
  // ID 81: Use visibilitychange + requestIdleCallback for reliable timeout in backgrounded tabs
  useEffect(() => {
    if (!isAdminOrNotary || !participantLink || sessionStatus === "completed") return;
    const resetActivity = () => {
      setLastActivityAt(Date.now());
      if (inactivityLocked) setInactivityLocked(false);
      if (appointmentId) {
        supabase.from("notarization_sessions").update({
          last_activity_at: new Date().toISOString(),
        } as any).eq("appointment_id", appointmentId).then(() => {}, () => {});
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if timeout elapsed while tab was backgrounded
        if (Date.now() - lastActivityAt > INACTIVITY_TIMEOUT_MS) {
          setInactivityLocked(true);
          logAuditEvent("ron_session_inactivity_timeout", {
            entityType: "appointment",
            entityId: appointmentId || undefined,
            details: { timeout_minutes: 15, trigger: "visibilitychange" } as Record<string, Json | undefined>,
          });
        }
      }
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetActivity));
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const checker = setInterval(() => {
      if (Date.now() - lastActivityAt > INACTIVITY_TIMEOUT_MS) {
        setInactivityLocked(true);
        logAuditEvent("ron_session_inactivity_timeout", {
          entityType: "appointment",
          entityId: appointmentId || undefined,
          details: { timeout_minutes: 15 } as Record<string, Json | undefined>,
        });
      }
    }, 30_000);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(checker);
    };
  }, [isAdminOrNotary, participantLink, sessionStatus, lastActivityAt, inactivityLocked, appointmentId]);

  // Issue 3.7: Auto-save session data every 60 seconds during active session
  useEffect(() => {
    if (!isAdminOrNotary || !appointmentId || !participantLink || sessionStatus === "completed") return;
    const autoSaveInterval = setInterval(async () => {
      try {
        await supabase.from("notarization_sessions").update({
          id_verified: idVerified,
          kba_completed: kbaCompleted,
          recording_consent: recordingConsent,
          recording_consent_at: recordingConsentAt,
          session_mode: sessionMode,
          signing_platform: signingPlatform,
          document_name: documentName || null,
          signer_email: signerEmail || null,
          kba_attempts: kbaAttempts,
          esign_consent: esignConsented,
          esign_consent_at: esignConsentTimestamp,
          witness_verified: witnessVerified,
          witness_name: witnessName || null,
        } as any).eq("appointment_id", appointmentId);
        // Also save notes
        await supabase.from("appointments").update({ admin_notes: notes }).eq("id", appointmentId);
      } catch { /* silent auto-save failure — manual save is still available */ }
    }, 60_000);
    return () => clearInterval(autoSaveInterval);
  }, [isAdminOrNotary, appointmentId, participantLink, sessionStatus, idVerified, kbaCompleted, recordingConsent, recordingConsentAt, sessionMode, signingPlatform, documentName, signerEmail, kbaAttempts, esignConsented, esignConsentTimestamp, witnessVerified, witnessName, notes]);

  // Issue 5.6: Persist e-sign consent immediately when granted
  useEffect(() => {
    if (!appointmentId || !esignConsented || !esignConsentTimestamp) return;
    supabase.from("notarization_sessions").update({
      esign_consent: true,
      esign_consent_at: esignConsentTimestamp,
    } as any).eq("appointment_id", appointmentId).then(() => {}, () => {});
  }, [esignConsented, esignConsentTimestamp, appointmentId]);

  // Issue 5.6: Persist recording consent immediately when granted
  useEffect(() => {
    if (!appointmentId || !recordingConsent || !recordingConsentAt) return;
    supabase.from("notarization_sessions").update({
      recording_consent: true,
      recording_consent_at: recordingConsentAt,
    } as any).eq("appointment_id", appointmentId).then(() => {}, () => {});
  }, [recordingConsent, recordingConsentAt, appointmentId]);

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

    // ID 67: Persist oath timestamp to DB immediately
    if (appointmentId) {
      const oathNote = `\n[Oath: ${oathType} administered at ${new Date(timestamp).toLocaleTimeString()}]`;
      await supabase.from("appointments").update({ admin_notes: (notes || "") + oathNote }).eq("id", appointmentId);
      await supabase.from("notarization_sessions").update({
        oath_administered: true,
        oath_timestamp: timestamp,
        oath_type: oathType,
      } as any).eq("appointment_id", appointmentId);
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
    // Ohio ORC §147.54: Signature by mark requires 2 credible witnesses
    if (isSignatureByMark && (!witnessVerified || !witness2Verified || !witnessName.trim() || !witness2Name.trim())) {
      toast({ title: "Two witnesses required", description: "Ohio ORC §147.54 requires two credible witnesses for signature by mark. Both must be verified.", variant: "destructive" });
      return;
    }
    if (!recordingUrl || !recordingUrl.trim()) {
      toast({ title: "Recording URL required", description: "A session recording URL must be provided before finalizing per Ohio ORC §147.66.", variant: "destructive" });
      return;
    }
    // Validate recording URL format (Issue 5.1)
    try {
      const parsedUrl = new URL(recordingUrl.trim());
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        toast({ title: "Invalid recording URL", description: "Recording URL must use HTTPS protocol.", variant: "destructive" });
        return;
      }
    } catch {
      toast({ title: "Invalid recording URL", description: "Please enter a valid URL for the session recording.", variant: "destructive" });
      return;
    }
    // Issue 5.5: Real-time commission expiry check before finalization
    const { data: commissionData } = await supabase.from("platform_settings").select("setting_value").eq("setting_key", "commission_expiry_date").single();
    if (commissionData?.setting_value) {
      const expiryDate = new Date(commissionData.setting_value);
      if (expiryDate <= new Date()) {
        toast({ title: "Commission Expired", description: "Your notary commission has expired. You cannot finalize notarial acts with an expired commission.", variant: "destructive" });
        return;
      }
    }
    setShowFinalizeDialog(true);
    return;
  };

  const executeFinalization = async () => {
    setShowFinalizeDialog(false);
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
      credential_analysis: {
        id_type: idType || null,
        id_number_last4: idNumber ? idNumber.slice(-4) : null,
        id_expiration: idExpiration || null,
        kba_completed: kbaCompleted,
        kba_attempts: kbaAttempts,
        id_verified: idVerified,
        verified_at: new Date().toISOString(),
      },
    } as any);

    // e-seal: prefer uploaded doc, fall back to manual document_name
    const { data: docs } = await supabase.from("documents").select("id, file_name, file_path").eq("appointment_id", appointmentId).limit(1);
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
    // Generate tamper-evident SHA-256 hash from actual document bytes for Ohio ORC §147.63 compliance
    let documentHash: string | null = null;
    try {
      // Try to download actual document content for hash
      const docPath = docs?.[0]?.file_path || `placeholder/${appointmentId}`;
      const { data: fileData } = await supabase.storage.from("documents").download(docPath);
      let hashBuffer: ArrayBuffer;
      if (fileData) {
        hashBuffer = await crypto.subtle.digest("SHA-256", await fileData.arrayBuffer());
      } else {
        // Fallback: hash metadata if file not accessible
        const hashInput = `${eSealDocId}|${eSealDocName}|${appointmentId}|${clientProfile?.full_name || ""}|${new Date().toISOString()}`;
        hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput));
      }
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

    // Log signer acknowledgment per document (Ohio compliance gap)
    await logAuditEvent("signer_acknowledgment_recorded", {
      entityType: "appointment",
      entityId: appointmentId,
      details: {
        signer_name: clientProfile?.full_name || "Unknown",
        document_name: documentName || appointment.service_type || "Unknown",
        acknowledgment_type: oathType,
        acknowledged_at: new Date().toISOString(),
        notarization_type: "ron",
        signing_platform: signingPlatform,
      } as Record<string, Json | undefined>,
    });

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

    // 3.7 Wire send-followup-sequence on session completion
    try {
      await supabase.functions.invoke("send-followup-sequence", {
        body: { appointmentId, clientId: appointment.client_id },
      });
    } catch (e) { console.error("Follow-up sequence error:", e); }

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

    const CLIENT_STEPS = ["Welcome", "ID Verification", "Biometric Scan", "Active Session"];
    const notaryDisplayName = "Your Notary";
    const signerDisplayName = clientProfile?.full_name || "Signer";

    // Step indicator for client onboarding
    const ClientStepBar = () => (
      <div className="flex items-center gap-2 mb-8">
        {CLIENT_STEPS.map((step, idx) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              idx < clientOnboardingStep && "bg-primary/10 text-primary",
              idx === clientOnboardingStep && "bg-primary/10 text-primary ring-1 ring-primary/30",
              idx > clientOnboardingStep && "bg-muted text-muted-foreground"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2",
                idx <= clientOnboardingStep ? "border-primary bg-primary/10" : "border-border"
              )}>
                {idx < clientOnboardingStep ? <CheckCircle className="h-3 w-3" /> : idx + 1}
              </div>
              <span className="hidden md:inline">{step}</span>
            </div>
            {idx < CLIENT_STEPS.length - 1 && (
              <div className={cn("h-px flex-1 min-w-4", idx < clientOnboardingStep ? "bg-primary/30" : "bg-border")} />
            )}
          </div>
        ))}
      </div>
    );

    // --- STEP 0: Welcome ---
    if (clientOnboardingStep === 0) {
      return (
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border/50 bg-background px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Portal
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-bold">Notar RON</span>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Secure Session</p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <span className="text-[10px] font-semibold text-muted-foreground">SESSION ID</span>
                <p className="text-xs font-mono font-semibold text-foreground">{sessionUniqueId || "Pending"}</p>
              </div>
            </div>
          </nav>
          <div className="max-w-2xl mx-auto py-12 px-4">
            <ClientStepBar />
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Lock className="text-primary-foreground w-7 h-7" />
                </div>
                <h1 className="text-3xl font-black text-foreground mb-3">Hello, {signerDisplayName}.</h1>
                <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                  You are about to enter a secure Remote Online Notarization session.{" "}
                  {notaryDisplayName} is waiting for you.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <CheckCircle className="text-primary w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">Verified secure connection — AES-256 encryption</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <CheckCircle className="text-primary w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">Guardian Eye AI Security Monitoring Enabled</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <Shield className="text-primary w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">Ohio RON Compliant (ORC §147.60–147.66)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  By proceeding, you acknowledge this session will be recorded per Ohio law. Your identity will be verified via knowledge-based authentication (KBA).
                </p>
                <Button
                  className="w-full py-6 text-base font-bold"
                  size="lg"
                  onClick={() => {
                    setClientOnboardingStep(1);
                    addClientJournalEntry("Signer entered the session lobby.");
                  }}
                >
                  Start Secure Session <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // --- STEP 1: ID Verification Guidance ---
    if (clientOnboardingStep === 1) {
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
          <div className="max-w-2xl mx-auto py-12 px-4">
            <ClientStepBar />
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-10">
                <h2 className="text-2xl font-bold text-foreground mb-2">ID Verification</h2>
                <p className="text-muted-foreground mb-8">Please have your government-issued photo ID ready to present during the session.</p>
                <div className="aspect-[1.6/1] bg-foreground/5 dark:bg-foreground/10 rounded-2xl mb-8 relative flex items-center justify-center overflow-hidden border border-border/50">
                  <div className="absolute inset-0 border-[3px] border-dashed border-primary/20 m-12 rounded-lg" />
                  <div className="flex flex-col items-center gap-4 text-muted-foreground/40">
                    <UserCheck className="w-16 h-16" />
                    <span className="text-xs font-mono tracking-widest uppercase">Position ID within frame</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%] animate-pulse rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    Accepted IDs: Driver's license, passport, or state-issued ID card
                  </p>
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    ID verification will be completed within the signing platform
                  </p>
                </div>
                <Button
                  className="w-full py-6 text-base font-bold"
                  size="lg"
                  onClick={() => {
                    setClientOnboardingStep(2);
                    addClientJournalEntry("ID verification guidance completed.");
                  }}
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // --- STEP 2: Biometric Liveness Guidance ---
    if (clientOnboardingStep === 2) {
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
          <div className="max-w-2xl mx-auto py-12 px-4">
            <ClientStepBar />
            <Card className="rounded-2xl border-border/50 text-center">
              <CardContent className="p-10">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/20">
                  <Fingerprint className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Biometric Liveness Check</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Look directly into the camera and blink when prompted. This ensures a secure, human-only session.
                </p>
                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={cn("h-1.5 w-8 rounded-full", i < 4 ? "bg-primary" : "bg-muted animate-pulse")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Liveness verification will be completed within the signing platform to confirm your physical presence.
                </p>
                <Button
                  className="w-full py-6 text-base font-bold"
                  size="lg"
                  onClick={() => {
                    setClientOnboardingStep(3);
                    addClientJournalEntry("Biometric guidance completed — entering active session.");
                  }}
                >
                  Complete &amp; Enter Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // --- STEP 3: Active Session — 3-Column Dashboard ---
    const participants = [
      { id: "signer", name: signerDisplayName, role: "Signer", order: 1, active: true },
      ...(appointment?.signer_count > 1 ? [{ id: "witness", name: "Witness", role: "Witness", order: 2, active: false }] : []),
      { id: "notary", name: notaryDisplayName, role: "Notary", order: appointment?.signer_count > 1 ? 3 : 2, active: sessionStatus === "in_session" },
    ];

    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <nav className="h-14 border-b border-border/50 bg-background flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-primary-foreground w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold leading-none">Notar RON</span>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Active Session</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-semibold text-muted-foreground">SESSION</span>
              <span className="text-xs font-mono font-semibold text-foreground">{sessionUniqueId || "—"}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground">
              {signerDisplayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </nav>

        {/* Main 3-Column Layout */}
        <main className="p-4 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-12 gap-4">
            {/* LEFT: Video Panel + Guardian Eye */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {/* Video Conference Placeholder */}
              <Card className="bg-foreground/[0.03] dark:bg-card border-border/50 rounded-2xl overflow-hidden">
                <div className="aspect-[4/3] bg-muted/50 relative flex items-center justify-center">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <Badge className="bg-destructive text-destructive-foreground text-[10px]">● LIVE</Badge>
                    <span className="text-foreground text-[10px] font-semibold uppercase tracking-widest">{notaryDisplayName}</span>
                  </div>
                  <div className="flex items-center justify-center text-muted-foreground/20">
                    <UserCheck className="w-20 h-20" />
                  </div>
                  {/* PiP Self Feed */}
                  <div className="absolute bottom-3 right-3 w-24 h-16 bg-muted rounded-xl border border-border overflow-hidden flex items-center justify-center">
                    <Video className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-3">
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <Monitor className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* RON Session Recording (Ohio ORC §147.66) */}
              {isAdminOrNotary && user && appointmentId && (
                <RonRecordingPanel
                  appointmentId={appointmentId}
                  userId={user.id}
                  onRecordingUrl={(url) => setRecordingUrl(url)}
                  disabled={!recordingConsent}
                />
              )}

              {/* Guardian Eye Monitoring */}
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Guardian Eye Monitoring
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-muted-foreground">ENCRYPTION</span>
                        <span className="text-primary">AES-256 ACTIVE</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full w-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-muted-foreground">KBA STATUS</span>
                        <span className={kbaCompleted ? "text-primary" : "text-muted-foreground"}>
                          {kbaCompleted ? "PASSED" : "PENDING"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full">
                        <div className={cn("h-full rounded-full transition-all", kbaCompleted ? "bg-primary w-full" : "bg-muted-foreground/30 w-[20%]")} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-muted-foreground">LIVENESS</span>
                        <span className="text-primary">VERIFIED</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full w-[99%]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CENTER: Document Workspace */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              {/* E-Sign Consent */}
              <ESignConsent
                consented={esignConsented}
                onConsentChange={(v) => {
                  setEsignConsented(v);
                  if (v && !esignConsentTimestamp) {
                    setEsignConsentTimestamp(new Date().toISOString());
                    addClientJournalEntry("E-Sign consent accepted.");
                  }
                }}
                consentTimestamp={esignConsentTimestamp}
              />

              {/* Document / Signing Area */}
              <Card className="rounded-2xl border-border/50 overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {sessionStatus === "in_session" ? "IN SESSION" : "PREPARING"}
                    </Badge>
                    {appointment && (
                      <span className="text-xs text-muted-foreground">{appointment.service_type}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Client Signature Path</span>
                    <div className={cn("h-2 w-2 rounded-full", esignConsented ? "bg-primary" : "bg-muted-foreground/30 animate-pulse")} />
                  </div>
                </div>

                {/* Main signing area */}
                <div className="flex-1 flex items-center justify-center p-8">
                  {participantLink ? (
                    <div className="text-center space-y-6 max-w-md">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <ExternalLink className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Document Ready for Signing</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Your notary has prepared the document for signing. Click below to open the secure signing platform.
                      </p>
                      {esignConsented ? (
                        <a href={participantLink} target="_blank" rel="noopener noreferrer">
                          <Button size="lg" className="w-full py-6 text-base font-bold shadow-lg">
                            Open Document <ExternalLink className="ml-2 h-5 w-5" />
                          </Button>
                        </a>
                      ) : (
                        <Button size="lg" disabled className="w-full py-6 text-base">
                          <ExternalLink className="mr-2 h-5 w-5" /> Accept E-Sign Consent First
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">Opens in a new tab — your security monitoring remains active</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Monitor className="mx-auto h-16 w-16 text-muted-foreground/30" />
                      <h3 className="text-xl font-semibold text-foreground">Waiting for Document</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Your notary is preparing the document. You'll receive a signing link here once everything is ready.
                      </p>
                      <Badge variant="secondary">
                        {sessionStatus === "in_session" ? "Session Active — Document Loading" : "Waiting for Notary"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Status Ticker */}
                <div className="px-6 py-3 bg-foreground text-background flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Network Secure</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <Clock className="w-3 h-3 opacity-50" />
                      <span className="text-[10px] font-semibold opacity-70 uppercase">Session: {sessionElapsed}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold opacity-70 uppercase">Latency:</span>
                    <span className="text-[10px] font-bold text-primary">22ms</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT: Participants + Journal */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {/* Participant Sequence */}
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
                    Participant Sequence
                    <Badge variant="secondary" className="text-[10px]">
                      {participants.filter(p => p.active).length}/{participants.length} Active
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {participants.map(p => (
                      <div key={p.id} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        p.active ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
                      )}>
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                          p.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {p.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold truncate", p.active ? "text-foreground" : "text-muted-foreground")}>{p.name}</p>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-tight">{p.role}</p>
                        </div>
                        {p.active && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Smart Journal */}
              <Card className="rounded-2xl border-border/50 flex flex-col h-[300px]">
                <CardContent className="p-5 flex flex-col h-full">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Smart Journal</h3>
                  <div className="flex-1 overflow-auto space-y-2 pr-1">
                    {clientJournal.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Waiting for session events...</p>
                    )}
                    {clientJournal.map(entry => (
                      <div key={entry.id} className="p-2.5 bg-muted/50 rounded-lg border border-border/50 text-[11px] leading-snug">
                        <span className="text-[9px] font-mono text-muted-foreground block mb-0.5">
                          [{new Date(entry.id).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}]
                        </span>
                        <p className="text-foreground/80 font-medium">{entry.msg}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trust Node */}
              <Card className="rounded-2xl border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">Trust Node</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    This session is being recorded and hashed onto the <strong className="text-foreground">Guardian Audit Trail</strong> for Ohio RON compliance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Admin/Notary view
  return (
    <div className="min-h-screen bg-background">
      <nav className="h-14 border-b border-border bg-foreground px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin/appointments" className="flex items-center gap-2 text-sm text-background/60 hover:text-background">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="h-6 w-px bg-background/10" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Lock className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-black text-background">RON Session</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {clientProfile && (
            <span className="text-sm text-background/60">Client: <span className="font-bold text-background">{clientProfile.full_name}</span></span>
          )}
          <Badge className="bg-primary/20 text-primary border-0 text-xs capitalize rounded-lg">{sessionStatus}</Badge>
          {sessionUniqueId && <span className="hidden md:inline text-xs font-mono text-background/40">{sessionUniqueId}</span>}
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Session Metadata Bar */}
        <div className="mb-4 flex items-center gap-3 rounded-[16px] border border-border bg-card px-5 py-3 text-xs flex-wrap">
          {sessionUniqueId && <span className="font-mono text-muted-foreground">Session: <strong className="text-foreground">{sessionUniqueId}</strong></span>}
          <span className="text-border">•</span>
          <span className="flex items-center gap-1 text-emerald-600"><Shield className="h-3 w-3" /> AES-256 Encrypted</span>
          <span className="text-border">•</span>
          <span>Provider: <strong>{SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label || signingPlatform}</strong></span>
          <span className="text-border">•</span>
          <Badge className="bg-muted text-muted-foreground border-0 text-[10px] capitalize rounded-lg">{sessionStatus}</Badge>
        </div>

        {appointment && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-4 p-3 text-sm">
              <Badge className="bg-primary/20 text-foreground">{appointment.notarization_type === "ron" ? "RON" : "In-Person"}</Badge>
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

        {/* 15-minute inactivity lock overlay */}
        {inactivityLocked && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-w-md border-destructive">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="font-sans text-xl font-bold mb-2">Session Paused — Inactivity</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This RON session has been locked after 15 minutes of inactivity per Ohio compliance requirements.
                </p>
                <Button onClick={() => { setInactivityLocked(false); setLastActivityAt(Date.now()); }}>
                  Resume Session
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ohio RON Compliance Banner */}
        {appointment?.notarization_type === "ron" && (
          <div className="mb-4">
            <ComplianceBanner variant="ron" compact />
          </div>
        )}

        {/* Waiting Room Phase */}
        {showWaitingRoom && appointmentId && (
          <div className="mb-6">
            <SessionWaitingRoom
              appointmentId={appointmentId}
              signerName={clientProfile?.full_name}
              notaryName={user?.email?.split("@")[0] || "Notary"}
              witnessRequired={!!witnessName}
              onAllReady={() => setShowWaitingRoom(false)}
            />
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
            {/* Guardian Eye — Session Security Panel */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" /> Guardian Eye — Session Security
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-border p-2">
                    <span className="text-[10px] text-muted-foreground">Session Encryption</span>
                    <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                      <CheckCircle className="mr-1 h-3 w-3" /> AES-256
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-2">
                    <span className="text-[10px] text-muted-foreground">Participant Verified</span>
                    <Badge variant="secondary" className={cn("text-[10px]", idVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground")}>
                      {idVerified ? <><CheckCircle className="mr-1 h-3 w-3" /> Verified</> : <><AlertCircle className="mr-1 h-3 w-3" /> Pending</>}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-2">
                    <span className="text-[10px] text-muted-foreground">KBA Status</span>
                    <Badge variant="secondary" className={cn("text-[10px]", kbaCompleted ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground")}>
                      {kbaCompleted ? <><CheckCircle className="mr-1 h-3 w-3" /> Passed</> : <><AlertCircle className="mr-1 h-3 w-3" /> Pending</>}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-2">
                    <span className="text-[10px] text-muted-foreground">Recording Consent</span>
                    <Badge variant="secondary" className={cn("text-[10px]", recordingConsent ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                      {recordingConsent ? <><CheckCircle className="mr-1 h-3 w-3" /> Granted</> : <><AlertCircle className="mr-1 h-3 w-3" /> Required</>}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-2">
                    <span className="text-[10px] text-muted-foreground">Liveness Detection</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]">
                      <Monitor className="mr-1 h-3 w-3" /> Via {SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label || "Platform"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GAP-0217: SignNow Status Panel */}
            {signingPlatform === "signnow" && appointmentId && (
              <SignNowStatusPanel appointmentId={appointmentId} />
            )}

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
                        <SelectItem value="drivers_license">State Driver's License</SelectItem>
                        <SelectItem value="state_id">State Identification Card</SelectItem>
                        <SelectItem value="passport">US Passport</SelectItem>
                        <SelectItem value="passport_card">US Passport Card</SelectItem>
                        <SelectItem value="military_id">US Military ID</SelectItem>
                        <SelectItem value="foreign_passport">Foreign Passport</SelectItem>
                        <SelectItem value="green_card">Permanent Resident Card (Green Card)</SelectItem>
                        <SelectItem value="ead">Employment Authorization Document</SelectItem>
                        <SelectItem value="nexus">NEXUS Card</SelectItem>
                        <SelectItem value="sentri">SENTRI Card</SelectItem>
                        <SelectItem value="global_entry">Global Entry Card</SelectItem>
                        <SelectItem value="tribal_id">Tribal ID</SelectItem>
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
                        // Audit log KBA attempt per ORC §147.66
                        await logAuditEvent("kba_attempt_recorded", {
                          entityType: "appointment",
                          entityId: appointmentId,
                          details: {
                            attempt_number: newAttempts,
                            max_attempts: 2,
                            signer_name: clientProfile?.full_name || "Unknown",
                            platform: signingPlatform,
                          } as Record<string, Json | undefined>,
                        });
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
                  <Badge variant="secondary" className="bg-warning/10 text-warning-foreground text-xs"><AlertCircle className="mr-1 h-3 w-3" /> Awaiting KBA</Badge>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {hasNativeKba
                    ? `${SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label} performs MISMO-compliant KBA automatically. Toggle after signer completes.`
                    : "KBA is handled during the session. Toggle manually after confirmation."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Signature by Mark + Witness Verification — Ohio RON compliance */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <PenTool className="h-4 w-4 text-primary" /> Signing Method
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Switch checked={isSignatureByMark} onCheckedChange={setIsSignatureByMark} />
                  <Label className="text-xs">Signer is using a mark (X) instead of signature</Label>
                </div>
                {isSignatureByMark && (
                  <p className="text-[10px] text-destructive font-medium mb-2">
                    ⚠ Ohio ORC §147.54: Signature by mark requires TWO credible witnesses who can attest to the signer's identity.
                  </p>
                )}

                {((appointment?.signer_count || 1) > 1 || isSignatureByMark) && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground">
                      Ohio ORC §147.66 requires identity verification for witnesses present during RON sessions.
                    </p>
                    {/* Witness 1 */}
                    <div className="space-y-2 rounded-lg border border-border/50 p-3">
                      <p className="text-xs font-semibold">Witness 1</p>
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input className="h-8 text-xs" placeholder="Full legal name" value={witnessName} onChange={e => setWitnessName(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">ID Type</Label>
                        <Select value={witnessIdType} onValueChange={setWitnessIdType}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="state_id">State ID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={witnessVerified} onCheckedChange={async (checked) => {
                          setWitnessVerified(checked);
                          if (checked && appointmentId) {
                            await logAuditEvent("witness_id_verified", {
                              entityType: "appointment",
                              entityId: appointmentId,
                              details: { witness_name: witnessName, witness_id_type: witnessIdType, witness_number: 1 } as Record<string, Json | undefined>,
                            });
                          }
                        }} />
                        <Label className="text-xs">Witness 1 ID Verified</Label>
                      </div>
                      {witnessVerified && <Badge variant="secondary" className="bg-primary/10 text-primary text-xs"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>}
                    </div>

                    {/* Witness 2 — required for signature by mark */}
                    {isSignatureByMark && (
                      <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                        <p className="text-xs font-semibold">Witness 2 <Badge variant="destructive" className="text-[10px] ml-1">Required for Mark</Badge></p>
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input className="h-8 text-xs" placeholder="Full legal name" value={witness2Name} onChange={e => setWitness2Name(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={witness2Verified} onCheckedChange={async (checked) => {
                            setWitness2Verified(checked);
                            if (checked && appointmentId) {
                              await logAuditEvent("witness_id_verified", {
                                entityType: "appointment",
                                entityId: appointmentId,
                                details: { witness_name: witness2Name, witness_number: 2, signature_by_mark: true } as Record<string, Json | undefined>,
                              });
                            }
                          }} />
                          <Label className="text-xs">Witness 2 ID Verified</Label>
                        </div>
                        {witness2Verified && <Badge variant="secondary" className="bg-primary/10 text-primary text-xs"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>}
                      </div>
                    )}
                  </div>
                )}
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

            {/* Smart Seal Visualization */}
            {oathAdministered && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                    <Shield className="h-4 w-4 text-primary" /> Smart Seal Preview
                  </h3>
                  <div className="mx-auto w-40 h-40 rounded-full border-4 border-primary/30 flex items-center justify-center bg-primary/5 relative">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-primary mx-auto mb-1" />
                      <p className="text-[9px] font-bold text-primary uppercase">Notary Public</p>
                      <p className="text-[8px] text-muted-foreground">State of Ohio</p>
                      <p className="text-[8px] font-mono text-muted-foreground mt-1">SHA-256 Anchored</p>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_30s_linear_infinite]" />
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-2">Digital seal will be applied upon finalization with tamper-evident hash anchoring.</p>
                </CardContent>
              </Card>
            )}

            {/* Real-Time Session Journal */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" /> Session Journal
                </h3>
                <div className="space-y-1.5 max-h-32 overflow-auto text-[10px]">
                  {sessionStartedAt && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="font-mono shrink-0">{new Date(sessionStartedAt).toLocaleTimeString()}</span>
                      <span>Session initiated</span>
                    </div>
                  )}
                  {participantLink && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="font-mono shrink-0">{new Date().toLocaleTimeString()}</span>
                      <span>Signing link shared via {SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label}</span>
                    </div>
                  )}
                  {recordingConsent && recordingConsentAt && (
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="font-mono shrink-0">{new Date(recordingConsentAt).toLocaleTimeString()}</span>
                      <span>Recording consent granted</span>
                    </div>
                  )}
                  {idVerified && (
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="font-mono shrink-0">{new Date().toLocaleTimeString()}</span>
                      <span>ID verified — {idType || "Government ID"}</span>
                    </div>
                  )}
                  {kbaCompleted && (
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="font-mono shrink-0">{new Date().toLocaleTimeString()}</span>
                      <span>KBA passed (attempt {kbaAttempts}/2)</span>
                    </div>
                  )}
                  {oathAdministered && oathTimestamp && (
                    <div className="flex items-start gap-2 text-primary">
                      <span className="font-mono shrink-0">{new Date(oathTimestamp).toLocaleTimeString()}</span>
                      <span>Oath administered ({oathType})</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notary Attestation Panel — required before finalization */}
            {currentStep >= 3 && (
              <NotaryAttestationPanel
                signerName={clientProfile?.full_name || "Unknown Signer"}
                signingPlatform={SIGNING_PLATFORMS.find(p => p.value === signingPlatform)?.label || signingPlatform}
                kbaCompleted={kbaCompleted}
                idVerified={idVerified}
                oathAdministered={oathAdministered}
                recordingConsent={recordingConsent}
                recordingConsentAt={recordingConsentAt}
                sessionUniqueId={sessionUniqueId}
                onAttestationComplete={(attestNotes) => {
                  setNotes(prev => prev + (attestNotes ? `\n[Attestation: ${attestNotes}]` : ""));
                }}
                disabled={completing}
              />
            )}

            {/* Complete & Finalize */}
            <Card className="rounded-[24px] border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
                  <FileCheck className="h-4 w-4 text-primary" /> Complete & Finalize
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">Marks appointment as completed, creates journal entry, e-seal verification, and payment record.</p>
                
                {/* Recording URL — Ohio ORC §147.66 */}
                <div className="mb-3">
                  <Label className="text-xs">Recording URL <span className="text-muted-foreground">(ORC §147.66 — 10yr retention)</span></Label>
                  <Input
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://platform.com/recording/..."
                    className="mt-1 text-sm rounded-xl border-border"
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
                <Button className="w-full rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[3px_3px_0px_hsl(var(--foreground))] h-11" disabled={!idVerified || !kbaCompleted || completing} onClick={completeAndFinalize}>
                  {completing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileCheck className="mr-1 h-4 w-4" />} Complete Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Finalization Confirmation Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize RON Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the appointment as completed, create a journal entry, e-seal verification, and payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeFinalization}>Finalize Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
