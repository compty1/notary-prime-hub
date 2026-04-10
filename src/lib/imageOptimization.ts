/**
 * Image optimization utilities (Items 460-475)
 * Lazy loading, responsive images, and placeholder generation.
 */

/** Generate a low-quality image placeholder (LQIP) as a data URL */
export function generatePlaceholder(width = 10, height = 10, color = "#f0f0f0"): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='100%25' height='100%25' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;
}

/** Get optimized image srcSet for responsive loading */
export function getResponsiveSrcSet(basePath: string, widths: number[] = [320, 640, 1024, 1440]): string {
  return widths
    .map(w => `${basePath}?w=${w} ${w}w`)
    .join(", ");
}

/** Preload critical images */
export function preloadImage(src: string, as: "image" = "image"): void {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = src;
  document.head.appendChild(link);
}

/** Check if an element is in viewport (for lazy loading) */
export function isInViewport(element: Element, rootMargin = "200px"): Promise<boolean> {
  return new Promise(resolve => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        observer.disconnect();
        resolve(entry.isIntersecting);
      },
      { rootMargin }
    );
    observer.observe(element);
  });
}

/** Decode base64 to blob URL (for signature previews) */
export function base64ToBlob(base64: string, mimeType = "image/png"): string {
  try {
    const byteString = atob(base64.split(",")[1] || base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([ab], { type: mimeType }));
  } catch {
    return "";
  }
}
