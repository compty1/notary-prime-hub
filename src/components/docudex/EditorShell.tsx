/**
 * DocuDex Editor Shell — Main layout wrapper (P0-003)
 * Composes all editor panels: Canvas, Properties, Layers, Comments,
 * VersionHistory, ApprovalWorkflow, OnboardingTour, ShareDialog,
 * AIDocumentSuite, ImportExportEngine, FeatureGating, LocaleSwitcher
 */
import { useState, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useAuth } from "@/contexts/AuthContext";
import { useDocuDexAutoSave } from "@/hooks/useDocuDexAutoSave";
import { useDocumentPermissions } from "@/hooks/useDocumentPermissions";
import { CanvasViewport } from "./CanvasViewport";
import { PropertyPanel } from "./PropertyPanel";
import { LayersPanel } from "./LayersPanel";
import { CommentsPanel } from "./CommentsPanel";
import { VersionHistory } from "./VersionHistory";
import { ApprovalWorkflow } from "./ApprovalWorkflow";
import type { ApprovalStatus } from "./ApprovalWorkflow";
import { OnboardingTour } from "./OnboardingTour";
import { ShareDialog } from "./ShareDialog";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { AIDocumentSuite } from "./AIDocumentSuite";
import { ImportExportEngine } from "./ImportExportEngine";
import { FeatureGateProvider, FeatureGate } from "./FeatureGating";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Type, Square, Image, PenTool, QrCode, Table2,
  Plus, Minus, Grid3X3, Ruler, Layers,
  Undo2, Redo2, Save, Download, Upload, ChevronLeft, ChevronRight,
  MessageSquare, History, Users, HelpCircle, Sparkles,
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
    addElement, undo, redo, undoStack, redoStack, documentId,
  } = useEditorStore();

  const { user } = useAuth();
  const { manualSave } = useDocuDexAutoSave({ enabled: !!user });
  const { shares, canEdit, shareDocument, revokeAccess } = useDocumentPermissions(documentId);

  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importExportMode, setImportExportMode] = useState<"import" | "export">("export");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("draft");

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
          : type === "signature"
            ? { dataUrl: "" }
            : {},
    };
    addElement(activePageId, base);
  };

  const handleSave = useCallback(() => {
    manualSave();
    onSave?.();
  }, [manualSave, onSave]);

  const handleExport = useCallback(() => {
    setImportExportMode("export");
    setShowImportExport(true);
  }, []);

  const handleImport = useCallback(() => {
    setImportExportMode("import");
    setShowImportExport(true);
  }, []);

  return (
    <EditorErrorBoundary>
      <FeatureGateProvider tier="pro">
        <OnboardingTour run={showTour} onComplete={() => setShowTour(false)} />
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          shares={shares}
          onShare={shareDocument}
          onRevoke={revokeAccess}
        />
        <ImportExportEngine
          open={showImportExport}
          onOpenChange={setShowImportExport}
          mode={importExportMode}
        />

        <div className={cn("flex flex-col h-full bg-background", className)}>
          {/* Top toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent text-sm font-semibold text-foreground border-none outline-none w-48"
              placeholder="Document title..."
            />

            {/* Approval workflow */}
            <div className="hidden md:flex items-center">
              <ApprovalWorkflow
                status={approvalStatus}
                onStatusChange={setApprovalStatus}
                isOwner={true}
                className="scale-90 origin-left"
              />
            </div>

            <div className="flex-1" />

            {/* Undo/Redo */}
            <div data-tour="undo-redo" className="flex gap-0.5">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Zoom */}
            <div data-tour="zoom-controls" className="flex items-center gap-0.5">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(zoom - 0.1)}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Badge variant="outline" className="text-xs min-w-[3rem] justify-center">{Math.round(zoom * 100)}%</Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(zoom + 0.1)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* View toggles */}
            <Button size="icon" variant={showGrid ? "secondary" : "ghost"} className="h-8 w-8" onClick={toggleGrid} title="Toggle Grid">
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={showRulers ? "secondary" : "ghost"} className="h-8 w-8" onClick={toggleRulers} title="Toggle Rulers">
              <Ruler className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={showLayers ? "secondary" : "ghost"} className="h-8 w-8" onClick={toggleLayers} title="Toggle Layers" data-tour="layers-toggle">
              <Layers className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={showComments ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setShowComments(!showComments)} title="Comments">
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={showVersions ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setShowVersions(!showVersions)} title="Version History">
              <History className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={showAI ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setShowAI(!showAI)} title="AI Assistant">
              <Sparkles className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowShareDialog(true)} title="Share">
              <Users className="w-4 h-4" />
            </Button>
            <LocaleSwitcher />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowTour(true)} title="Help Tour">
              <HelpCircle className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <div data-tour="save-export" className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={handleImport} className="h-8 gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Import
              </Button>
              <Button size="sm" variant="outline" onClick={handleSave} className="h-8 gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
              <Button size="sm" onClick={handleExport} className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Element sidebar */}
            <div data-tour="element-sidebar" className="w-14 border-r border-border bg-card flex flex-col items-center py-3 gap-1">
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
            <div data-tour="canvas" className="flex-1 flex">
              <CanvasViewport />
            </div>

            {/* Layers panel (conditional) */}
            {showLayers && <LayersPanel />}

            {/* Comments panel (conditional) */}
            {showComments && <CommentsPanel documentId={documentId} />}

            {/* Version history panel (conditional) */}
            {showVersions && <VersionHistory documentId={documentId} />}

            {/* AI Suite panel (conditional) */}
            <FeatureGate feature="canUseAI">
              {showAI && <AIDocumentSuite />}
            </FeatureGate>

            {/* Property panel */}
            <div data-tour="property-panel">
              <PropertyPanel />
            </div>
          </div>

          {/* Bottom bar — page navigation */}
          <div data-tour="page-nav" className="flex items-center gap-2 px-4 py-1.5 border-t border-border bg-card">
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
            <Badge variant="outline" className="text-[10px]">
              {approvalStatus.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {pages.find(p => p.id === activePageId)?.elements.length || 0} elements
            </span>
          </div>
        </div>
      </FeatureGateProvider>
    </EditorErrorBoundary>
  );
}
