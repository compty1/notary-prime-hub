import { cn } from "@/lib/utils";

interface SessionJoinedProps {
  trigger?: boolean;
  participantName?: string;
  className?: string;
}

export function SessionJoined({ trigger = false, participantName, className }: SessionJoinedProps) {
  if (!trigger) return null;
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20 animate-[cardSlideUp_0.4s_var(--bounce-easing)_forwards]", className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center animate-[cameraIris_0.6s_ease-out]">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-success">
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card animate-[livePulse_2s_ease-in-out_infinite]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{participantName || "Participant"} joined</p>
        <p className="text-xs text-muted-foreground">Connected to session</p>
      </div>
    </div>
  );
}
