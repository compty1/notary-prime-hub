/**
 * Performance monitoring utilities (Items 580-590, 3700-3720)
 * Web Vitals tracking, long task detection, and resource timing.
 */

/** Track Core Web Vitals using PerformanceObserver */
export function initWebVitals(onMetric?: (name: string, value: number) => void) {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  const report = (name: string, value: number) => {
    if (import.meta.env.DEV) {
      console.debug(`[WebVital] ${name}: ${Math.round(value)}ms`);
    }
    onMetric?.(name, value);
  };

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry;
      if (last) report("LCP", last.startTime);
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* unsupported */ }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEventTiming;
        report("FID", e.processingStart - e.startTime);
      }
    });
    fidObserver.observe({ type: "first-input", buffered: true });
  } catch { /* unsupported */ }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      report("CLS", clsValue * 1000); // multiply for readability
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  } catch { /* unsupported */ }

  // Long Tasks (>50ms) — only log in dev to avoid console noise in production
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          if (import.meta.env.DEV) {
            console.warn(`[LongTask] ${Math.round(entry.duration)}ms at ${Math.round(entry.startTime)}ms`);
          }
          onMetric?.("LongTask", entry.duration);
        }
      }
    });
    longTaskObserver.observe({ type: "longtask", buffered: true });
  } catch { /* unsupported */ }
}

/** Get navigation timing metrics */
export function getNavigationTiming(): Record<string, number> | null {
  if (typeof window === "undefined") return null;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return null;
  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domParsing: nav.domInteractive - nav.responseEnd,
    domComplete: nav.domComplete - nav.domInteractive,
    total: nav.loadEventEnd - nav.startTime,
  };
}
