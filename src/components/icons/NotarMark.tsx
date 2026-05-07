import { cn } from "@/lib/utils";

/**
 * NotarMark — unified, themable, two-color flat icon set.
 * Replaces the disparate 3D PNG zoo. All marks render at currentColor
 * for the stroke and use `--notar-accent` (defaults to hsl(var(--accent)))
 * for the secondary fill, so they automatically adapt to theme changes.
 *
 * Add new marks here only. Keep stroke at 1.5, rounded caps/joins.
 */

export type NotarMarkName =
  | "ron"
  | "mobile"
  | "loan"
  | "apostille"
  | "oath"
  | "copy"
  | "i9"
  | "poa"
  | "upload"
  | "identity"
  | "video"
  | "download"
  | "security"
  | "schedule"
  | "certified"
  | "seal"
  | "compliance"
  | "verified"
  | "shield-check"
  | "stamp"
  | "scroll"
  | "handshake"
  | "globe"
  | "clock";

interface NotarMarkProps extends React.SVGProps<SVGSVGElement> {
  name: NotarMarkName;
  size?: number;
  /** Override accent color. Defaults to var(--accent). */
  accent?: string;
  className?: string;
}

const COMMON = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.5,
};

function Frame({ children, className, size = 28, accent, ...rest }: any) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("notar-mark", className)}
      style={{ color: "currentColor", ["--notar-accent" as any]: accent ?? "hsl(var(--accent))" }}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

const MARKS: Record<NotarMarkName, React.ReactNode> = {
  ron: (
    <>
      <rect x="3" y="7" width="22" height="14" rx="2" stroke="currentColor" {...COMMON} />
      <path d="M25 12l4-2v12l-4-2z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <circle cx="14" cy="14" r="3" stroke="currentColor" {...COMMON} />
      <path d="M9 27h14" stroke="currentColor" {...COMMON} />
    </>
  ),
  mobile: (
    <>
      <rect x="9" y="3" width="14" height="26" rx="3" stroke="currentColor" {...COMMON} />
      <circle cx="16" cy="24" r="1.2" fill="currentColor" />
      <path d="M11 7h10" stroke="currentColor" {...COMMON} />
      <path d="M13 12l3 3 5-5" stroke="var(--notar-accent)" {...COMMON} strokeWidth={2} />
    </>
  ),
  loan: (
    <>
      <path d="M5 10l11-5 11 5v3H5z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M8 13v10M14 13v10M18 13v10M24 13v10" stroke="currentColor" {...COMMON} />
      <path d="M4 26h24" stroke="currentColor" {...COMMON} />
    </>
  ),
  apostille: (
    <>
      <circle cx="16" cy="16" r="11" stroke="currentColor" {...COMMON} />
      <path d="M5 16h22M16 5c4 3 4 19 0 22M16 5c-4 3-4 19 0 22" stroke="currentColor" {...COMMON} />
      <circle cx="16" cy="16" r="3" fill="var(--notar-accent)" />
    </>
  ),
  oath: (
    <>
      <path d="M9 4h12l3 4v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z" stroke="currentColor" {...COMMON} />
      <path d="M10 13h12M10 17h12M10 21h8" stroke="currentColor" {...COMMON} />
      <circle cx="22" cy="22" r="3" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
    </>
  ),
  copy: (
    <>
      <rect x="6" y="3" width="16" height="20" rx="2" stroke="currentColor" {...COMMON} />
      <rect x="10" y="9" width="16" height="20" rx="2" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
    </>
  ),
  i9: (
    <>
      <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" {...COMMON} />
      <circle cx="12" cy="14" r="3" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M8 21c1.5-2 7-2 8 0" stroke="currentColor" {...COMMON} />
      <path d="M19 12h6M19 16h6M19 20h4" stroke="currentColor" {...COMMON} />
    </>
  ),
  poa: (
    <>
      <path d="M6 4h14l6 6v18a2 2 0 0 1-2 2H6z" stroke="currentColor" {...COMMON} />
      <path d="M20 4v6h6" stroke="currentColor" {...COMMON} />
      <path d="M10 20l3 3 8-8" stroke="var(--notar-accent)" {...COMMON} strokeWidth={2} />
    </>
  ),
  upload: (
    <>
      <path d="M16 22V6m0 0l-5 5m5-5l5 5" stroke="currentColor" {...COMMON} strokeWidth={2} />
      <path d="M5 22v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-3" stroke="currentColor" {...COMMON} />
      <circle cx="16" cy="6" r="2" fill="var(--notar-accent)" />
    </>
  ),
  identity: (
    <>
      <rect x="3" y="6" width="26" height="20" rx="2" stroke="currentColor" {...COMMON} />
      <circle cx="11" cy="15" r="3" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M6 22c1-3 9-3 10 0" stroke="currentColor" {...COMMON} />
      <path d="M19 12h7M19 16h7M19 20h4" stroke="currentColor" {...COMMON} />
    </>
  ),
  video: (
    <>
      <rect x="3" y="9" width="18" height="14" rx="2" stroke="currentColor" {...COMMON} />
      <path d="M21 14l8-4v12l-8-4z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <circle cx="9" cy="16" r="1.5" fill="currentColor" />
    </>
  ),
  download: (
    <>
      <path d="M16 5v17m0 0l-6-6m6 6l6-6" stroke="currentColor" {...COMMON} strokeWidth={2} />
      <rect x="5" y="24" width="22" height="3" rx="1" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
    </>
  ),
  security: (
    <>
      <path d="M16 3l11 4v9c0 7-5 11-11 13-6-2-11-6-11-13V7z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M11 16l3.5 3.5L21 13" stroke="currentColor" {...COMMON} strokeWidth={2} />
    </>
  ),
  schedule: (
    <>
      <rect x="4" y="6" width="24" height="22" rx="2" stroke="currentColor" {...COMMON} />
      <path d="M4 12h24M10 4v6M22 4v6" stroke="currentColor" {...COMMON} />
      <rect x="9" y="16" width="5" height="5" rx="1" fill="var(--notar-accent)" />
    </>
  ),
  certified: (
    <>
      <circle cx="16" cy="14" r="8" stroke="currentColor" {...COMMON} />
      <path d="M11 21l-2 7 7-3 7 3-2-7" stroke="currentColor" {...COMMON} />
      <path d="M12 14l3 3 6-6" stroke="var(--notar-accent)" {...COMMON} strokeWidth={2} />
    </>
  ),
  seal: (
    <>
      <circle cx="16" cy="16" r="11" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <circle cx="16" cy="16" r="7" stroke="currentColor" {...COMMON} />
      <path d="M12 16l3 3 5-6" stroke="currentColor" {...COMMON} strokeWidth={2} />
    </>
  ),
  compliance: (
    <>
      <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" {...COMMON} />
      <path d="M11 11h10M11 15h10M11 19h6" stroke="currentColor" {...COMMON} />
      <circle cx="22" cy="22" r="4" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M20 22l1.5 1.5L24 21" stroke="currentColor" {...COMMON} />
    </>
  ),
  verified: (
    <>
      <path d="M16 3l3 3 4-1 1 4 3 3-3 3-1 4-4-1-3 3-3-3-4 1-1-4-3-3 3-3 1-4 4 1z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M11 16l3 3 7-7" stroke="currentColor" {...COMMON} strokeWidth={2} />
    </>
  ),
  "shield-check": (
    <>
      <path d="M16 3l11 4v9c0 7-5 11-11 13-6-2-11-6-11-13V7z" stroke="currentColor" {...COMMON} />
      <path d="M11 16l3.5 3.5L21 13" stroke="var(--notar-accent)" {...COMMON} strokeWidth={2} />
    </>
  ),
  stamp: (
    <>
      <path d="M10 4h12l-2 10h2a3 3 0 0 1 3 3v3H7v-3a3 3 0 0 1 3-3h2z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M5 24h22M5 28h22" stroke="currentColor" {...COMMON} />
    </>
  ),
  scroll: (
    <>
      <path d="M6 6h18v17a4 4 0 0 1-4 4H8a2 2 0 0 1-2-2z" stroke="currentColor" {...COMMON} />
      <path d="M24 6c2 0 2 4 0 4h-4M10 12h10M10 16h10M10 20h6" stroke="currentColor" {...COMMON} />
      <circle cx="22" cy="24" r="2" fill="var(--notar-accent)" />
    </>
  ),
  handshake: (
    <>
      <path d="M3 16l5-5 4 1 5-3 5 3 4-1 3 4-7 8-4-3-3 3-4-3z" fill="var(--notar-accent)" stroke="currentColor" {...COMMON} />
      <path d="M12 12l5 3" stroke="currentColor" {...COMMON} />
    </>
  ),
  globe: (
    <>
      <circle cx="16" cy="16" r="12" stroke="currentColor" {...COMMON} />
      <path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24" stroke="currentColor" {...COMMON} />
      <circle cx="22" cy="10" r="2" fill="var(--notar-accent)" />
    </>
  ),
  clock: (
    <>
      <circle cx="16" cy="16" r="12" stroke="currentColor" {...COMMON} />
      <path d="M16 9v7l5 3" stroke="var(--notar-accent)" {...COMMON} strokeWidth={2} />
    </>
  ),
};

export function NotarMark({ name, size = 28, accent, className, ...rest }: NotarMarkProps) {
  return (
    <Frame size={size} accent={accent} className={className} {...rest}>
      {MARKS[name]}
    </Frame>
  );
}

/** Convenience badge: accent-tinted square wrapper around a NotarMark. */
export function NotarMarkBadge({
  name,
  size = 56,
  className,
}: {
  name: NotarMarkName;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[7px] border-2 border-foreground bg-accent text-foreground shadow-block",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <NotarMark name={name} size={Math.round(size * 0.62)} />
    </span>
  );
}
