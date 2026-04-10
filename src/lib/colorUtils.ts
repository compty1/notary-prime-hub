/**
 * Color conversion utilities for notary page theming.
 * Fixes D002/D004/UX004: HSL↔Hex conversion for HTML color inputs.
 */

/** Convert HSL string like "hsl(43, 74%, 49%)" to hex "#RRGGBB" */
export function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/i);
  if (!match) return hsl; // already hex or invalid
  const h = parseFloat(match[1]) / 360;
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Check if a string is a valid hex color */
export function isHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/** Ensure a color value is hex (convert from HSL if needed) */
export function ensureHex(color: string | undefined | null, fallback = "#C9A227"): string {
  if (!color) return fallback;
  if (isHex(color)) return color;
  const converted = hslToHex(color);
  return isHex(converted) ? converted : fallback;
}

/** Sanitize a slug: lowercase, alphanumeric + hyphens, no consecutive/leading/trailing hyphens */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
