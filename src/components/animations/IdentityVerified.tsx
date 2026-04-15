import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface IdentityVerifiedProps {
  trigger?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function IdentityVerified({ trigger = false, onComplete, className }: IdentityVerifiedProps) {
  const [phase, setPhase] = useState<"idle" | "shield" | "badge" | "done">("idle");

  useEffect(() => {
    if (!trigger) { setPhase("idle"); return; }
    setPhase("shield");
    const t1 = setTimeout(() => setPhase("badge"), 700);
    const t2 = setTimeout(() => { setPhase("done"); onComplete?.(); }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [trigger, onComplete]);

  if (phase === "idle") return null;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className={cn(
        "relative w-20 h-24",
        phase === "shield" && "animate-[shieldFill_0.7s_ease-out_forwards]"
      )}>
        <svg viewBox="0 0 80 96" className="w-full h-full">
          <path
            d="M40 4 L72 20 L72 52 C72 72 56 88 40 92 C24 88 8 72 8 52 L8 20 Z"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            className="transition-all duration-700"
            style={{ fill: phase !== "idle" ? "hsl(var(--primary) / 0.1)" : "none" }}
          />
          <path
            d="M28 48 L38 58 L56 36"
            fill="none"
            stroke="hsl(var(--success))"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(phase === "badge" && "animate-[drawCheck_0.4s_ease-out_forwards]")}
            style={{ strokeDasharray: 40, strokeDashoffset: phase === "shield" ? 40 : 0 }}
          />
        </svg>
        {phase === "badge" && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center animate-[badgePop_0.4s_var(--bounce-easing)_forwards]">
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-white">
              <path d="M4 8l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <span className={cn(
        "text-sm font-semibold text-success transition-opacity duration-500",
        phase === "done" ? "opacity-100" : "opacity-0"
      )}>
        Identity Verified
      </span>
    </div>
  );
}
