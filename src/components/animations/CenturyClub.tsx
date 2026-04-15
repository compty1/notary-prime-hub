import { cn } from "@/lib/utils";

interface CenturyClubProps {
  count: number;
  milestone?: number;
  className?: string;
}

export function CenturyClub({ count, milestone = 100, className }: CenturyClubProps) {
  const isHit = count >= milestone;
  return (
    <div className={cn("flex flex-col items-center gap-2 p-4", className)}>
      <div className={cn(
        "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700",
        isHit
          ? "bg-primary/10 border-2 border-primary animate-[glowPulse_2s_ease-in-out_infinite]"
          : "bg-muted border-2 border-muted-foreground/20"
      )}>
        <span className={cn(
          "text-2xl font-bold transition-colors",
          isHit ? "text-primary" : "text-muted-foreground"
        )}>
          {count}
        </span>
        {isHit && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary animate-[driftDown_2s_ease-out_infinite]"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: "-8px",
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </>
        )}
      </div>
      <span className={cn(
        "text-sm font-semibold transition-colors",
        isHit ? "text-primary" : "text-muted-foreground"
      )}>
        {isHit ? `🎉 ${milestone} Milestone!` : `${milestone - count} to go`}
      </span>
    </div>
  );
}
