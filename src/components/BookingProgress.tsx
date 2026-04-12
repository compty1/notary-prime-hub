/**
 * SVC-363: Booking progress indicator
 * Visual step progress bar for multi-step booking.
 */
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BookingProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function BookingProgress({ steps, currentStep, className }: BookingProgressProps) {
  return (
    <nav aria-label="Booking progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <li key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                    isComplete && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary bg-primary/10",
                    !isComplete && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center max-w-[80px] leading-tight",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-2 mt-[-16px]",
                  isComplete ? "bg-primary" : "bg-muted-foreground/20"
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
