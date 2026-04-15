/**
 * GS-009/GS-010: Apply brand colors and font from platform_settings to CSS custom properties.
 */
import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useBrandColors() {
  const { get } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    // GS-009: Apply brand colors to CSS custom properties
    const primaryColor = get("brand_primary_color");
    const accentColor = get("brand_accent_color");

    if (primaryColor) {
      const hsl = hexToHsl(primaryColor);
      if (hsl) root.style.setProperty("--primary", hsl);
    }
    if (accentColor) {
      const hsl = hexToHsl(accentColor);
      if (hsl) root.style.setProperty("--accent", hsl);
    }

    // GS-010: Apply brand font
    const brandFont = get("brand_font");
    if (brandFont && /^[a-zA-Z\s]+$/.test(brandFont)) {
      // Sanitize font name (only allow alphanumeric + spaces)
      root.style.setProperty("--font-body", `"${brandFont}", system-ui, sans-serif`);
      // Load from Google Fonts if needed
      const existing = document.querySelector(`link[data-brand-font]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(brandFont)}:wght@400;500;600;700&display=swap`;
        link.setAttribute("data-brand-font", "true");
        document.head.appendChild(link);
      }
    }

    return () => {
      // Cleanup on unmount
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--font-body");
    };
  }, [get]);
}
