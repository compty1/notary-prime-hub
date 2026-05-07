/**
 * Resolves design-token CSS variables to runtime color strings.
 * Use for canvas, PDF, and Recharts where Tailwind classes don't apply.
 */
export function getCssVarHsl(name: string, fallback = "0 0% 0%"): string {
  if (typeof window === "undefined") return `hsl(${fallback})`;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  return `hsl(${v})`;
}

export const themeColors = {
  background: () => getCssVarHsl("--background"),
  foreground: () => getCssVarHsl("--foreground"),
  primary: () => getCssVarHsl("--primary"),
  secondary: () => getCssVarHsl("--secondary"),
  accent: () => getCssVarHsl("--accent"),
  muted: () => getCssVarHsl("--muted"),
  border: () => getCssVarHsl("--border"),
  destructive: () => getCssVarHsl("--destructive"),
};
