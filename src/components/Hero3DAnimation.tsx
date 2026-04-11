import { useEffect, useRef } from "react";

/**
 * A performant canvas-based 3D-style floating animation for the hero section.
 * Renders floating documents, seals, shields, and particles in Notar brand colors.
 */
export default function Hero3DAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || 500;
      height = rect?.height || 500;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Brand colors
    const brandGold = "#F5C518";
    const brandGoldLight = "#FDE68A";
    const brandGoldFaint = "rgba(245, 197, 24, 0.12)";
    const brandDark = "#1a1a1a";
    const brandWhite = "#FFFFFF";
    const brandEmerald = "#10B981";

    // --- Floating Objects ---
    interface FloatingObj {
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotSpeed: number;
      floatOffset: number;
      floatSpeed: number;
      floatAmp: number;
      type: "doc" | "seal" | "shield" | "checkmark";
      opacity: number;
    }

    const objects: FloatingObj[] = [
      // Main document - center-left
      { x: 0.25, y: 0.3, size: 90, rotation: -0.15, rotSpeed: 0.003, floatOffset: 0, floatSpeed: 0.8, floatAmp: 12, type: "doc", opacity: 1 },
      // Second document - right
      { x: 0.72, y: 0.22, size: 75, rotation: 0.12, rotSpeed: -0.004, floatOffset: 2, floatSpeed: 0.6, floatAmp: 15, type: "doc", opacity: 0.9 },
      // Gold seal - center
      { x: 0.5, y: 0.55, size: 60, rotation: 0, rotSpeed: 0.01, floatOffset: 1, floatSpeed: 1.0, floatAmp: 8, type: "seal", opacity: 1 },
      // Shield - top right
      { x: 0.75, y: 0.6, size: 45, rotation: 0.1, rotSpeed: -0.005, floatOffset: 3, floatSpeed: 0.7, floatAmp: 10, type: "shield", opacity: 0.85 },
      // Checkmark - bottom left
      { x: 0.3, y: 0.7, size: 35, rotation: 0, rotSpeed: 0, floatOffset: 1.5, floatSpeed: 0.9, floatAmp: 6, type: "checkmark", opacity: 0.9 },
    ];

    // --- Particles ---
    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      offset: number;
    }

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 2 + Math.random() * 4,
      speed: 0.2 + Math.random() * 0.5,
      opacity: 0.15 + Math.random() * 0.35,
      offset: Math.random() * Math.PI * 2,
    }));

    // --- Draw Helpers ---
    function drawDocument(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      const w = size * 0.7;
      const h = size;
      const r = 8;

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.10)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;

      // Paper
      ctx.fillStyle = brandWhite;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Header bar
      ctx.fillStyle = brandGold;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, 14, [r, r, 0, 0]);
      ctx.fill();

      // Lines
      ctx.fillStyle = "#e5e5e5";
      const lineY = -h / 2 + 28;
      for (let i = 0; i < 5; i++) {
        const lw = w * (0.5 + Math.random() * 0.35);
        ctx.fillRect(-w / 2 + 10, lineY + i * 12, lw, 4);
      }

      // Seal stamp at bottom
      ctx.fillStyle = brandGold;
      ctx.beginPath();
      ctx.arc(w / 2 - 14, h / 2 - 14, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawSeal(cx: number, cy: number, size: number, rotation: number, t: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // Outer glow
      const glow = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 0.7);
      glow.addColorStop(0, "rgba(245, 197, 24, 0.25)");
      glow.addColorStop(1, "rgba(245, 197, 24, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Starburst
      const points = 16;
      const outerR = size * 0.5;
      const innerR = size * 0.38;
      ctx.fillStyle = brandGold;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Inner circle
      ctx.fillStyle = brandDark;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Checkmark inside
      ctx.strokeStyle = brandGold;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-2, 5);
      ctx.lineTo(7, -5);
      ctx.stroke();

      // Pulse ring
      const pulseR = size * 0.5 + Math.sin(t * 2) * 4;
      ctx.strokeStyle = `rgba(245, 197, 24, ${0.3 + Math.sin(t * 2) * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    function drawShield(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      const s = size * 0.5;
      ctx.fillStyle = brandEmerald;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.8, -s * 0.7, s, -s * 0.2, s, s * 0.1);
      ctx.bezierCurveTo(s, s * 0.6, s * 0.3, s * 0.9, 0, s * 1.1);
      ctx.bezierCurveTo(-s * 0.3, s * 0.9, -s, s * 0.6, -s, s * 0.1);
      ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.8, -s * 0.7, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Inner checkmark
      ctx.strokeStyle = brandWhite;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(-2, 8);
      ctx.lineTo(8, -4);
      ctx.stroke();

      ctx.restore();
    }

    function drawCheckmark(cx: number, cy: number, size: number) {
      ctx.save();
      ctx.translate(cx, cy);

      ctx.shadowColor = "rgba(16, 185, 129, 0.3)";
      ctx.shadowBlur = 12;

      ctx.fillStyle = brandEmerald;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.strokeStyle = brandWhite;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-6, 1);
      ctx.lineTo(-2, 6);
      ctx.lineTo(7, -4);
      ctx.stroke();

      ctx.restore();
    }

    // --- Connection lines ---
    function drawConnections(t: number) {
      const positions = objects.map((o) => ({
        x: o.x * width,
        y: o.y * height + Math.sin(t * o.floatSpeed + o.floatOffset) * o.floatAmp,
      }));

      // Draw subtle dashed lines between nearby objects
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = `rgba(245, 197, 24, 0.12)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);
    }

    // --- Main loop ---
    let t = 0;
    function render() {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Subtle background radial glow
      const bgGlow = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.4, width * 0.6);
      bgGlow.addColorStop(0, "rgba(245, 197, 24, 0.06)");
      bgGlow.addColorStop(1, "rgba(245, 197, 24, 0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Particles
      particles.forEach((p) => {
        const px = p.x * width;
        const py = p.y * height + Math.sin(t * p.speed + p.offset) * 15;
        ctx.fillStyle = `rgba(245, 197, 24, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connection lines
      drawConnections(t);

      // Objects
      objects.forEach((o) => {
        const ox = o.x * width;
        const oy = o.y * height + Math.sin(t * o.floatSpeed + o.floatOffset) * o.floatAmp;
        const rot = o.rotation + t * o.rotSpeed;

        ctx.globalAlpha = o.opacity;
        switch (o.type) {
          case "doc":
            drawDocument(ox, oy, o.size, rot);
            break;
          case "seal":
            drawSeal(ox, oy, o.size, rot, t);
            break;
          case "shield":
            drawShield(ox, oy, o.size, rot);
            break;
          case "checkmark":
            drawCheckmark(ox, oy, o.size);
            break;
        }
        ctx.globalAlpha = 1;
      });

      animationId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[420px]" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
