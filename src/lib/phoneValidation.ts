/**
 * US phone number validation and formatting utilities.
 * Items 535, 536 from the booking flow enhancements.
 */

const US_PHONE_REGEX = /^(?:\+?1[-.\s]?)?\(?([2-9]\d{2})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;

export function isValidUSPhone(phone: string): boolean {
  return US_PHONE_REGEX.test(phone.replace(/\s+/g, ""));
}

export function formatUSPhone(phone: string): string {
  const match = phone.replace(/\s+/g, "").match(US_PHONE_REGEX);
  if (!match) return phone;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

export function getPhoneError(phone: string): string | null {
  if (!phone) return null;
  if (!isValidUSPhone(phone)) return "Please enter a valid US phone number (e.g., (614) 555-1234).";
  return null;
}
