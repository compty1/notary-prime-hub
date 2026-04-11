import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Interactive canvas-based 3D-style floating animation for the hero section.
 * Responds to mouse/touch movement for parallax effect.
 * GAP-0001: Now renders on all screen sizes with simplified mobile version.
 * GAP-perf: Uses IntersectionObserver to pause when off-screen.
 */
export default function Hero3DAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const isVisibleRef = useRef(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    // GAP-perf: Pause animation when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || 500;
      height = rect?.height || 400;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        mouseRef.current = {
          x: (touch.clientX - rect.left) / rect.width,
          y: (touch.clientY - rect.top) / rect.height,
        };
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Brand colors
    const gold = "#F5C518";
    const goldLight = "#FDE68A";
    const dark = "#1a1a1a";
    const white = "#FFFFFF";
    const blue = "#3B82F6";
    const blueLight = "#60A5FA";

    interface FloatingObj {
      x: number; y: number; size: number; rotation: number;
      rotSpeed: number; floatOffset: number; floatSpeed: number;
      floatAmp: number; type: "doc" | "seal" | "shield" | "badge" | "pen" | "stamp";
      opacity: number; parallaxFactor: number;
    }

    const scaleFactor = isMobile ? 0.65 : 1;

    const objects: FloatingObj[] = [
      { x: 0.2, y: 0.25, size: 130 * scaleFactor, rotation: -0.1, rotSpeed: 0.002, floatOffset: 0, floatSpeed: 0.6, floatAmp: 16 * scaleFactor, type: "doc", opacity: 1, parallaxFactor: 0.025 },
      { x: 0.72, y: 0.15, size: 105 * scaleFactor, rotation: 0.08, rotSpeed: -0.003, floatOffset: 2, floatSpeed: 0.5, floatAmp: 18 * scaleFactor, type: "doc", opacity: 0.95, parallaxFactor: 0.04 },
      { x: 0.5, y: 0.48, size: 85 * scaleFactor, rotation: 0, rotSpeed: 0.006, floatOffset: 1, floatSpeed: 0.8, floatAmp: 10 * scaleFactor, type: "seal", opacity: 1, parallaxFactor: 0.015 },
      { x: 0.82, y: 0.55, size: 60 * scaleFactor, rotation: 0.06, rotSpeed: -0.004, floatOffset: 3, floatSpeed: 0.55, floatAmp: 13 * scaleFactor, type: "shield", opacity: 0.9, parallaxFactor: 0.05 },
      { x: 0.35, y: 0.72, size: 48 * scaleFactor, rotation: 0, rotSpeed: 0, floatOffset: 1.5, floatSpeed: 0.75, floatAmp: 8 * scaleFactor, type: "badge", opacity: 0.92, parallaxFactor: 0.035 },
      { x: 0.65, y: 0.78, size: 55 * scaleFactor, rotation: -0.35, rotSpeed: 0.002, floatOffset: 2.5, floatSpeed: 0.5, floatAmp: 11 * scaleFactor, type: "pen", opacity: 0.88, parallaxFactor: 0.06 },
      { x: 0.55, y: 0.12, size: 42 * scaleFactor, rotation: 0.15, rotSpeed: 0.003, floatOffset: 0.8, floatSpeed: 0.7, floatAmp: 9 * scaleFactor, type: "stamp", opacity: 0.85, parallaxFactor: 0.045 },
    ];

    interface Particle { x: number; y: number; size: number; speed: number; opacity: number; offset: number; color: string }

    const particleCount = isMobile ? 18 : 40;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random(), y: Math.random(),
      size: 1.5 + Math.random() * (isMobile ? 3 : 5),
      speed: 0.12 + Math.random() * 0.4,
      opacity: 0.08 + Math.random() * 0.25,
      offset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.55 ? blue : gold,
    }));

    function rrect(x: number, y: number, w: number, h: number, r: number | number[]) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    }

    function drawDocument(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      const w = size * 0.65, h = size, r = 10;

      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;

      ctx.fillStyle = white;
      rrect(-w / 2, -h / 2, w, h, r);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = blue;
      rrect(-w / 2, -h / 2, w, 20, [r, r, 0, 0]);
      ctx.fill();

      ctx.fillStyle = white;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-w / 2 + 14 + i * 10, -h / 2 + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#e2e8f0";
      const lineY = -h / 2 + 34;
      for (let i = 0; i < 6; i++) {
        const lw = w * (0.35 + Math.random() * 0.45);
        ctx.fillRect(-w / 2 + 12, lineY + i * 14, lw, 5);
      }

      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(w / 2 - 18, h / 2 - 18, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#D4A80A";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = dark;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 23, h / 2 - 18);
      ctx.lineTo(w / 2 - 19, h / 2 - 14);
      ctx.lineTo(w / 2 - 13, h / 2 - 22);
      ctx.stroke();

      ctx.restore();
    }

    function drawSeal(cx: number, cy: number, size: number, rotation: number, t: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 0.8);
      glow.addColorStop(0, "rgba(245, 197, 24, 0.35)");
      glow.addColorStop(1, "rgba(245, 197, 24, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fill();

      const points = 20;
      const outerR = size * 0.52, innerR = size * 0.4;
      ctx.fillStyle = gold;
      ctx.shadowColor = "rgba(245, 197, 24, 0.3)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = Math.cos(angle) * r, py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = goldLight;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = gold;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-8, 0); ctx.lineTo(-3, 7); ctx.lineTo(9, -6);
      ctx.stroke();

      for (let r = 0; r < 2; r++) {
        const pulseR = size * (0.55 + r * 0.12) + Math.sin(t * 1.8 + r) * 5;
        ctx.strokeStyle = `rgba(245, 197, 24, ${(0.2 - r * 0.08) + Math.sin(t * 1.8 + r) * 0.1})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawShield(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.shadowColor = "rgba(59, 130, 246, 0.25)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;

      const s = size * 0.5;
      const grad = ctx.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, blueLight);
      grad.addColorStop(1, blue);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.85, -s * 0.7, s, -s * 0.2, s, s * 0.1);
      ctx.bezierCurveTo(s, s * 0.6, s * 0.3, s * 0.9, 0, s * 1.1);
      ctx.bezierCurveTo(-s * 0.3, s * 0.9, -s, s * 0.6, -s, s * 0.1);
      ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.85, -s * 0.7, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, -s * 0.3, s * 0.3, s * 0.4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = white;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-8, 2); ctx.lineTo(-3, 9); ctx.lineTo(9, -5);
      ctx.stroke();

      ctx.restore();
    }

    function drawBadge(cx: number, cy: number, size: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 16;

      const grad = ctx.createRadialGradient(0, -size * 0.1, 0, 0, 0, size * 0.5);
      grad.addColorStop(0, blueLight);
      grad.addColorStop(1, blue);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.strokeStyle = white;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-7, 1); ctx.lineTo(-2, 7); ctx.lineTo(8, -5);
      ctx.stroke();

      ctx.restore();
    }

    function drawPen(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.shadowColor = "rgba(0,0,0,0.12)";
      ctx.shadowBlur = 14;

      const h = size, w = size * 0.2;
      ctx.fillStyle = dark;
      rrect(-w / 2, -h / 2, w, h * 0.72, 5);
      ctx.fill();

      ctx.fillStyle = gold;
      ctx.fillRect(-w / 2, -h / 2 + h * 0.72 - 4, w, 8);

      ctx.fillStyle = gold;
      ctx.fillRect(-w / 2 - 3, -h / 2 + 6, 3, h * 0.28);

      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + h * 0.72 + 4);
      ctx.lineTo(w / 2, -h / 2 + h * 0.72 + 4);
      ctx.lineTo(0, h / 2);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.restore();
    }

    function drawStamp(cx: number, cy: number, size: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 12;

      ctx.fillStyle = dark;
      rrect(-size * 0.12, -size * 0.4, size * 0.24, size * 0.35, 4);
      ctx.fill();

      ctx.fillStyle = gold;
      rrect(-size * 0.3, -size * 0.08, size * 0.6, size * 0.18, 3);
      ctx.fill();

      ctx.fillStyle = blue;
      rrect(-size * 0.35, size * 0.12, size * 0.7, size * 0.1, 3);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.restore();
    }

    function drawConnections(t: number) {
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const positions = objects.map((o) => ({
        x: o.x * width + (mx - 0.5) * width * o.parallaxFactor,
        y: o.y * height + Math.sin(t * o.floatSpeed + o.floatOffset) * o.floatAmp + (my - 0.5) * height * o.parallaxFactor,
      }));

      ctx.setLineDash([5, 10]);
      ctx.lineWidth = 1;
      const maxDist = isMobile ? 200 : 350;
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = 0.06 * (1 - dist / maxDist);
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
      animationId = requestAnimationFrame(render);

      // GAP-perf: Skip rendering when off-screen
      if (!isVisibleRef.current) return;

      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x, my = mouseRef.current.y;

      const bgGlow = ctx.createRadialGradient(
        width * (0.35 + mx * 0.25), height * (0.25 + my * 0.2), 0,
        width * 0.5, height * 0.4, width * 0.7
      );
      bgGlow.addColorStop(0, "rgba(59, 130, 246, 0.06)");
      bgGlow.addColorStop(0.4, "rgba(245, 197, 24, 0.04)");
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        const px = p.x * width + (mx - 0.5) * 10;
        const py = p.y * height + Math.sin(t * p.speed + p.offset) * 14 + (my - 0.5) * 10;
        ctx.fillStyle = p.color === blue
          ? `rgba(59, 130, 246, ${p.opacity})`
          : `rgba(245, 197, 24, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      drawConnections(t);

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
          case "badge": drawBadge(ox, oy, o.size); break;
          case "pen": drawPen(ox, oy, o.size, rot); break;
          case "stamp": drawStamp(ox, oy, o.size, rot); break;
        }
        ctx.globalAlpha = 1;
      });
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isMobile]);

  return (
    <div className="relative w-full h-full min-h-[320px] md:min-h-[400px] lg:min-h-[480px]" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ display: "block" }}
      />
    </div>
  );
}
