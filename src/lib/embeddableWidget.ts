/**
 * Embeddable booking widget configuration.
 * Enhancement #94 (Embeddable booking widget for external sites)
 */

export interface WidgetConfig {
  notarySlug: string;
  theme?: "light" | "dark";
  primaryColor?: string;
  width?: string;
  height?: string;
  services?: string[];
}

/** Generate embed code for a notary's booking widget */
export function generateEmbedCode(config: WidgetConfig): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://notary-prime-hub.lovable.app";
  const params = new URLSearchParams({
    slug: config.notarySlug,
    theme: config.theme || "light",
    ...(config.primaryColor ? { color: config.primaryColor } : {}),
    ...(config.services?.length ? { services: config.services.join(",") } : {}),
  });

  const src = `${baseUrl}/embed/book?${params}`;
  const w = config.width || "100%";
  const h = config.height || "600px";

  return `<iframe src="${src}" width="${w}" height="${h}" frameborder="0" style="border:none;border-radius:12px;" title="Book a Notary Appointment" loading="lazy" allow="payment"></iframe>`;
}

/** Generate a direct booking link */
export function generateBookingLink(notarySlug: string, serviceType?: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://notary-prime-hub.lovable.app";
  const params = serviceType ? `?service=${encodeURIComponent(serviceType)}` : "";
  return `${baseUrl}/notary/${notarySlug}/book${params}`;
}
