import { cn } from "@/lib/utils";

interface BusinessPlanUpgradeProps {
  trigger?: boolean;
  planName?: string;
  className?: string;
}

export function BusinessPlanUpgrade({ trigger = false, planName = "Pro", className }: BusinessPlanUpgradeProps) {
  if (!trigger) return null;
  return (
    <div className={cn("flex flex-col items-center gap-3 p-6 animate-[curtainWipe_0.6s_ease-out_forwards]", className)}>
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-[morphBounce_0.6s_var(--bounce-easing)]">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary-foreground">
          <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" fill="currentColor" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-foreground">Welcome to {planName}!</p>
        <p className="text-sm text-muted-foreground">Your account has been upgraded</p>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
