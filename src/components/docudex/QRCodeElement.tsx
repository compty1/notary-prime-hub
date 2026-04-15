/**
 * P2-007: QR code element for canvas (local generation, custom colors, center logo)
 */
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface QRCodeElementProps {
  data: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  logoSrc?: string;
  className?: string;
}

export function QRCodeElement({
  data,
  size = 128,
  fgColor = "#000000",
  bgColor = "#ffffff",
  logoSrc,
  className,
}: QRCodeElementProps) {
  return (
    <div className={cn("inline-flex", className)}>
      <QRCodeSVG
        value={data || "https://notar.com"}
        size={size}
        fgColor={fgColor}
        bgColor={bgColor}
        level="M"
        includeMargin={false}
        imageSettings={logoSrc ? {
          src: logoSrc,
          x: undefined,
          y: undefined,
          height: size * 0.2,
          width: size * 0.2,
          excavate: true,
        } : undefined}
      />
    </div>
  );
}

/**
 * Render QR code to canvas context for the visual editor
 */
export function renderQRToCanvas(
  ctx: CanvasRenderingContext2D,
  data: string,
  x: number,
  y: number,
  size: number,
  fgColor = "#000000",
  bgColor = "#ffffff"
) {
  // Simple QR rendering via a temporary SVG approach
  const svg = document.createElement("div");
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = size;
  tempCanvas.height = size;

  // Draw placeholder QR pattern
  const tctx = tempCanvas.getContext("2d");
  if (!tctx) return;

  tctx.fillStyle = bgColor;
  tctx.fillRect(0, 0, size, size);

  // Generate simple QR-like pattern from data hash
  const cellSize = Math.floor(size / 25);
  tctx.fillStyle = fgColor;

  // Finder patterns (corners)
  const drawFinder = (fx: number, fy: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          tctx.fillRect(fx + i * cellSize, fy + j * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7 * cellSize, 0);
  drawFinder(0, size - 7 * cellSize);

  // Data cells (deterministic from data string)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 8; i < 17; i++) {
    for (let j = 8; j < 17; j++) {
      if ((hash + i * 31 + j * 17) % 3 !== 0) {
        tctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.drawImage(tempCanvas, x, y, size, size);
}
