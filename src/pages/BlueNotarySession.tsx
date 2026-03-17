import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const oathScripts = {
  acknowledgment: null,
  jurat: "Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?",
  oath: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?",
};

export default function BlueNotarySession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("id");

  const [oathType, setOathType] = useState<keyof typeof oathScripts>("jurat");
  const [oathAdministered, setOathAdministered] = useState(false);
  const [oathTimestamp, setOathTimestamp] = useState<string | null>(null);

  // Appointment context
  const [appointment, setAppointment] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Voice-to-notes
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  // Load appointment data and settings
  useEffect(() => {
    const loadData = async () => {
      // Load iframe URL from settings
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "bluenotary_iframe_url")
        .single();
      if (settings?.setting_value) setIframeUrl(settings.setting_value);

      // Load appointment
      if (appointmentId) {
        const { data: appt } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", appointmentId)
          .single();
        if (appt) {
          setAppointment(appt);
          if (appt.admin_notes) setNotes(appt.admin_notes);

          // Load client profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", appt.client_id)
            .single();
          if (profile) setClientProfile(profile);

          // Create/update notarization session
          const { data: existing } = await supabase
            .from("notarization_sessions")
            .select("id")
            .eq("appointment_id", appointmentId)
            .single();

          if (!existing) {
            await supabase.from("notarization_sessions").insert({
              appointment_id: appointmentId,
              session_type: "ron",
              status: "in_session" as any,
              started_at: new Date().toISOString(),
            });
          }
        }
      }
    };
    loadData();
  }, [appointmentId]);

  // Voice recognition setup - fix duplicate transcripts
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false; // Only final results to avoid duplicates
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
  }, []);

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

    // Persist oath to appointment
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

    // Save notes to appointment
    await supabase.from("appointments").update({
      admin_notes: notes,
    }).eq("id", appointmentId);

    // Update notarization session
    await supabase.from("notarization_sessions").update({
      id_verified: true,
      kba_completed: true,
      status: oathAdministered ? ("completed" as any) : ("in_session" as any),
      completed_at: oathAdministered ? new Date().toISOString() : null,
    }).eq("appointment_id", appointmentId);

    // Write audit log
    await supabase.from("audit_log").insert({
      user_id: user?.id,
      action: "ron_session_saved",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: {
        oath_administered: oathAdministered,
        oath_type: oathType,
        oath_timestamp: oathTimestamp,
        notes_length: notes.length,
      },
    });

    setSaving(false);
    toast({ title: "Session data saved", description: "Notes, oath, and session status have been recorded." });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to={appointment ? "/admin/appointments" : "/portal"} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
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
            {/* Appointment info banner */}
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
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">Government-Issued Photo ID Ready</p>
                      <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">Stable Internet Connection</p>
                      <p className="text-sm text-muted-foreground">Camera and microphone access required</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Knowledge-Based Authentication (KBA)</p>
                      <p className="text-sm text-muted-foreground">You'll be asked identity verification questions before the session</p>
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

          {/* Sidebar tools */}
          <div className="space-y-4">
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

                {/* Save button */}
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
                  Saves notes, oath data, and session status to the appointment record.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
