import { useEffect, useRef } from "react";

/**
 * Interactive canvas-based 3D-style floating animation for the hero section.
 * Responds to mouse movement for parallax effect.
 * Uses Notar brand colors: gold primary + vibrant blue accent.
 */
export default function Hero3DAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

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

    // Mouse tracking for parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    // Brand colors
    const brandGold = "#F5C518";
    const brandGoldLight = "#FDE68A";
    const brandDark = "#1a1a1a";
    const brandWhite = "#FFFFFF";
    const brandBlue = "#3B82F6"; // vibrant blue accent

    interface FloatingObj {
      x: number; y: number; size: number; rotation: number;
      rotSpeed: number; floatOffset: number; floatSpeed: number;
      floatAmp: number; type: "doc" | "seal" | "shield" | "checkmark" | "pen";
      opacity: number; parallaxFactor: number;
    }

    const objects: FloatingObj[] = [
      { x: 0.22, y: 0.28, size: 95, rotation: -0.12, rotSpeed: 0.003, floatOffset: 0, floatSpeed: 0.7, floatAmp: 14, type: "doc", opacity: 1, parallaxFactor: 0.03 },
      { x: 0.7, y: 0.2, size: 78, rotation: 0.1, rotSpeed: -0.004, floatOffset: 2, floatSpeed: 0.55, floatAmp: 16, type: "doc", opacity: 0.92, parallaxFactor: 0.05 },
      { x: 0.48, y: 0.52, size: 65, rotation: 0, rotSpeed: 0.008, floatOffset: 1, floatSpeed: 0.9, floatAmp: 9, type: "seal", opacity: 1, parallaxFactor: 0.02 },
      { x: 0.78, y: 0.58, size: 48, rotation: 0.08, rotSpeed: -0.005, floatOffset: 3, floatSpeed: 0.65, floatAmp: 11, type: "shield", opacity: 0.88, parallaxFactor: 0.06 },
      { x: 0.28, y: 0.72, size: 38, rotation: 0, rotSpeed: 0, floatOffset: 1.5, floatSpeed: 0.85, floatAmp: 7, type: "checkmark", opacity: 0.9, parallaxFactor: 0.04 },
      { x: 0.6, y: 0.75, size: 42, rotation: -0.3, rotSpeed: 0.002, floatOffset: 2.5, floatSpeed: 0.6, floatAmp: 10, type: "pen", opacity: 0.85, parallaxFactor: 0.07 },
    ];

    interface Particle { x: number; y: number; size: number; speed: number; opacity: number; offset: number; color: string }

    const particles: Particle[] = Array.from({ length: 35 }, () => ({
      x: Math.random(), y: Math.random(),
      size: 1.5 + Math.random() * 4,
      speed: 0.15 + Math.random() * 0.45,
      opacity: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.6 ? brandBlue : brandGold,
    }));

    function drawDocument(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      const w = size * 0.7, h = size, r = 8;

      ctx.shadowColor = "rgba(0,0,0,0.12)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;

      ctx.fillStyle = brandWhite;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Blue header bar
      ctx.fillStyle = brandBlue;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, 16, [r, r, 0, 0]);
      ctx.fill();

      // Text lines
      ctx.fillStyle = "#e2e8f0";
      const lineY = -h / 2 + 30;
      for (let i = 0; i < 5; i++) {
        const lw = w * (0.4 + Math.random() * 0.4);
        ctx.fillRect(-w / 2 + 10, lineY + i * 13, lw, 4);
      }

      // Gold seal stamp
      ctx.fillStyle = brandGold;
      ctx.beginPath();
      ctx.arc(w / 2 - 16, h / 2 - 16, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawSeal(cx: number, cy: number, size: number, rotation: number, t: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      const glow = ctx.createRadialGradient(0, 0, size * 0.25, 0, 0, size * 0.75);
      glow.addColorStop(0, "rgba(245, 197, 24, 0.3)");
      glow.addColorStop(1, "rgba(245, 197, 24, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
      ctx.fill();

      const points = 18;
      const outerR = size * 0.5, innerR = size * 0.38;
      ctx.fillStyle = brandGold;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r2 = i % 2 === 0 ? outerR : innerR;
        const px = Math.cos(angle) * r2, py = Math.sin(angle) * r2;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = brandDark;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = brandGold;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-7, 0); ctx.lineTo(-2, 6); ctx.lineTo(8, -5);
      ctx.stroke();

      // Pulse
      const pulseR = size * 0.52 + Math.sin(t * 2) * 5;
      ctx.strokeStyle = `rgba(245, 197, 24, ${0.25 + Math.sin(t * 2) * 0.15})`;
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
      ctx.shadowColor = "rgba(59, 130, 246, 0.2)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;

      const s = size * 0.5;
      ctx.fillStyle = brandBlue;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.8, -s * 0.7, s, -s * 0.2, s, s * 0.1);
      ctx.bezierCurveTo(s, s * 0.6, s * 0.3, s * 0.9, 0, s * 1.1);
      ctx.bezierCurveTo(-s * 0.3, s * 0.9, -s, s * 0.6, -s, s * 0.1);
      ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.8, -s * 0.7, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.strokeStyle = brandWhite;
      ctx.lineWidth = 3;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-7, 2); ctx.lineTo(-2, 8); ctx.lineTo(8, -4);
      ctx.stroke();

      ctx.restore();
    }

    function drawCheckmark(cx: number, cy: number, size: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = "rgba(59, 130, 246, 0.25)";
      ctx.shadowBlur = 14;

      ctx.fillStyle = brandBlue;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.strokeStyle = brandWhite;
      ctx.lineWidth = 3;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-6, 1); ctx.lineTo(-2, 6); ctx.lineTo(7, -4);
      ctx.stroke();

      ctx.restore();
    }

    function drawPen(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 10;

      const h = size, w = size * 0.18;
      // Pen body
      ctx.fillStyle = brandDark;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h * 0.75, 4);
      ctx.fill();

      // Gold clip
      ctx.fillStyle = brandGold;
      ctx.fillRect(-w / 2 - 2, -h / 2 + 4, 3, h * 0.3);

      // Pen tip
      ctx.fillStyle = brandGold;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + h * 0.75);
      ctx.lineTo(w / 2, -h / 2 + h * 0.75);
      ctx.lineTo(0, h / 2);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.restore();
    }

    function drawConnections(t: number) {
      const positions = objects.map((o) => {
        const mx = mouseRef.current.x, my = mouseRef.current.y;
        return {
          x: o.x * width + (mx - 0.5) * width * o.parallaxFactor,
          y: o.y * height + Math.sin(t * o.floatSpeed + o.floatOffset) * o.floatAmp + (my - 0.5) * height * o.parallaxFactor,
        };
      });

      ctx.setLineDash([4, 8]);
      ctx.lineWidth = 1;
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 320) {
            const alpha = 0.08 * (1 - dist / 320);
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);
    }

    let t = 0;
    function render() {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x, my = mouseRef.current.y;

      // Background radial glow
      const bgGlow = ctx.createRadialGradient(
        width * (0.4 + mx * 0.2), height * (0.3 + my * 0.2), 0,
        width * 0.5, height * 0.4, width * 0.65
      );
      bgGlow.addColorStop(0, "rgba(59, 130, 246, 0.05)");
      bgGlow.addColorStop(0.5, "rgba(245, 197, 24, 0.04)");
      bgGlow.addColorStop(1, "rgba(245, 197, 24, 0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Particles
      particles.forEach((p) => {
        const px = p.x * width + (mx - 0.5) * 8;
        const py = p.y * height + Math.sin(t * p.speed + p.offset) * 12 + (my - 0.5) * 8;
        ctx.fillStyle = p.color === brandBlue
          ? `rgba(59, 130, 246, ${p.opacity})`
          : `rgba(245, 197, 24, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      drawConnections(t);

      // Objects with parallax
      objects.forEach((o) => {
        const px = (mx - 0.5) * width * o.parallaxFactor;
        const py = (my - 0.5) * height * o.parallaxFactor;
        const ox = o.x * width + px;
        const oy = o.y * height + Math.sin(t * o.floatSpeed + o.floatOffset) * o.floatAmp + py;
        const rot = o.rotation + t * o.rotSpeed;

        ctx.globalAlpha = o.opacity;
        switch (o.type) {
          case "doc": drawDocument(ox, oy, o.size, rot); break;
          case "seal": drawSeal(ox, oy, o.size, rot, t); break;
          case "shield": drawShield(ox, oy, o.size, rot); break;
          case "checkmark": drawCheckmark(ox, oy, o.size); break;
          case "pen": drawPen(ox, oy, o.size, rot); break;
        }
        ctx.globalAlpha = 1;
      });

      animationId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[420px]" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ display: "block" }}
      />
    </div>
  );
}
