/**
 * CSRF protection utilities (Cross-Flow audit ID 230)
 * Generates and validates CSRF tokens for form submissions.
 */

const CSRF_KEY = "csrf_token";

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(CSRF_KEY, token);
  return token;
}

export function getCSRFToken(): string {
  let token = sessionStorage.getItem(CSRF_KEY);
  if (!token) {
    token = generateCSRFToken();
  }
  return token;
}

export function validateCSRFToken(token: string): boolean {
  const stored = sessionStorage.getItem(CSRF_KEY);
  if (!stored || !token) return false;
  // Constant-time comparison
  if (stored.length !== token.length) return false;
  let result = 0;
  for (let i = 0; i < stored.length; i++) {
    result |= stored.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return result === 0;
}

export function rotateCSRFToken(): string {
  sessionStorage.removeItem(CSRF_KEY);
  return generateCSRFToken();
}
