import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NotaryOnCallProps {
  className?: string;
  /** When true, render a compact pill suitable for navbars */
  compact?: boolean;
}

/**
 * NotaryOnCall — live presence indicator.
 * Today: derives a stable mock count by hour-of-day (no server calls).
 * Wire to an `availability` query later without changing the consumer API.
 */
export function NotaryOnCall({ className, compact = false }: NotaryOnCallProps) {
  const [count, setCount] = useState(2);
  const [pickup, setPickup] = useState(90);

  useEffect(() => {
    const compute = () => {
      const h = new Date().getHours();
      // 7am–11pm ET higher availability, overnight lower
      const base = h >= 7 && h <= 23 ? 3 + ((h % 5) % 4) : 1;
      setCount(base);
      setPickup(base >= 3 ? 60 : base === 2 ? 120 : 240);
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, []);

  const live = count > 0;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/90 px-3 py-1 text-xs font-medium text-surface-foreground shadow-soft",
        compact && "px-2 py-0.5 text-[11px]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            live ? "animate-ping bg-success" : "bg-muted-foreground",
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            live ? "bg-success" : "bg-muted-foreground",
          )}
        />
      </span>
      {live ? (
        <span>
          <strong>{count}</strong> notar{count === 1 ? "y" : "ies"} online · ~{pickup}s pickup
        </span>
      ) : (
        <span>Notaries offline · request a callback</span>
      )}
    </div>
  );
}
