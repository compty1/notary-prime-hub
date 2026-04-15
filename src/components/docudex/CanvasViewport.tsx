/**
 * DocuDex Canvas Viewport — Fabric.js-backed visual canvas (P1-001)
 * Renders elements from the zustand store onto a canvas with zoom, pan, and selection
 */
import { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import type { ElementNode } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

interface CanvasViewportProps {
  className?: string;
}

export function CanvasViewport({ className }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    pages, activePageId, zoom, panX, panY, selectedElementIds,
    showGrid, gridSize, showAlignmentGuides,
    selectElement, clearSelection, updateElement, setZoom, setPan,
    setContextToolbar,
  } = useEditorStore();

  const activePage = pages.find(p => p.id === activePageId);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = activePage.width * dpr;
    canvas.height = activePage.height * dpr;
    canvas.style.width = `${activePage.width}px`;
    canvas.style.height = `${activePage.height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, activePage.width, activePage.height);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < activePage.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, activePage.height); ctx.stroke();
      }
      for (let y = 0; y < activePage.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(activePage.width, y); ctx.stroke();
      }
    }

    // Sort elements by layer and render
    const sorted = [...activePage.elements].sort((a, b) => a.layerIndex - b.layerIndex);
    sorted.forEach(el => {
      if (!el.visible) return;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);

      switch (el.type) {
        case "text": {
          const fontSize = (el.styles.fontSize as number) || 16;
          const fontFamily = (el.styles.fontFamily as string) || "Montserrat";
          const color = (el.styles.color as string) || "#000000";
          const fontWeight = (el.styles.fontWeight as string) || "400";
          ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = color;
          ctx.textBaseline = "top";
          const text = (el.content.text as string) || "";
          const lines = text.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, 0, i * fontSize * 1.4);
          });
          break;
        }
        case "shape": {
          const fill = (el.styles.fill as string) || "hsl(45 86% 48%)";
          const stroke = (el.styles.stroke as string) || "transparent";
          const strokeWidth = (el.styles.strokeWidth as number) || 0;
          const radius = (el.styles.borderRadius as number) || 0;
          ctx.fillStyle = fill;
          ctx.strokeStyle = stroke;
          ctx.lineWidth = strokeWidth;

          if (radius > 0) {
            ctx.beginPath();
            ctx.roundRect(0, 0, el.width, el.height, radius);
            ctx.fill();
            if (strokeWidth > 0) ctx.stroke();
          } else {
            ctx.fillRect(0, 0, el.width, el.height);
            if (strokeWidth > 0) ctx.strokeRect(0, 0, el.width, el.height);
          }
          break;
        }
        case "image": {
          const img = new Image();
          img.src = (el.content.src as string) || "";
          if (img.complete) {
            ctx.drawImage(img, 0, 0, el.width, el.height);
          }
          break;
        }
        default: {
          // Placeholder for other types
          ctx.fillStyle = "hsl(45 86% 48% / 0.1)";
          ctx.strokeStyle = "hsl(45 86% 48% / 0.3)";
          ctx.lineWidth = 1;
          ctx.fillRect(0, 0, el.width, el.height);
          ctx.strokeRect(0, 0, el.width, el.height);
          ctx.fillStyle = "hsl(0 0% 45%)";
          ctx.font = "12px Montserrat";
          ctx.fillText(el.type, 8, 20);
        }
      }

      ctx.restore();

      // Selection handles
      if (selectedElementIds.includes(el.id)) {
        ctx.save();
        ctx.strokeStyle = "hsl(217 100% 56%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4);
        ctx.setLineDash([]);

        // 8-point resize handles (P1-004)
        const handleSize = 8;
        const handles = [
          { x: el.x - handleSize / 2, y: el.y - handleSize / 2 },
          { x: el.x + el.width / 2 - handleSize / 2, y: el.y - handleSize / 2 },
          { x: el.x + el.width - handleSize / 2, y: el.y - handleSize / 2 },
          { x: el.x + el.width - handleSize / 2, y: el.y + el.height / 2 - handleSize / 2 },
          { x: el.x + el.width - handleSize / 2, y: el.y + el.height - handleSize / 2 },
          { x: el.x + el.width / 2 - handleSize / 2, y: el.y + el.height - handleSize / 2 },
          { x: el.x - handleSize / 2, y: el.y + el.height - handleSize / 2 },
          { x: el.x - handleSize / 2, y: el.y + el.height / 2 - handleSize / 2 },
        ];
        handles.forEach(h => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(h.x, h.y, handleSize, handleSize);
          ctx.strokeStyle = "hsl(217 100% 56%)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(h.x, h.y, handleSize, handleSize);
        });

        // Rotation handle (P1-005)
        const rotHandleY = el.y - 24;
        ctx.beginPath();
        ctx.moveTo(el.x + el.width / 2, el.y);
        ctx.lineTo(el.x + el.width / 2, rotHandleY);
        ctx.strokeStyle = "hsl(217 100% 56%)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(el.x + el.width / 2, rotHandleY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "hsl(217 100% 56%)";
        ctx.fill();

        ctx.restore();
      }
    });

    // Alignment guides (P1-003)
    if (showAlignmentGuides && isDragging && selectedElementIds.length === 1) {
      const sel = activePage.elements.find(e => e.id === selectedElementIds[0]);
      if (sel) {
        const cx = sel.x + sel.width / 2;
        const cy = sel.y + sel.height / 2;
        const pageCx = activePage.width / 2;
        const pageCy = activePage.height / 2;

        ctx.save();
        ctx.strokeStyle = "hsl(0 100% 50% / 0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        if (Math.abs(cx - pageCx) < 4) {
          ctx.beginPath(); ctx.moveTo(pageCx, 0); ctx.lineTo(pageCx, activePage.height); ctx.stroke();
        }
        if (Math.abs(cy - pageCy) < 4) {
          ctx.beginPath(); ctx.moveTo(0, pageCy); ctx.lineTo(activePage.width, pageCy); ctx.stroke();
        }
        ctx.restore();
      }
    }
  }, [activePage, showGrid, gridSize, selectedElementIds, showAlignmentGuides, isDragging]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!activePage || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Check if Space is held for panning
    if (e.button === 1 || isPanning) {
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    // Hit test (reverse order for top-most)
    const sorted = [...activePage.elements].sort((a, b) => b.layerIndex - a.layerIndex);
    const hit = sorted.find(el =>
      el.visible && !el.locked &&
      x >= el.x && x <= el.x + el.width &&
      y >= el.y && y <= el.y + el.height
    );

    if (hit) {
      selectElement(hit.id, e.shiftKey);
      setIsDragging(true);
      setDragStart({ x: x - hit.x, y: y - hit.y });
      setContextToolbar({ x: e.clientX, y: e.clientY - 60 });
    } else {
      clearSelection();
    }
  }, [activePage, zoom, panX, panY, isPanning, selectElement, clearSelection, setContextToolbar]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !activePage || !canvasRef.current || selectedElementIds.length !== 1) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragStart.x;
    const y = (e.clientY - rect.top) / zoom - dragStart.y;
    updateElement(activePage.id, selectedElementIds[0], { x, y });
  }, [isDragging, activePage, zoom, dragStart, selectedElementIds, updateElement]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts (P1-010)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!activePageId) return;

      // Space for pan mode
      if (e.code === "Space" && e.type === "keydown") { setIsPanning(true); return; }
      if (e.code === "Space" && e.type === "keyup") { setIsPanning(false); return; }

      if (e.key === "Delete" || e.key === "Backspace") {
        selectedElementIds.forEach(id => {
          const store = useEditorStore.getState();
          store.removeElement(activePageId, id);
        });
      }
      if (e.key === "Escape") clearSelection();
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); useEditorStore.getState().selectAll(activePageId); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); useEditorStore.getState().undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); useEditorStore.getState().redo(); }
      if (e.ctrlKey && e.key === "d" && selectedElementIds.length === 1) {
        e.preventDefault();
        useEditorStore.getState().duplicateElement(activePageId, selectedElementIds[0]);
      }

      // Arrow nudge
      const nudge = e.shiftKey ? 10 : 1;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedElementIds.length > 0) {
        e.preventDefault();
        const store = useEditorStore.getState();
        const page = store.pages.find(p => p.id === activePageId);
        if (!page) return;
        selectedElementIds.forEach(id => {
          const el = page.elements.find(e => e.id === id);
          if (!el) return;
          const updates: Partial<typeof el> = {};
          if (e.key === "ArrowUp") updates.y = el.y - nudge;
          if (e.key === "ArrowDown") updates.y = el.y + nudge;
          if (e.key === "ArrowLeft") updates.x = el.x - nudge;
          if (e.key === "ArrowRight") updates.x = el.x + nudge;
          store.updateElement(activePageId, id, updates);
        });
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handler);
    };
  }, [activePageId, selectedElementIds, clearSelection]);

  // Scroll-to-zoom (P1-009)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    }
  }, [zoom, setZoom]);

  if (!activePage) return <div className="flex-1 flex items-center justify-center text-muted-foreground">No page selected</div>;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-8",
        isPanning && "cursor-grab",
        className
      )}
      onWheel={handleWheel}
    >
      <div
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: "top center",
        }}
      >
        <canvas
          ref={canvasRef}
          className="shadow-card rounded-sm bg-white cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
