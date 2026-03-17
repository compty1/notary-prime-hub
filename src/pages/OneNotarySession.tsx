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
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen, Save, Loader2, XCircle, FileCheck, CreditCard, Calendar, ExternalLink, Play, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const oathScripts = {
  acknowledgment: null,
  jurat: "Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?",
  oath: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?",
};

export default function OneNotarySession() {
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

  // OneNotary session state
  const [onenotarySessionId, setOnenotarySessionId] = useState<string | null>(null);
  const [participantLink, setParticipantLink] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [initializingSession, setInitializingSession] = useState(false);

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

  const [sessionStatus, setSessionStatus] = useState<string>("waiting");

  // Load appointment data
  useEffect(() => {
    const loadData = async () => {
      if (appointmentId) {
        const { data: appt } = await supabase.from("appointments").select("*").eq("id", appointmentId).single();
        if (appt) {
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
            if ((session as any).onenotary_session_id) setOnenotarySessionId((session as any).onenotary_session_id);
            if ((session as any).participant_link) setParticipantLink((session as any).participant_link);
          }
        }
      }
    };
    loadData();
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

  // OneNotary: Create session
  const handleCreateSession = async () => {
    if (!appointmentId || !clientProfile) return;
    setCreatingSession(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/onenotary-webhook`;

      // Step 1: Create session
      const createResp = await supabase.functions.invoke("onenotary", {
        body: {
          action: "create_session",
          appointment_id: appointmentId,
          session_type: "ron",
          callback_url: webhookUrl,
        },
      });

      if (createResp.error) throw new Error(createResp.error.message);
      const sessionData = createResp.data;
      const sessionId = sessionData?.id || sessionData?.session_id;

      if (!sessionId) throw new Error("No session ID returned from OneNotary");
      setOnenotarySessionId(sessionId);

      // Step 2: Add client as primary signer
      const nameParts = (clientProfile.full_name || "Client").split(" ");
      const firstName = nameParts[0] || "Client";
      const lastName = nameParts.slice(1).join(" ") || "User";

      const participantResp = await supabase.functions.invoke("onenotary", {
        body: {
          action: "add_participant",
          session_id: sessionId,
          appointment_id: appointmentId,
          role: "primary_signer",
          first_name: firstName,
          last_name: lastName,
          email: clientProfile.email,
        },
      });

      if (participantResp.data?.join_url) {
        setParticipantLink(participantResp.data.join_url);
      }

      toast({ title: "OneNotary session created", description: "You can now add documents and initialize the session." });
    } catch (err: any) {
      toast({ title: "Failed to create session", description: err.message, variant: "destructive" });
    }
    setCreatingSession(false);
  };

  // OneNotary: Initialize session (send invites)
  const handleInitSession = async () => {
    if (!onenotarySessionId || !appointmentId) return;
    setInitializingSession(true);
    try {
      const resp = await supabase.functions.invoke("onenotary", {
        body: {
          action: "init_session",
          session_id: onenotarySessionId,
          appointment_id: appointmentId,
        },
      });

      if (resp.error) throw new Error(resp.error.message);
      setSessionStatus("in_session");
      toast({ title: "Session initialized", description: "Invitations sent to the signer. The RON session is now active." });
    } catch (err: any) {
      toast({ title: "Failed to initialize session", description: err.message, variant: "destructive" });
    }
    setInitializingSession(false);
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
    if (!appointmentId || !user) return;
    if (!idVerified || !kbaCompleted) {
      toast({ title: "Cannot complete", description: "ID verification and KBA must both be completed before finalizing.", variant: "destructive" });
      return;
    }
    setCompleting(true);

    await supabase.from("appointments").update({ status: "completed" as any, admin_notes: notes }).eq("id", appointmentId);
    await supabase.from("notarization_sessions").update({ id_verified: true, kba_completed: true, status: "completed" as any, completed_at: new Date().toISOString() }).eq("appointment_id", appointmentId);
    await supabase.from("documents").update({ status: "notarized" as any }).eq("appointment_id", appointmentId);

    if (appointment) {
      const fee = appointment.estimated_price || 5;
      await supabase.from("payments").insert({ client_id: appointment.client_id, appointment_id: appointmentId, amount: fee, status: "pending", notes: `RON session completed via OneNotary — ${appointment.service_type}` });
    }

    await supabase.from("audit_log").insert({ user_id: user.id, action: "ron_session_completed", entity_type: "appointment", entity_id: appointmentId, details: { oath_type: oathType, oath_timestamp: oathTimestamp, id_type: idType, onenotary_session_id: onenotarySessionId } });

    setCompleting(false);
    toast({ title: "Session finalized", description: "Appointment completed, documents marked as notarized, and payment record created." });
    navigate("/admin/appointments");
  };

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
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Secure RON Session</span>
            </div>
          </div>
        </nav>

        <div className="container mx-auto max-w-3xl px-4 py-8">
          {appointment && (
            <Card className="mb-4 border-accent/30 bg-accent/5">
              <CardContent className="flex items-center gap-4 p-3 text-sm">
                <Badge className="bg-accent/20 text-accent-foreground">RON Session</Badge>
                <span>{appointment.service_type}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {new Date(appointment.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Pre-session checklist */}
          <Card className="mb-6 border-border/50">
            <CardContent className="p-6">
              <h2 className="mb-4 font-display text-xl font-semibold">Session Checklist</h2>
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

          {/* Session join link or waiting state */}
          <Card className="border-2 border-dashed border-accent/30">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              {participantLink ? (
                <div className="space-y-4">
                  <Video className="mx-auto h-16 w-16 text-accent" />
                  <h3 className="font-display text-xl font-semibold text-foreground">Your Session is Ready</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Click the button below to join your RON session via OneNotary. You'll complete ID verification and KBA within the platform.
                  </p>
                  <a href={participantLink} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-gold-dark">
                      <ExternalLink className="mr-2 h-5 w-5" /> Join RON Session
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground">Opens in a new tab — OneNotary's secure platform</p>
                </div>
              ) : (
                <>
                  <Monitor className="mb-4 h-16 w-16 text-accent/50" />
                  <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Waiting for Session</h3>
                  <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    Your notary will start the session shortly. You'll receive a join link here and via email once the session is initialized.
                  </p>
                  <Badge className="bg-purple-100 text-purple-800">
                    {appointment?.status === "in_session" ? "Session Active" : "Waiting for Notary"}
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
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">OneNotary RON Session</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main session area */}
          <div className="lg:col-span-2">
            {appointment && (
              <Card className="mb-4 border-accent/30 bg-accent/5">
                <CardContent className="flex items-center gap-4 p-3 text-sm">
                  <Badge className="bg-accent/20 text-accent-foreground">{appointment.notarization_type === "ron" ? "RON" : "In-Person"}</Badge>
                  <span>{appointment.service_type}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {new Date(appointment.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </CardContent>
              </Card>
            )}

            {/* OneNotary Session Controls */}
            <Card className="mb-6 border-border/50">
              <CardContent className="p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">OneNotary Session</h2>
                {!onenotarySessionId ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create a OneNotary session to begin the RON process. This will set up the session and add the client as the primary signer.
                    </p>
                    <Button onClick={handleCreateSession} disabled={creatingSession || !clientProfile} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                      {creatingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                      Create OneNotary Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800">Session Created</Badge>
                      <span className="text-xs text-muted-foreground">ID: {onenotarySessionId}</span>
                    </div>
                    {participantLink && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Client Join Link:</p>
                        <a href={participantLink} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline break-all">
                          {participantLink}
                        </a>
                      </div>
                    )}
                    {sessionStatus !== "in_session" && sessionStatus !== "completed" && (
                      <Button onClick={handleInitSession} disabled={initializingSession} className="bg-emerald-600 text-white hover:bg-emerald-700">
                        {initializingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                        Initialize & Send Invites
                      </Button>
                    )}
                    {sessionStatus === "in_session" && (
                      <Badge className="bg-purple-100 text-purple-800">Session Active — Awaiting Completion</Badge>
                    )}
                    {sessionStatus === "completed" && (
                      <Badge className="bg-emerald-100 text-emerald-800">Session Completed</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pre-notarization checklist */}
            <Card className="mb-6 border-border/50">
              <CardContent className="p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Before Your Session</h2>
                <div className="space-y-3">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar tools */}
          <div className="space-y-4">
            {/* ID Verification Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-accent" /> ID Verification
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
                  {idVerified && <Badge className="bg-emerald-100 text-emerald-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* KBA Status Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <Shield className="h-4 w-4 text-accent" /> Knowledge-Based Authentication
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={kbaCompleted} onCheckedChange={setKbaCompleted} />
                  <Label className="text-xs">KBA {kbaCompleted ? "Passed" : "Pending"}</Label>
                </div>
                {kbaCompleted ? (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" /> KBA Passed</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 text-xs"><AlertCircle className="mr-1 h-3 w-3" /> Awaiting KBA</Badge>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  KBA is handled by OneNotary during the session. Toggle manually after confirmation or wait for webhook update.
                </p>
              </CardContent>
            </Card>

            {/* Digital Oath/Affirmation */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-accent" /> Oath / Affirmation
                </h3>
                <div className="mb-3 flex flex-wrap gap-1">
                  {(Object.keys(oathScripts) as (keyof typeof oathScripts)[]).filter((k) => oathScripts[k]).map((key) => (
                    <Button key={key} size="sm" variant={oathType === key ? "default" : "outline"} className={`text-xs ${oathType === key ? "bg-accent text-accent-foreground" : ""}`} onClick={() => { setOathType(key); setOathAdministered(false); }}>
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
                  <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" onClick={administerOath}>Mark Oath Administered</Button>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-2 text-center">
                    <p className="flex items-center justify-center gap-1 text-xs text-emerald-700">
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
                  <h3 className="flex items-center gap-2 font-display text-sm font-semibold"><Mic className="h-4 w-4 text-accent" /> Session Notes</h3>
                  <Button size="sm" variant={isListening ? "destructive" : "outline"} className="text-xs" onClick={toggleVoice}>
                    {isListening ? <><MicOff className="mr-1 h-3 w-3" /> Stop</> : <><Mic className="mr-1 h-3 w-3" /> Dictate</>}
                  </Button>
                </div>
                {isListening && <Badge className="mb-2 bg-red-100 text-red-700 text-xs animate-pulse">● Recording</Badge>}
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type or dictate session notes..." rows={6} className="text-sm" />
                <Button size="sm" className="mt-3 w-full bg-accent text-accent-foreground hover:bg-gold-dark" onClick={saveSessionData} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save Session Data
                </Button>
              </CardContent>
            </Card>

            {/* Complete & Finalize */}
            <Card className="border-border/50 border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <FileCheck className="h-4 w-4 text-emerald-600" /> Complete & Finalize
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">Marks appointment as completed, documents as notarized, and creates a payment record.</p>
                <ul className="mb-3 space-y-1 text-xs">
                  <li className="flex items-center gap-1">{idVerified ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} ID Verification</li>
                  <li className="flex items-center gap-1">{kbaCompleted ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} KBA Completed</li>
                  <li className="flex items-center gap-1">{oathAdministered ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />} Oath Administered</li>
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
