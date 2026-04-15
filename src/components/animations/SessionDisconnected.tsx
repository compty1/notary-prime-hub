import { cn } from "@/lib/utils";

interface SessionDisconnectedProps {
  trigger?: boolean;
  className?: string;
}

export function SessionDisconnected({ trigger = false, className }: SessionDisconnectedProps) {
  if (!trigger) return null;
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-[cardSlideUp_0.4s_ease-out]", className)}>
      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-destructive animate-[subtlePulse_2s_ease-in-out_infinite]">
          <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-destructive">Session Disconnected</p>
        <p className="text-xs text-muted-foreground">Attempting to reconnect...</p>
      </div>
    </div>
  );
}
