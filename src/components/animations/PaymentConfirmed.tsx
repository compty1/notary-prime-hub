import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PaymentConfirmedProps {
  trigger?: boolean;
  amount?: string;
  onComplete?: () => void;
  className?: string;
}

export function PaymentConfirmed({ trigger = false, amount, onComplete, className }: PaymentConfirmedProps) {
  const [phase, setPhase] = useState<"idle" | "receipt" | "check" | "done">("idle");

  useEffect(() => {
    if (!trigger) { setPhase("idle"); return; }
    setPhase("receipt");
    const t1 = setTimeout(() => setPhase("check"), 500);
    const t2 = setTimeout(() => { setPhase("done"); onComplete?.(); }, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [trigger, onComplete]);

  if (phase === "idle") return null;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className={cn(
        "w-20 h-24 bg-card border border-border rounded-lg shadow-card flex flex-col items-center justify-center p-3",
        phase === "receipt" && "animate-[receiptSlide_0.5s_var(--bounce-easing)_forwards]"
      )}>
        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mb-1">
          <svg viewBox="0 0 24 24" className={cn(
            "w-5 h-5 text-success",
            phase === "check" && "animate-[checkPop_0.4s_var(--bounce-easing)_forwards]"
          )}>
            <path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {amount && <span className="text-xs font-bold text-foreground">{amount}</span>}
        <div className="w-full mt-1 space-y-0.5">
          <div className="h-0.5 bg-muted rounded" />
          <div className="h-0.5 bg-muted rounded w-3/4" />
        </div>
      </div>
      <span className={cn(
        "text-sm font-semibold text-success transition-opacity duration-500",
        phase === "done" ? "opacity-100" : "opacity-0"
      )}>
        Payment Confirmed
      </span>
    </div>
  );
}
