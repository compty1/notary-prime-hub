/**
 * Form validation utilities (Items 638, 660-675)
 * Centralized validation rules for all forms across the platform.
 */

/** Email validation with comprehensive regex */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

/** Phone validation (US format) */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

/** Name validation (no special characters except hyphens, apostrophes, spaces) */
export function isValidName(name: string): boolean {
  return /^[a-zA-Z\s'\-\.]{2,100}$/.test(name.trim());
}

/** Ohio zip code validation */
export function isOhioZipCode(zip: string): boolean {
  const zipNum = parseInt(zip.replace(/\D/g, "").slice(0, 5), 10);
  return zipNum >= 43001 && zipNum <= 45999;
}

/** Validate confirmation number format (NTR-YYYYMMDD-XXXXXX) */
export function isValidConfirmationNumber(num: string): boolean {
  return /^NTR-\d{8}-[a-f0-9]{6}$/i.test(num);
}

/** Credit card number validation (Luhn algorithm) */
export function isValidCreditCard(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

/** Validate date string (YYYY-MM-DD format) */
export function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Validate time string (HH:MM format) */
export function isValidTime(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

/** Get all validation errors for a form data object */
export function validateFormData(
  data: Record<string, string>,
  rules: Record<string, { required?: boolean; validator?: (v: string) => boolean; message: string }[]>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field] || "";
    const fieldErrors: string[] = [];

    for (const rule of fieldRules) {
      if (rule.required && !value.trim()) {
        fieldErrors.push(rule.message);
      } else if (rule.validator && value.trim() && !rule.validator(value)) {
        fieldErrors.push(rule.message);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return errors;
}

/** Booking form validation rules (FORM-001) */
export const BOOKING_VALIDATION_RULES = {
  serviceType: [{ required: true, message: "Please select a service type." }],
  date: [
    { required: true, message: "Please select a date." },
    { validator: isValidDate, message: "Please enter a valid date (YYYY-MM-DD)." },
  ],
  time: [
    { required: true, message: "Please select a time slot." },
    { validator: isValidTime, message: "Please enter a valid time." },
  ],
  guestName: [
    { required: true, message: "Full name is required." },
    { validator: isValidName, message: "Name contains invalid characters." },
  ],
  guestEmail: [
    { required: true, message: "Email address is required." },
    { validator: isValidEmail, message: "Please enter a valid email address." },
  ],
  guestPassword: [
    { required: true, message: "Password is required." },
    { validator: (v: string) => v.length >= 8, message: "Password must be at least 8 characters." },
    { validator: (v: string) => /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v), message: "Password must contain uppercase, lowercase, number, and special character." },
  ],
};

/** Service request form validation rules (FORM-002) */
export const SERVICE_REQUEST_VALIDATION_RULES = {
  serviceType: [{ required: true, message: "Please select a service." }],
  description: [{ required: true, message: "Please describe your request." }],
  clientName: [
    { required: true, message: "Name is required." },
    { validator: isValidName, message: "Name contains invalid characters." },
  ],
  email: [
    { required: true, message: "Email is required." },
    { validator: isValidEmail, message: "Please enter a valid email." },
  ],
};

/** Contact form validation rules (FORM-003) */
export const CONTACT_VALIDATION_RULES = {
  name: [
    { required: true, message: "Your name is required." },
    { validator: isValidName, message: "Name contains invalid characters." },
  ],
  email: [
    { required: true, message: "Email address is required." },
    { validator: isValidEmail, message: "Please enter a valid email address." },
  ],
  message: [
    { required: true, message: "Please enter a message." },
    { validator: (v: string) => v.trim().length >= 10, message: "Message must be at least 10 characters." },
  ],
};

/** Sign-up form validation (FORM-004) */
export const SIGNUP_VALIDATION_RULES = {
  fullName: [
    { required: true, message: "Full name is required." },
    { validator: isValidName, message: "Name contains invalid characters." },
  ],
  email: [
    { required: true, message: "Email address is required." },
    { validator: isValidEmail, message: "Please enter a valid email address." },
  ],
  password: [
    { required: true, message: "Password is required." },
    { validator: (v: string) => v.length >= 8, message: "Password must be at least 8 characters." },
    { validator: (v: string) => /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v), message: "Must contain uppercase, lowercase, number, and special character." },
  ],
};

/** Profile update validation (FORM-005) */
export const PROFILE_VALIDATION_RULES = {
  full_name: [
    { required: true, message: "Full name is required." },
    { validator: isValidName, message: "Name contains invalid characters." },
  ],
  email: [
    { validator: isValidEmail, message: "Please enter a valid email address." },
  ],
  phone: [
    { validator: isValidPhone, message: "Please enter a valid US phone number." },
  ],
};

/** Validate a zip code (5-digit US format) */
export function isValidZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

/** Validate an address has minimum content */
export function isValidAddress(address: string): boolean {
  return address.trim().length >= 5;
}
