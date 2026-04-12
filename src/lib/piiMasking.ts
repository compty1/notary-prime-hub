/**
 * SVC-352/523: PII masking utility
 * Shows last4 for sensitive fields like SSN, phone, account numbers.
 */

/** Mask all but last N characters */
export function maskPII(value: string | null | undefined, visibleChars = 4, maskChar = "•"): string {
  if (!value) return "";
  const clean = value.replace(/\s/g, "");
  if (clean.length <= visibleChars) return clean;
  const masked = maskChar.repeat(clean.length - visibleChars);
  return masked + clean.slice(-visibleChars);
}

/** Mask email: show first 2 chars and domain */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return maskPII(email);
  const [local, domain] = email.split("@");
  const visibleLocal = local.slice(0, 2);
  return `${visibleLocal}${"•".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

/** Mask phone: show last 4 digits */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `(•••) •••-${digits.slice(-4)}`;
}

/** Mask SSN format */
export function maskSSN(ssn: string | null | undefined): string {
  if (!ssn) return "";
  const digits = ssn.replace(/\D/g, "");
  if (digits.length < 4) return "•••-••-" + digits;
  return `•••-••-${digits.slice(-4)}`;
}
