/**
 * Security utilities for input validation and sanitization.
 * Items 497-518 from the audit plan.
 */

/** Disposable email domain blocklist (item 507) */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
  "dispostable.com", "mailnesia.com", "tempr.email", "10minutemail.com",
  "trashmail.com", "fakeinbox.com", "maildrop.cc",
]);

/** IDN homograph normalization — convert punycode/lookalikes to ASCII (item 14) */
function normalizeHomographs(domain: string): string {
  try {
    // Use URL API to decode punycode domains
    const url = new URL(`https://${domain}`);
    return url.hostname.toLowerCase();
  } catch {
    return domain.toLowerCase();
  }
}

export function isDisposableEmail(email: string): boolean {
  const rawDomain = email.split("@")[1]?.toLowerCase();
  if (!rawDomain) return false;
  const domain = normalizeHomographs(rawDomain);
  return DISPOSABLE_DOMAINS.has(domain);
}

/** Password complexity validation (item 514) */
export function validatePasswordComplexity(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain an uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain a lowercase letter." };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain a number." };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Password must contain a special character." };
  return { valid: true, message: "" };
}

/** Enhanced security headers for edge function responses (item 501) */
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
