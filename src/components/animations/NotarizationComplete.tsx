import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NotarizationCompleteProps {
  trigger?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function NotarizationComplete({ trigger = false, onComplete, className }: NotarizationCompleteProps) {
  const [phase, setPhase] = useState<"idle" | "seal" | "check" | "glow" | "done">("idle");

  useEffect(() => {
    if (!trigger) { setPhase("idle"); return; }
    setPhase("seal");
    const t1 = setTimeout(() => setPhase("check"), 600);
    const t2 = setTimeout(() => setPhase("glow"), 1200);
    const t3 = setTimeout(() => { setPhase("done"); onComplete?.(); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [trigger, onComplete]);

  if (phase === "idle") return null;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {/* Seal */}
      <div className={cn(
        "relative w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center transition-all",
        phase === "seal" && "animate-[sealDrop_0.6s_var(--bounce-easing)_forwards]",
        phase === "glow" && "animate-[glowPulse_1.5s_ease-in-out_infinite]",
        phase === "done" && "shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
      )}>
        <svg viewBox="0 0 48 48" className="w-12 h-12 text-primary">
          <path
            d="M14 24 L22 32 L36 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "transition-all",
              phase === "check" && "animate-[drawCheck_0.5s_ease-out_forwards]",
              phase === "idle" || phase === "seal" ? "opacity-0 [stroke-dasharray:40] [stroke-dashoffset:40]" : ""
            )}
          />
        </svg>
      </div>
      {/* Particles */}
      {(phase === "glow" || phase === "done") && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary animate-[particleBurst_0.8s_ease-out_forwards]"
              style={{
                left: "50%", top: "50%",
                transform: `rotate(${i * 45}deg) translateY(-40px)`,
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}
      <p className={cn(
        "text-lg font-semibold text-primary transition-opacity duration-500",
        phase === "done" ? "opacity-100" : "opacity-0"
      )}>
        Notarization Complete
      </p>
    </div>
  );
}
