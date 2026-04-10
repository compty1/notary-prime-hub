/**
 * Session security utilities (Items 485-495, 1900-1910)
 * Session fingerprinting, idle timeout, and anti-replay measures.
 */

/** Generate a browser fingerprint for session binding */
export function generateSessionFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || "unknown",
  ];
  
  // Simple hash for fingerprint
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/** Idle timeout manager */
export class IdleTimeoutManager {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private warningId: ReturnType<typeof setTimeout> | null = null;
  private lastActivity = Date.now();
  private readonly events = ["mousedown", "keydown", "scroll", "touchstart"];

  constructor(
    private readonly timeoutMs: number,
    private readonly warningMs: number,
    private readonly onWarning: () => void,
    private readonly onTimeout: () => void
  ) {}

  start() {
    this.lastActivity = Date.now();
    this.events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
    this.resetTimers();
  }

  stop() {
    this.events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
    this.clearTimers();
  }

  extend() {
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  private handleActivity = () => {
    this.lastActivity = Date.now();
    this.resetTimers();
  };

  private resetTimers() {
    this.clearTimers();
    this.warningId = setTimeout(this.onWarning, this.timeoutMs - this.warningMs);
    this.timeoutId = setTimeout(this.onTimeout, this.timeoutMs);
  }

  private clearTimers() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
  }
}

/** Token expiry checker */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt * 1000;
}

/** Token near-expiry check (within buffer) */
export function isTokenNearExpiry(expiresAt: number, bufferMs = 60000): boolean {
  return (expiresAt * 1000 - Date.now()) < bufferMs;
}

/** Generate a nonce for anti-replay protection */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}
