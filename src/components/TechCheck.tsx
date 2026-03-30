import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Mic, Wifi, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface TechCheckProps {
  onComplete?: () => void;
}

export default function TechCheck({ onComplete }: TechCheckProps) {
  const [results, setResults] = useState<{ camera: boolean | null; mic: boolean | null; connection: boolean | null; speed: string | null }>({ camera: null, mic: null, connection: null, speed: null });
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    setDone(false);
    setResults({ camera: null, mic: null, connection: null, speed: null });

    // Camera check
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setResults(p => ({ ...p, camera: true }));
    } catch {
      setResults(p => ({ ...p, camera: false }));
    }

    // Mic check
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setResults(p => ({ ...p, mic: true }));
    } catch {
      setResults(p => ({ ...p, mic: false }));
    }

    // Connection check + speed estimate
    const online = navigator.onLine;
    setResults(p => ({ ...p, connection: online }));

    if (online) {
      try {
        const start = performance.now();
        await fetch("https://www.google.com/favicon.ico?" + Date.now(), { mode: "no-cors", cache: "no-store" });
        const elapsed = performance.now() - start;
        const speed = elapsed < 200 ? "Excellent" : elapsed < 500 ? "Good" : elapsed < 1000 ? "Fair" : "Slow";
        setResults(p => ({ ...p, speed }));
      } catch {
        setResults(p => ({ ...p, speed: "Unknown" }));
      }
    }

    setChecking(false);
    setDone(true);
  };

  const allPassed = results.camera === true && results.mic === true && results.connection === true;

  const checks = [
    { label: "Camera", result: results.camera, icon: Camera, detail: results.camera ? "Webcam detected and accessible" : results.camera === false ? "Camera not detected or permission denied" : null },
    { label: "Microphone", result: results.mic, icon: Mic, detail: results.mic ? "Microphone detected and accessible" : results.mic === false ? "Microphone not detected or permission denied" : null },
    { label: "Internet Connection", result: results.connection, icon: Wifi, detail: results.connection ? `Connected${results.speed ? ` · Speed: ${results.speed}` : ""}` : results.connection === false ? "No internet connection detected" : null },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-sans text-lg flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary" /> RON Session Tech Check
        </CardTitle>
        <p className="text-xs text-muted-foreground">Verify your camera, microphone, and internet before your Remote Online Notarization session.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map(item => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">{item.label}</span>
                {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
              </div>
            </div>
            {checking && item.result === null ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : item.result === true ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : item.result === false ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted" />
            )}
          </div>
        ))}

        {done && (
          <div className={`rounded-lg p-3 text-sm font-medium text-center ${allPassed ? "bg-primary/5 text-primary border border-primary/20" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
            {allPassed ? "✓ All checks passed — you're ready for your session!" : "⚠️ Some checks failed. Please resolve the issues above before your session."}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={runCheck} disabled={checking} className="flex-1 ">
            {checking ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : done ? <RefreshCw className="mr-1 h-4 w-4" /> : <Wifi className="mr-1 h-4 w-4" />}
            {checking ? "Checking..." : done ? "Re-run Check" : "Start Tech Check"}
          </Button>
          {done && allPassed && onComplete && (
            <Button onClick={onComplete} variant="outline">Continue</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
