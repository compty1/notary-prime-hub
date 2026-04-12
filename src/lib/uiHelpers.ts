/**
 * C-001+: Dark mode audit utility and responsive helpers.
 * Provides consistent dark mode class helpers and responsive utilities.
 */

/**
 * Responsive breakpoint values matching tailwind defaults.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Dark-mode-safe class builder.
 * Returns classes that work properly in both light and dark modes.
 * Use this instead of hardcoding color classes that break in dark mode.
 */
export function dmSafe(lightClass: string, darkClass: string): string {
  return `${lightClass} dark:${darkClass}`;
}

/**
 * Common dark-mode-safe patterns.
 */
export const DM = {
  /** Card backgrounds */
  cardBg: "bg-card",
  /** Subtle backgrounds */
  subtleBg: "bg-muted/30 dark:bg-muted/20",
  /** Primary text */
  text: "text-foreground",
  /** Secondary text */
  textMuted: "text-muted-foreground",
  /** Borders */
  border: "border-border",
  /** Input backgrounds */
  inputBg: "bg-background",
  /** Hover states */
  hoverBg: "hover:bg-muted/50 dark:hover:bg-muted/30",
  /** Success indicators */
  success: "text-emerald-600 dark:text-emerald-400",
  /** Warning indicators */
  warning: "text-amber-600 dark:text-amber-400",
  /** Error indicators */
  error: "text-destructive",
  /** Info indicators */
  info: "text-blue-600 dark:text-blue-400",
  /** Badge backgrounds */
  badgeBg: "bg-primary/10 dark:bg-primary/20 text-primary",
  /** Divider lines */
  divider: "border-t border-border",
} as const;

/**
 * Accessibility helpers.
 */
export const A11Y = {
  /** Screen-reader only text */
  srOnly: "sr-only",
  /** Focus ring visible on keyboard navigation */
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  /** Skip to main content link */
  skipLink: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-3 focus:rounded-lg focus:shadow-lg focus:text-foreground",
  /** Reduced motion class */
  reducedMotion: "motion-safe:transition-all motion-reduce:transition-none",
} as const;

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Responsive table wrapper classes.
 * Makes tables horizontally scrollable on mobile.
 */
export const RESPONSIVE_TABLE = "w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" as const;

/**
 * Responsive grid patterns.
 */
export const RESPONSIVE_GRID = {
  /** 1 col mobile, 2 tablet, 3 desktop */
  cols3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  /** 1 col mobile, 2 tablet, 4 desktop */
  cols4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  /** 1 col mobile, 2 desktop */
  cols2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  /** Stats grid */
  stats: "grid grid-cols-2 sm:grid-cols-4 gap-3",
} as const;
