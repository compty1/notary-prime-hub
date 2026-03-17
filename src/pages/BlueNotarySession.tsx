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
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen, Save, Loader2, XCircle, FileCheck, CreditCard, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const oathScripts = {
  acknowledgment: null,
  jurat: "Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?",
  oath: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?",
};

export default function BlueNotarySession() {
  const { user, isAdmin, isNotary } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("id");
  const isAdminOrNotary = isAdmin || isNotary;

  const [oathType, setOathType] = useState<keyof typeof oathScripts>("jurat");
  const [oathAdministered, setOathAdministered] = useState(false);
  const [oathTimestamp, setOathTimestamp] = useState<string | null>(null);

  // Appointment context
  const [appointment, setAppointment] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // ID Verification fields
  const [idVerified, setIdVerified] = useState(false);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiration, setIdExpiration] = useState("");

  // KBA status
  const [kbaCompleted, setKbaCompleted] = useState(false);

  // Voice-to-notes
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  // Session status for client view
  const [sessionStatus, setSessionStatus] = useState<string>("waiting");

  // Load appointment data and settings
  useEffect(() => {
    const loadData = async () => {
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "bluenotary_iframe_url")
        .single();
      if (settings?.setting_value) setIframeUrl(settings.setting_value);

      if (appointmentId) {
        const { data: appt } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", appointmentId)
          .single();
        if (appt) {
          setAppointment(appt);
          if (appt.admin_notes && isAdminOrNotary) setNotes(appt.admin_notes);

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", appt.client_id)
            .single();
          if (profile) setClientProfile(profile);

          // Load existing session data
          const { data: session } = await supabase
            .from("notarization_sessions")
            .select("*")
            .eq("appointment_id", appointmentId)
            .single();

          if (session) {
            setIdVerified(session.id_verified || false);
            setKbaCompleted(session.kba_completed || false);
            setSessionStatus(session.status || "scheduled");
          } else if (isAdminOrNotary) {
            await supabase.from("notarization_sessions").insert({
              appointment_id: appointmentId,
              session_type: "ron",
              status: "in_session" as any,
              started_at: new Date().toISOString(),
            });
            setSessionStatus("in_session");
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
      await supabase.from("appointments").update({
        admin_notes: (notes || "") + oathNote,
      }).eq("id", appointmentId);
    }
  };

  const saveSessionData = async () => {
    if (!appointmentId) {
      toast({ title: "No appointment linked", description: "Open this session from an appointment to save data.", variant: "destructive" });
      return;
    }
    setSaving(true);

    await supabase.from("appointments").update({
      admin_notes: notes,
    }).eq("id", appointmentId);

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
      details: {
        oath_administered: oathAdministered,
        oath_type: oathType,
        oath_timestamp: oathTimestamp,
        id_verified: idVerified,
        kba_completed: kbaCompleted,
        notes_length: notes.length,
      },
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

    // Update appointment status to completed
    await supabase.from("appointments").update({
      status: "completed" as any,
      admin_notes: notes,
    }).eq("id", appointmentId);

    // Update session to completed
    await supabase.from("notarization_sessions").update({
      id_verified: true,
      kba_completed: true,
      status: "completed" as any,
      completed_at: new Date().toISOString(),
    }).eq("appointment_id", appointmentId);

    // Mark all linked documents as notarized
    await supabase.from("documents").update({
      status: "notarized" as any,
    }).eq("appointment_id", appointmentId);

    // Auto-create payment record
    if (appointment) {
      const fee = appointment.estimated_price || 5;
      await supabase.from("payments").insert({
        client_id: appointment.client_id,
        appointment_id: appointmentId,
        amount: fee,
        status: "pending",
        notes: `RON session completed — ${appointment.service_type}`,
      });
    }

    // Audit log
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "ron_session_completed",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: {
        oath_type: oathType,
        oath_timestamp: oathTimestamp,
        id_type: idType,
      },
    });

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
          {/* Appointment info */}
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

          {/* Session iframe or placeholder */}
          <Card className="border-2 border-dashed border-accent/30">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              {iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  className="h-[500px] w-full rounded-lg border-0"
                  allow="camera; microphone; fullscreen"
                  title="BlueNotary RON Session"
                />
              ) : (
                <>
                  <Monitor className="mb-4 h-16 w-16 text-accent/50" />
                  <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Waiting for Session</h3>
                  <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    Your notary will start the session shortly. Please stay on this page and ensure your camera and microphone are enabled.
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
            <span className="text-sm font-medium">Secure RON Session</span>
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
                      <p className="text-sm text-muted-foreground">
                        Required under Ohio law (ORC §147.66). 5 identity questions via MISMO-compliant provider.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BlueNotary Iframe or Placeholder */}
            <Card className="border-2 border-dashed border-accent/30">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                {iframeUrl ? (
                  <iframe
                    src={iframeUrl}
                    className="h-[500px] w-full rounded-lg border-0"
                    allow="camera; microphone; fullscreen"
                    title="BlueNotary RON Session"
                  />
                ) : (
                  <>
                    <Monitor className="mb-4 h-16 w-16 text-accent/50" />
                    <h3 className="mb-2 font-display text-xl font-semibold text-foreground">BlueNotary Session</h3>
                    <p className="mb-6 max-w-md text-sm text-muted-foreground">
                      Configure the BlueNotary iframe URL in Admin Settings to enable the embedded session view.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ohio RON Compliant • ORC §147.65-.66 • End-to-End Encrypted
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar tools — admin/notary only */}
          <div className="space-y-4">
            {/* ID Verification Card */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-accent" />
                  ID Verification
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
                  <Shield className="h-4 w-4 text-accent" />
                  Knowledge-Based Authentication
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
                  Placeholder for third-party KBA integration (IDology / LexisNexis). Toggle manually after verifying via external provider.
                </p>
              </CardContent>
            </Card>

            {/* Digital Oath/Affirmation */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Oath / Affirmation
                </h3>
                <div className="mb-3 flex flex-wrap gap-1">
                  {(Object.keys(oathScripts) as (keyof typeof oathScripts)[]).filter((k) => oathScripts[k]).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={oathType === key ? "default" : "outline"}
                      className={`text-xs ${oathType === key ? "bg-accent text-accent-foreground" : ""}`}
                      onClick={() => { setOathType(key); setOathAdministered(false); }}
                    >
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
                  <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" onClick={administerOath}>
                    Mark Oath Administered
                  </Button>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-2 text-center">
                    <p className="flex items-center justify-center gap-1 text-xs text-emerald-700">
                      <CheckCircle className="h-3 w-3" />
                      Oath administered at {oathTimestamp ? new Date(oathTimestamp).toLocaleTimeString() : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice-to-Notes */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                    <Mic className="h-4 w-4 text-accent" />
                    Session Notes
                  </h3>
                  <Button
                    size="sm"
                    variant={isListening ? "destructive" : "outline"}
                    className="text-xs"
                    onClick={toggleVoice}
                  >
                    {isListening ? <><MicOff className="mr-1 h-3 w-3" /> Stop</> : <><Mic className="mr-1 h-3 w-3" /> Dictate</>}
                  </Button>
                </div>
                {isListening && (
                  <Badge className="mb-2 bg-red-100 text-red-700 text-xs animate-pulse">● Recording</Badge>
                )}
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type or dictate session notes..."
                  rows={6}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  className="mt-3 w-full bg-accent text-accent-foreground hover:bg-gold-dark"
                  onClick={saveSessionData}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                  Save Session Data
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saves notes, oath, ID verification, and KBA status.
                </p>
              </CardContent>
            </Card>

            {/* Complete & Finalize */}
            <Card className="border-border/50 border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  Complete & Finalize
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Marks appointment as completed, documents as notarized, and creates a payment record.
                </p>
                <ul className="mb-3 space-y-1 text-xs">
                  <li className="flex items-center gap-1">
                    {idVerified ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    ID Verification
                  </li>
                  <li className="flex items-center gap-1">
                    {kbaCompleted ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    KBA Completed
                  </li>
                  <li className="flex items-center gap-1">
                    {oathAdministered ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    Oath Administered
                  </li>
                </ul>
                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={!idVerified || !kbaCompleted || completing}
                  onClick={completeAndFinalize}
                >
                  {completing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileCheck className="mr-1 h-4 w-4" />}
                  Complete Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
