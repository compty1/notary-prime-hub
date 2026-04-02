/**
 * Gaps 156–175: Advanced client-side validation utilities
 */

/** Validate phone number format (US) */
export function validatePhone(phone: string): { valid: boolean; message: string } {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return { valid: false, message: "Phone number is required." };
  if (digits.length < 10) return { valid: false, message: "Phone number must be at least 10 digits." };
  if (digits.length > 11) return { valid: false, message: "Phone number is too long." };
  return { valid: true, message: "" };
}

/** Validate US zip code */
export function validateZipCode(zip: string): { valid: boolean; message: string } {
  if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
    return { valid: false, message: "Enter a valid 5-digit ZIP code." };
  }
  return { valid: true, message: "" };
}

/** Validate email with stricter rules */
export function validateEmail(email: string): { valid: boolean; message: string } {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!pattern.test(email.trim())) {
    return { valid: false, message: "Enter a valid email address." };
  }
  if (email.length > 254) {
    return { valid: false, message: "Email address is too long." };
  }
  return { valid: true, message: "" };
}

/** Validate that a date is not in the past */
export function validateFutureDate(dateStr: string): { valid: boolean; message: string } {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(date.getTime())) return { valid: false, message: "Invalid date." };
  if (date < today) return { valid: false, message: "Date cannot be in the past." };
  return { valid: true, message: "" };
}

/** Validate payment amount */
export function validatePaymentAmount(amount: number): { valid: boolean; message: string } {
  if (isNaN(amount) || !Number.isFinite(amount)) return { valid: false, message: "Invalid amount." };
  if (amount <= 0) return { valid: false, message: "Amount must be greater than $0." };
  if (amount > 50000) return { valid: false, message: "Amount exceeds maximum ($50,000)." };
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(amount * 100) / 100;
  if (rounded !== amount) return { valid: false, message: "Amount must have at most 2 decimal places." };
  return { valid: true, message: "" };
}

/** Enforce text length limits */
export function validateTextLength(text: string, maxLength: number, fieldName = "Field"): { valid: boolean; message: string } {
  if (text.length > maxLength) {
    return { valid: false, message: `${fieldName} must be ${maxLength} characters or less.` };
  }
  return { valid: true, message: "" };
}

/** Validate file for upload */
export function validateFile(
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
): { valid: boolean; message: string } {
  const { maxSizeMB = 25, allowedTypes } = options;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, message: `File must be under ${maxSizeMB}MB.` };
  }
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { valid: false, message: `Unsupported file type. Allowed: ${allowedTypes.join(", ")}` };
  }
  return { valid: true, message: "" };
}

/** Safe currency rounding to avoid floating point errors (Gap 171) */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
