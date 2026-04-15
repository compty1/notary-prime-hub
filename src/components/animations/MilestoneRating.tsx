import { useState } from "react";
import { cn } from "@/lib/utils";

interface MilestoneRatingProps {
  rating?: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  className?: string;
}

export function MilestoneRating({ rating = 0, maxRating = 5, onRate, className }: MilestoneRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const value = i + 1;
        const filled = value <= (hovered || rating);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onRate?.(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            className={cn(
              "transition-all duration-200",
              filled && "animate-[badgePop_0.3s_var(--bounce-easing)]",
              "hover:scale-110"
            )}
          >
            <svg viewBox="0 0 24 24" className={cn("w-7 h-7 transition-colors", filled ? "text-primary fill-primary" : "text-muted-foreground/30")}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
