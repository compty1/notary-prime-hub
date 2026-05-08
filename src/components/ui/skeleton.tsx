import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export { Skeleton };
