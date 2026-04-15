import { cn } from "@/lib/utils";

interface SkeletonLoadingProps {
  variant?: "card" | "list" | "profile" | "table";
  count?: number;
  className?: string;
}

export function SkeletonLoading({ variant = "card", count = 3, className }: SkeletonLoadingProps) {
  const items = Array.from({ length: count });

  if (variant === "profile") {
    return (
      <div className={cn("flex items-center gap-4 p-4", className)}>
        <div className="w-12 h-12 rounded-full skeleton-shimmer animate-[skeletonSweep_1.5s_ease-in-out_infinite]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded skeleton-shimmer animate-[skeletonSweep_1.5s_ease-in-out_infinite_0.1s]" />
          <div className="h-3 w-48 rounded skeleton-shimmer animate-[skeletonSweep_1.5s_ease-in-out_infinite_0.2s]" />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-2 p-4", className)}>
        <div className="h-8 rounded skeleton-shimmer" />
        {items.map((_, i) => (
          <div key={i} className="h-12 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        {items.map((_, i) => (
          <div key={i} className="flex gap-3 items-center animate-[tileSlide_0.3s_ease-out_forwards]" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="w-10 h-10 rounded-lg skeleton-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
              <div className="h-3 w-1/2 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4", className)}>
      {items.map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-3 animate-[tileSlide_0.3s_ease-out_forwards]" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="h-32 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
