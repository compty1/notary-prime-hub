import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle, Mic, MicOff, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const oathScripts = {
  acknowledgment: null,
  jurat: "Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?",
  oath: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?",
};

export default function BlueNotarySession() {
  const { toast } = useToast();
  const [oathType, setOathType] = useState<keyof typeof oathScripts>("jurat");
  const [oathAdministered, setOathAdministered] = useState(false);
  const [oathTimestamp, setOathTimestamp] = useState<string | null>(null);

  // Voice-to-notes
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setNotes((prev) => prev + " " + transcript);
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
      recognitionRef.current.start();
      setIsListening(true);
      toast({ title: "Listening...", description: "Speak clearly — notes will be captured automatically." });
    }
  };

  const administerOath = () => {
    setOathAdministered(true);
    setOathTimestamp(new Date().toISOString());
    toast({ title: "Oath recorded", description: `Oath administered at ${new Date().toLocaleTimeString()}` });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Secure RON Session</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main session area */}
          <div className="lg:col-span-2">
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

            {/* BlueNotary Iframe Placeholder */}
            <Card className="border-2 border-dashed border-accent/30">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <Monitor className="mb-4 h-16 w-16 text-accent/50" />
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">BlueNotary Session</h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  This is where the BlueNotary remote online notarization platform will be embedded.
                  Replace this placeholder with your BlueNotary iframe URL.
                </p>
                <code className="rounded bg-muted px-4 py-2 text-xs text-muted-foreground">
                  {'<iframe src="https://app.bluenotary.us/your-session-url" />'}
                </code>
                <p className="mt-4 text-xs text-muted-foreground">
                  Ohio RON Compliant • ORC §147.65-.66 • End-to-End Encrypted
                </p>
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Notes will be saved to the appointment and journal entry.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
