/**
 * Sprint B (B-46): HIBP Pwned Passwords k-anonymity check.
 * Hashes the password client-side with SHA-1, sends only the first 5 chars
 * of the hash to api.pwnedpasswords.com, and checks if the rest matches a known breach.
 * No password ever leaves the device.
 */

async function sha1Hex(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export interface HibpResult {
  breached: boolean;
  count: number;
  /** True if the API call failed — caller should not block signup on network errors. */
  unknown?: boolean;
}

export async function checkPasswordBreach(password: string): Promise<HibpResult> {
  if (!password || password.length < 4) return { breached: false, count: 0 };
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return { breached: false, count: 0, unknown: true };
    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix === suffix) {
        return { breached: true, count: parseInt(countStr, 10) || 1 };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0, unknown: true };
  }
}
