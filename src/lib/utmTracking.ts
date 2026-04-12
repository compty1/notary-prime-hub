/**
 * UTM tracking and attribution across marketing touchpoints.
 * Enhancement #66 (UTM tracking), partially done — completing
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_page?: string;
}

/** Capture UTM params from current URL */
export function captureUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};

  const keys: (keyof UTMParams)[] = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  keys.forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });

  utm.referrer = document.referrer || undefined;
  utm.landing_page = window.location.pathname;

  return utm;
}

/** Store UTM params in sessionStorage (first-touch attribution) */
export function persistUTMParams() {
  const existing = sessionStorage.getItem("utm_params");
  if (existing) return; // First-touch: don't overwrite

  const utm = captureUTMParams();
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem("utm_params", JSON.stringify(utm));
  }
}

/** Retrieve stored UTM params */
export function getStoredUTMParams(): UTMParams {
  try {
    return JSON.parse(sessionStorage.getItem("utm_params") || "{}");
  } catch {
    return {};
  }
}

/** Get attribution source as a simple string */
export function getAttributionSource(): string {
  const utm = getStoredUTMParams();
  if (utm.utm_source) return utm.utm_source;
  if (utm.referrer) {
    try {
      return new URL(utm.referrer).hostname;
    } catch {
      return "referral";
    }
  }
  return "direct";
}
