/**
 * DocuDex Editor Shell — Main layout wrapper (P0-003)
 * Composes CanvasViewport, PropertyPanel, LayersPanel, ToolbarController, PageNavigator
 */
import { useEditorStore } from "@/stores/editorStore";
import { CanvasViewport } from "./CanvasViewport";
import { PropertyPanel } from "./PropertyPanel";
import { LayersPanel } from "./LayersPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Type, Square, Image, PenTool, QrCode, Table2,
  Plus, Minus, ZoomIn, Grid3X3, Ruler, Layers,
  Undo2, Redo2, Save, Download, ChevronLeft, ChevronRight,
} from "lucide-react";

interface EditorShellProps {
  className?: string;
  onSave?: () => void;
  onExport?: () => void;
}

export function EditorShell({ className, onSave, onExport }: EditorShellProps) {
  const {
    title, setTitle, pages, activePageId, zoom, setZoom,
    showGrid, toggleGrid, showRulers, toggleRulers,
    showLayers, toggleLayers, addPage, setActivePage,
    addElement, undo, redo, undoStack, redoStack,
  } = useEditorStore();

  const activePageIndex = pages.findIndex(p => p.id === activePageId);

  const addElementToPage = (type: string) => {
    if (!activePageId) return;
    const base = {
      type: type as any,
      x: 100,
      y: 100,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 40 : 150,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      styles: type === "text"
        ? { fontSize: 16, fontFamily: "Montserrat", fontWeight: "400", color: "#000000" }
        : type === "shape"
          ? { fill: "#E4AC0F", stroke: "transparent", strokeWidth: 0, borderRadius: 0 }
          : {},
      content: type === "text"
        ? { text: "Type here..." }
        : type === "qrcode"
          ? { data: "https://notar.com" }
          : {},
    };
    addElement(activePageId, base);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-transparent text-sm font-semibold text-foreground border-none outline-none w-48"
          placeholder="Document title..."
        />
        <div className="flex-1" />

        {/* Undo/Redo */}
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Zoom */}
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(zoom - 0.1)}>
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <Badge variant="outline" className="text-xs min-w-[3rem] justify-center">{Math.round(zoom * 100)}%</Badge>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(zoom + 0.1)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* View toggles */}
        <Button size="icon" variant={showGrid ? "secondary" : "ghost"} className="h-8 w-8" onClick={toggleGrid} title="Toggle Grid">
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant={showRulers ? "secondary" : "ghost"} className="h-8 w-8" onClick={toggleRulers} title="Toggle Rulers">
          <Ruler className="w-4 h-4" />
        </Button>
        <Button size="icon" variant={showLayers ? "secondary" : "ghost"} className="h-8 w-8" onClick={toggleLayers} title="Toggle Layers">
          <Layers className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button size="sm" variant="outline" onClick={onSave} className="h-8 gap-1.5">
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
        <Button size="sm" variant="accent" onClick={onExport} className="h-8 gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Element sidebar */}
        <div className="w-14 border-r border-border bg-card flex flex-col items-center py-3 gap-1">
          {[
            { type: "text", icon: <Type className="w-4 h-4" />, label: "Text" },
            { type: "shape", icon: <Square className="w-4 h-4" />, label: "Shape" },
            { type: "image", icon: <Image className="w-4 h-4" />, label: "Image" },
            { type: "table", icon: <Table2 className="w-4 h-4" />, label: "Table" },
            { type: "signature", icon: <PenTool className="w-4 h-4" />, label: "Sign" },
            { type: "qrcode", icon: <QrCode className="w-4 h-4" />, label: "QR" },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => addElementToPage(item.type)}
              className="w-10 h-10 rounded-lg flex flex-col items-center justify-center hover:bg-muted transition-colors group"
              title={`Add ${item.label}`}
            >
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.icon}</span>
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <CanvasViewport />

        {/* Layers panel (conditional) */}
        {showLayers && <LayersPanel />}

        {/* Property panel */}
        <PropertyPanel />
      </div>

      {/* Bottom bar — page navigation */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-t border-border bg-card">
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={activePageIndex <= 0} onClick={() => pages[activePageIndex - 1] && setActivePage(pages[activePageIndex - 1].id)}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {activePageIndex + 1} of {pages.length}
        </span>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={activePageIndex >= pages.length - 1} onClick={() => pages[activePageIndex + 1] && setActivePage(pages[activePageIndex + 1].id)}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => addPage()}>
          <Plus className="w-3 h-3" /> Add Page
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {pages.find(p => p.id === activePageId)?.elements.length || 0} elements
        </span>
      </div>
    </div>
  );
}
