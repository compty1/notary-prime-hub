import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionTimeoutWarningProps {
  /** Session start time (ISO string or Date) */
  sessionStartedAt: string | Date | null;
  /** Timeout duration in minutes */
  timeoutMinutes: number;
  /** Called when user clicks extend (optional) */
  onExtend?: () => void;
  /** Called when session expires */
  onExpired?: () => void;
}

export function SessionTimeoutWarning({
  sessionStartedAt,
  timeoutMinutes,
  onExtend,
  onExpired,
}: SessionTimeoutWarningProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  const calcRemaining = useCallback(() => {
    if (!sessionStartedAt) return null;
    const start = new Date(sessionStartedAt).getTime();
    const end = start + timeoutMinutes * 60 * 1000;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }, [sessionStartedAt, timeoutMinutes]);

  useEffect(() => {
    if (!sessionStartedAt) return;
    const tick = () => {
      const rem = calcRemaining();
      if (rem === null) return;
      setSecondsLeft(rem);
      if (rem <= 0 && !expired) {
        setExpired(true);
        onExpired?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionStartedAt, calcRemaining, expired, onExpired]);

  if (secondsLeft === null || secondsLeft > 5 * 60) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  if (expired) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-destructive bg-destructive/10 px-6 py-3 shadow-lg backdrop-blur-sm" role="alert">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="font-medium text-destructive">Session has expired</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-6 py-3 shadow-lg backdrop-blur-sm transition-colors",
        isUrgent
          ? "border-destructive bg-destructive/10 animate-pulse"
          : "border-accent bg-accent/10"
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3">
        <Clock className={cn("h-5 w-5", isUrgent ? "text-destructive" : "text-accent-foreground")} />
        <p className={cn("font-medium", isUrgent ? "text-destructive" : "text-accent-foreground")}>
          Session expires in {mins}:{secs.toString().padStart(2, "0")}
        </p>
        {onExtend && (
          <Button size="sm" variant="outline" onClick={onExtend} className="ml-2">
            Extend
          </Button>
        )}
      </div>
    </div>
  );
}
