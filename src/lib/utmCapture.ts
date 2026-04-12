/**
 * SVC-404: UTM & referral parameter capture
 * Captures UTM params on page load, stores in sessionStorage for booking attribution
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referral_code?: string;
}

const UTM_STORAGE_KEY = "ntrdx_utm";

export function captureUTMParams(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  let hasAny = false;

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referral_code"] as const) {
    const val = params.get(key);
    if (val) { utm[key] = val; hasAny = true; }
  }

  if (hasAny) {
    try { sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm)); } catch {}
  }
}

export function getStoredUTM(): UTMParams {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function clearUTM(): void {
  try { sessionStorage.removeItem(UTM_STORAGE_KEY); } catch {}
}

// Auto-capture on import
if (typeof window !== "undefined") {
  captureUTMParams();
}
