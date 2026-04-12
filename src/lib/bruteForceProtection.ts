/**
 * SVC-285: Brute force protection
 * Client-side progressive lockout after failed login attempts.
 */

const LOCKOUT_KEY = "notar_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATIONS = [30, 60, 120, 300, 600]; // seconds, progressive

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

function getState(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null, lastAttempt: 0 };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null, lastAttempt: 0 };
  }
}

function setState(state: LockoutState) {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {}
}

/** Check if login is currently locked out */
export function isLoginLocked(): { locked: boolean; remainingSeconds: number } {
  const state = getState();
  if (!state.lockedUntil) return { locked: false, remainingSeconds: 0 };
  const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    return { locked: false, remainingSeconds: 0 };
  }
  return { locked: true, remainingSeconds: remaining };
}

/** Record a failed login attempt */
export function recordFailedAttempt() {
  const state = getState();
  state.attempts += 1;
  state.lastAttempt = Date.now();

  if (state.attempts >= MAX_ATTEMPTS) {
    const lockoutIndex = Math.min(state.attempts - MAX_ATTEMPTS, LOCKOUT_DURATIONS.length - 1);
    const lockoutDuration = LOCKOUT_DURATIONS[lockoutIndex] * 1000;
    state.lockedUntil = Date.now() + lockoutDuration;
  }

  setState(state);
  return state;
}

/** Clear lockout state on successful login */
export function clearLockout() {
  try {
    localStorage.removeItem(LOCKOUT_KEY);
  } catch {}
}

/** Get remaining attempts before lockout */
export function getRemainingAttempts(): number {
  const state = getState();
  return Math.max(0, MAX_ATTEMPTS - state.attempts);
}
