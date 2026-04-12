/**
 * A/B testing framework for landing pages.
 * Enhancement #65 (A/B testing framework)
 */

/** Variant assignment based on user ID or random */
export type Variant = "A" | "B";

/** Deterministically assign a variant based on a seed string */
export function assignVariant(seed: string): Variant {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "A" : "B";
}

/** Get or create a persistent variant for a test */
export function getVariant(testName: string): Variant {
  const key = `ab_test_${testName}`;
  const stored = localStorage.getItem(key);
  if (stored === "A" || stored === "B") return stored;

  const visitorId = localStorage.getItem("visitor_id") || crypto.randomUUID();
  localStorage.setItem("visitor_id", visitorId);

  const variant = assignVariant(`${testName}:${visitorId}`);
  localStorage.setItem(key, variant);
  return variant;
}

/** Track a conversion event for an A/B test */
export function trackConversion(testName: string, eventName: string) {
  const variant = getVariant(testName);
  // Store locally; batch upload via analytics
  const events = JSON.parse(localStorage.getItem("ab_events") || "[]");
  events.push({
    test: testName,
    variant,
    event: eventName,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 100 events
  if (events.length > 100) events.splice(0, events.length - 100);
  localStorage.setItem("ab_events", JSON.stringify(events));
}

/** React hook-compatible helper */
export function useABTest(testName: string): { variant: Variant; track: (event: string) => void } {
  const variant = getVariant(testName);
  return {
    variant,
    track: (event: string) => trackConversion(testName, event),
  };
}
