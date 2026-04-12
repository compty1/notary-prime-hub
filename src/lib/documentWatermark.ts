/**
 * Document watermarking utilities.
 * Enhancement #51 (Document watermarking for previews)
 */

/** Apply a text watermark to a canvas */
export function applyWatermark(
  canvas: HTMLCanvasElement,
  text: string,
  options?: { color?: string; fontSize?: number; opacity?: number; angle?: number }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { color = "rgba(0,0,0,0.08)", fontSize = 48, opacity = 0.15, angle = -30 } = options || {};

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = color;

  const radians = (angle * Math.PI) / 180;
  const stepX = fontSize * 6;
  const stepY = fontSize * 4;

  for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
    for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(radians);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Create a watermarked overlay div (CSS-based, no canvas needed) */
export function watermarkStyles(text: string): React.CSSProperties {
  return {
    position: "relative" as const,
    overflow: "hidden",
  };
}

/** Generate SVG watermark data URL */
export function watermarkSVG(text: string, opacity = 0.06): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
    <text x="50%" y="50%" font-size="24" fill="rgba(0,0,0,${opacity})" 
          text-anchor="middle" dominant-baseline="middle" 
          transform="rotate(-30, 150, 100)" font-weight="bold">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
