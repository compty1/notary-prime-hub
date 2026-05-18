import * as React from "react";
import { cn } from "@/lib/utils";

export interface PictureSources {
  /** Desktop AVIF source */
  avif?: string;
  /** Desktop WebP source */
  webp?: string;
  /** Mobile (≤640px) AVIF source */
  mobileAvif?: string;
  /** Mobile (≤640px) WebP source */
  mobileWebp?: string;
  /** Mobile (≤640px) raster fallback (PNG/JPG) */
  mobileSrc?: string;
}

export interface PictureProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "loading" | "srcSet"> {
  /** Raster fallback (PNG/JPG) — required */
  src: string;
  /** Alt text — required for a11y */
  alt: string;
  /** Intrinsic width (prevents CLS) */
  width: number;
  /** Intrinsic height (prevents CLS) */
  height: number;
  /** Optional next-gen + responsive sources */
  sources?: PictureSources;
  /** sizes attribute (e.g. "(max-width: 640px) 90vw, 480px") */
  sizes?: string;
  /** Loading strategy — defaults to "lazy"; pass "eager" for above-the-fold */
  loading?: "lazy" | "eager";
  /** Fetch priority hint — defaults to "auto"; pass "high" for the LCP image */
  fetchPriority?: "auto" | "high" | "low";
  /** Class applied to the inner <img> */
  className?: string;
  /** Optional wrapper class for the <picture> element */
  pictureClassName?: string;
}

/**
 * Shared responsive <picture> wrapper.
 * Emits mobile-gated AVIF/WebP + desktop AVIF/WebP + raster fallback in the
 * correct order so browsers pick the smallest format they support.
 * Always renders explicit width/height to prevent CLS.
 */
export const Picture = React.forwardRef<HTMLImageElement, PictureProps>(function Picture(
  {
    src,
    alt,
    width,
    height,
    sources,
    sizes,
    loading = "lazy",
    fetchPriority = "auto",
    className,
    pictureClassName,
    decoding = "async",
    ...imgProps
  },
  ref,
) {
  const s = sources ?? {};
  return (
    <picture className={pictureClassName}>
      {/* Mobile sources (≤640px) — most-specific first */}
      {s.mobileAvif && <source media="(max-width: 640px)" type="image/avif" srcSet={s.mobileAvif} sizes={sizes} />}
      {s.mobileWebp && <source media="(max-width: 640px)" type="image/webp" srcSet={s.mobileWebp} sizes={sizes} />}
      {s.mobileSrc && <source media="(max-width: 640px)" srcSet={s.mobileSrc} sizes={sizes} />}
      {/* Desktop sources */}
      {s.avif && <source type="image/avif" srcSet={s.avif} sizes={sizes} />}
      {s.webp && <source type="image/webp" srcSet={s.webp} sizes={sizes} />}
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        // @ts-expect-error - fetchpriority is a valid HTML attribute, React types lag
        fetchpriority={fetchPriority}
        className={cn(className)}
        {...imgProps}
      />
    </picture>
  );
});
