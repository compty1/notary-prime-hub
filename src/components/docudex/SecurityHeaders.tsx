/**
 * CC-003: Security hardening — CSP meta tag, rate limiting, validation utilities
 */

/** Content Security Policy meta tag for DocuDex editor */
export const DOCUDEX_CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'self';
`.replace(/\s+/g, " ").trim();

/** File magic bytes validation */
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "image/svg+xml": [[0x3C, 0x3F, 0x78, 0x6D], [0x3C, 0x73, 0x76, 0x67]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

export function validateFileMagicBytes(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer);
      const expectedMagic = MAGIC_BYTES[file.type];
      if (!expectedMagic) {
        resolve(true); // Unknown type, allow
        return;
      }
      const matches = expectedMagic.some(magic =>
        magic.every((byte, i) => arr[i] === byte)
      );
      resolve(matches);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
}

/** Simple client-side rate limiter */
export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) return false;
    this.timestamps.push(now);
    return true;
  }

  reset() {
    this.timestamps = [];
  }
}

/** Sanitize HTML to prevent XSS in user-provided content */
export function sanitizeEditorContent(html: string): string {
  const dangerous = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const onEvents = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
  const iframes = /<iframe\b[^>]*>.*?<\/iframe>/gi;
  const objects = /<(?:object|embed|applet)\b[^>]*>.*?<\/(?:object|embed|applet)>/gi;

  return html
    .replace(dangerous, "")
    .replace(onEvents, "")
    .replace(iframes, "")
    .replace(objects, "");
}
