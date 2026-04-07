import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import LinkExt from "@tiptap/extension-link";
import TableExt from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import SubScript from "@tiptap/extension-subscript";
import SuperScript from "@tiptap/extension-superscript";
import ImageExt from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { AIContentPreview } from "@/components/AIContentPreview";
import { cn } from "@/lib/utils";
import {
  FileText, Save, FileDown, Printer, Loader2, MessageSquare,
  ZoomIn, ZoomOut, Send, X, Sparkles, Plus, Maximize2,
} from "lucide-react";
import { DocuDexToolbar } from "./docudex/DocuDexToolbar";
import { DocuDexSidebar } from "./docudex/DocuDexSidebar";
import { DocuDexPageList } from "./docudex/DocuDexPageList";
import { DocuDexFindReplace } from "./docudex/DocuDexFindReplace";
import { TEMPLATES, BRAND_FONTS, LANGUAGES, PAGE_SIZES } from "./docudex/constants";
import { uid, wordCount, charCount, readTime, readabilityScore } from "./docudex/helpers";
import type { PageData, HistorySnapshot, DocuDexEditorProps } from "./docudex/types";

export type { DocuDexEditorProps };
export { type PageData };

export function DocuDexEditor({
  initialPages,
  initialTitle = "",
  onSave,
  maxChars = 500000,
  clientName,
  serviceName,
  compact,
}: DocuDexEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState(initialTitle);
  const [pages, setPages] = useState<PageData[]>(
    initialPages?.length ? initialPages : [{ id: uid(), html: "<p><br></p>" }]
  );
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [sidebarTab, setSidebarTab] = useState<string>("templates");
  const [sidebarOpen, setSidebarOpen] = useState(!compact);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [brandFont, setBrandFont] = useState("sans");
  const [accentColor, setAccentColor] = useState("#F59E0B");
  const [pageSize, setPageSize] = useState("letter");
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [saving, setSaving] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPageSize = PAGE_SIZES.find(s => s.value === pageSize) || PAGE_SIZES[0];
  const fontFamily = BRAND_FONTS.find(f => f.value === brandFont)?.family || "sans-serif";

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      UnderlineExt,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      LinkExt.configure({ openOnClick: false }),
      TableExt.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      SubScript,
      SuperScript,
      ImageExt.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: "Start typing or select a template..." }),
    ],
    content: pages[activePageIdx]?.html || "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, html } : p));
      setIsDirty(true);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-12 min-h-full",
        style: `font-family: ${fontFamily}; line-height: ${lineSpacing};`,
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files?.length) {
          event.preventDefault();
          Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
              handleImageFile(file);
            }
          });
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) handleImageFile(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Sync editor content when switching pages
  useEffect(() => {
    if (editor && pages[activePageIdx]) {
      const currentContent = editor.getHTML();
      if (currentContent !== pages[activePageIdx].html) {
        editor.commands.setContent(pages[activePageIdx].html || "");
      }
    }
  }, [activePageIdx, editor]);

  // Update editor font when brandFont or lineSpacing changes
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: {
            class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-12 min-h-full",
            style: `font-family: ${fontFamily}; line-height: ${lineSpacing};`,
          },
        },
      });
    }
  }, [fontFamily, lineSpacing, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        setShowFindReplace(prev => !prev);
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pages, title]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (isDirty && onSave && user) {
        saveSnapshot("Auto-save");
        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [isDirty, onSave, user]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Image upload
  const handleImageFile = useCallback(async (file: File) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    const path = `docudex/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    if (editor && urlData?.publicUrl) {
      editor.chain().focus().setImage({ src: urlData.publicUrl, alt: file.name }).run();
    }
  }, [editor, user, toast]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImageFile(file);
    };
    input.click();
  }, [handleImageFile]);

  // Save snapshot
  const saveSnapshot = useCallback((label: string = "Manual save") => {
    setHistory(prev => [
      { timestamp: new Date().toISOString(), pages: pages.map(p => ({ ...p })), label },
      ...prev.slice(0, 29),
    ]);
  }, [pages]);

  // Page CRUD
  const addPage = () => {
    const newPage = { id: uid(), html: "<p><br></p>" };
    setPages(prev => [...prev, newPage]);
    setActivePageIdx(pages.length);
  };
  const deletePage = (idx: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== idx));
    if (activePageIdx >= idx && activePageIdx > 0) setActivePageIdx(activePageIdx - 1);
  };
  const duplicatePage = () => {
    const clone = { id: uid(), html: pages[activePageIdx].html };
    const next = [...pages];
    next.splice(activePageIdx + 1, 0, clone);
    setPages(next);
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    saveSnapshot("Before template");
    setPages([{ id: uid(), html: tpl.content }]);
    setActivePageIdx(0);
    if (editor) editor.commands.setContent(tpl.content);
    toast({ title: "Template applied", description: tpl.label });
  };

  // Insert element
  const insertElement = (type: string) => {
    if (!editor) return;
    if (type === "table") {
      (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      return;
    }
    let html = "";
    if (type === "callout") html = `<blockquote><p><strong>Note:</strong> Enter your note here</p></blockquote>`;
    if (type === "divider") html = `<hr>`;
    if (type === "signature") html = `<p style="margin-top:40px">___________________________<br><em>Signature / Date</em></p>`;
    if (type === "image") { handleImageUpload(); return; }
    if (type === "notary-seal") html = `<div style="border:2px solid #1E293B;padding:16px;margin:16px 0;text-align:center;border-radius:8px;"><p><strong>NOTARY SEAL</strong></p><p>State of Ohio</p><p>Commission #: ____________</p><p>Expires: ____________</p></div>`;
    if (type === "qr-code") html = `<p style="text-align:center;padding:16px;border:1px dashed #ccc;margin:16px 0;">[QR Code — Use export to embed]</p>`;
    if (html) editor.chain().focus().insertContent(html).run();
  };

  // AI generation
  const aiGenerateFullPage = async (prompt: string) => {
    setAiLoading(true);
    try {
      const systemPrompt = `You are a professional document writer for NotarDex. Generate document content in clean HTML (p, h1-h3, ul, ol, li, strong, em, table, tr, td, th tags). ${clientName ? `Client: ${clientName}.` : ""} ${serviceName ? `Service: ${serviceName}.` : ""} Style: professional legal/business.`;
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: { messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] },
      });
      if (resp.error) throw resp.error;
      const text = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      setPreviewContent(text);
      setShowPreview(true);
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message || "Failed to generate", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // AI text action
  const aiTextAction = async (action: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (!selectedText.trim()) {
      toast({ title: "Select text first", description: "Highlight text on the page, then try again." });
      return;
    }
    setAiLoading(true);
    try {
      const prompts: Record<string, string> = {
        improve: `Improve this text, keeping the same meaning but making it clearer:\n\n${selectedText}`,
        formal: `Rewrite this text in a formal, professional tone:\n\n${selectedText}`,
        shorter: `Make this text more concise while keeping key points:\n\n${selectedText}`,
        expand: `Expand this text with more detail:\n\n${selectedText}`,
        grammar: `Fix grammar, spelling, and punctuation. Return only the corrected text:\n\n${selectedText}`,
      };
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: { messages: [{ role: "system", content: "You are a professional editor. Return only the revised text. No explanations." }, { role: "user", content: prompts[action] || selectedText }] },
      });
      if (resp.error) throw resp.error;
      const result = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, sanitizeHtml(result)).run();
      toast({ title: "Text updated", description: `${action} applied successfully.` });
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // AI Chat
  const sendAiChat = async () => {
    if (!aiPrompt.trim()) return;
    const userMsg = { role: "user", content: aiPrompt };
    const newMessages = [...aiMessages, userMsg];
    setAiMessages(newMessages);
    setAiPrompt("");
    setAiLoading(true);
    try {
      const currentContent = pages.map(p => stripHtml(p.html)).join("\n\n---\n\n");
      const systemPrompt = `You are DocuDex AI, a document assistant for NotarDex. The user is editing "${title || "Untitled"}". Current content:\n\n${currentContent.slice(0, 8000)}\n\nHelp edit, draft, or improve. Use clean HTML tags. Be concise.`;
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: { messages: [{ role: "system", content: systemPrompt }, ...newMessages.slice(-10)] },
      });
      if (resp.error) throw resp.error;
      const text = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      setAiMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Sorry, an error occurred. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Insert AI chat response into editor
  const insertAiResponse = (content: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(sanitizeHtml(content)).run();
    toast({ title: "Content inserted" });
  };

  // Translate
  const translatePage = async (lang: string) => {
    setAiLoading(true);
    try {
      const content = pages[activePageIdx]?.html || "";
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: {
          messages: [
            { role: "system", content: `Translate the following HTML to ${LANGUAGES.find(l => l.value === lang)?.label || lang}. Preserve HTML formatting. Return only translated HTML.` },
            { role: "user", content: content },
          ],
        },
      });
      if (resp.error) throw resp.error;
      const translated = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      saveSnapshot("Before translation");
      const sanitized = sanitizeHtml(translated);
      setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, html: sanitized } : p));
      if (editor) editor.commands.setContent(sanitized);
      toast({ title: "Translation complete" });
    } catch (e: any) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Restore history
  const restoreSnapshot = (snapshot: HistorySnapshot) => {
    saveSnapshot("Before restore");
    setPages(snapshot.pages.map(p => ({ ...p })));
    setActivePageIdx(0);
    if (editor) editor.commands.setContent(snapshot.pages[0]?.html || "");
    toast({ title: "Restored", description: `Reverted to ${new Date(snapshot.timestamp).toLocaleTimeString()}` });
  };

  // Save
  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(title, pages);
      saveSnapshot("Saved");
      setIsDirty(false);
      setLastSaved(new Date().toLocaleTimeString());
      toast({ title: "Document saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Export .DOC (HTML-based for now)
  const exportDoc = () => {
    const allHtml = pages.map(p => `<div style="page-break-after:always;">${p.html}</div>`).join("");
    const full = `<html><head><meta charset="utf-8"><style>body{font-family:${fontFamily};font-size:14px;line-height:${lineSpacing};color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px;}h1{font-size:24px;}h2{font-size:20px;}h3{font-size:17px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>${allHtml}</body></html>`;
    const blob = new Blob([full], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "DocuDex-Document"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print/PDF
  const printDoc = () => {
    const allHtml = pages.map(p => `<div style="page-break-after:always;">${p.html}</div>`).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>${title || "DocuDex"}</title><style>body{font-family:${fontFamily};font-size:14px;line-height:${lineSpacing};color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px;}h1{font-size:24px;}h2{font-size:20px;}h3{font-size:17px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}@media print{body{padding:0;}}</style></head><body>${allHtml}</body></html>`);
    win.document.close();
    win.print();
  };

  // Apply AI content from preview
  const handleApplyContent = (content: string) => {
    saveSnapshot("Before AI insert");
    const sanitized = sanitizeHtml(content);
    setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, html: sanitized } : p));
    if (editor) editor.commands.setContent(sanitized);
    setShowPreview(false);
    toast({ title: "Content applied" });
  };

  const handleRegenerate = async (style: string, format: string) => {
    setIsRegenerating(true);
    try {
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: {
          messages: [
            { role: "system", content: `Generate document content in ${style} style using ${format} format. Output clean HTML.` },
            { role: "user", content: `Regenerate the previous content in ${style} style with ${format} formatting.` },
          ],
        },
      });
      if (resp.error) throw resp.error;
      const text = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      setPreviewContent(text);
    } catch {
      toast({ title: "Regeneration failed", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const totalChars = charCount(pages);
  const totalWords = pages.reduce((sum, p) => sum + wordCount(p.html), 0);
  const plainText = pages.map(p => stripHtml(p.html)).join(" ");
  const { score: readScore, level: readLevel } = readabilityScore(plainText);

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-background", isFullscreen && "fixed inset-0 z-50")}>
        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 shrink-0">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-primary" />
            <Input
              className="h-7 w-52 text-sm font-semibold border-none bg-transparent shadow-none focus-visible:ring-0 px-1"
              placeholder="Untitled Document"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="Document title"
            />
          </div>

          <div className="h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleSave} disabled={saving || !onSave}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (Ctrl+S)</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border" />

          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={exportDoc}>
            <FileDown className="h-3.5 w-3.5" /> .DOC
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={printDoc}>
            <Printer className="h-3.5 w-3.5" /> PDF
          </Button>

          <div className="flex-1" />

          {/* Save status */}
          <span className="text-[10px] text-muted-foreground">
            {isDirty ? "Unsaved changes" : lastSaved ? `Saved ${lastSaved}` : ""}
          </span>

          {(clientName || serviceName) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
              {clientName && <Badge variant="outline" className="text-[10px]">{clientName}</Badge>}
              {serviceName && <Badge variant="outline" className="text-[10px]">{serviceName}</Badge>}
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(50, z - 10))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsFullscreen(f => !f)}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen (F11)</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border" />

          <Button
            variant={showAiChat ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAiChat(!showAiChat)}
          >
            <MessageSquare className="h-3.5 w-3.5" /> AI Chat
          </Button>
        </div>

        {/* ═══ TOOLBAR ═══ */}
        <DocuDexToolbar
          editor={editor}
          brandFont={brandFont}
          onBrandFontChange={setBrandFont}
          onImageUpload={handleImageUpload}
          onFindReplace={() => setShowFindReplace(f => !f)}
        />

        {/* Find & Replace */}
        {showFindReplace && (
          <DocuDexFindReplace
            editor={editor}
            onClose={() => setShowFindReplace(false)}
            pageContents={pages.map(p => p.html)}
          />
        )}

        {/* ═══ MAIN BODY ═══ */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <DocuDexSidebar
            editor={editor}
            sidebarTab={sidebarTab}
            setSidebarTab={setSidebarTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            brandFont={brandFont}
            setBrandFont={setBrandFont}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            pageSize={pageSize}
            setPageSize={setPageSize}
            lineSpacing={lineSpacing}
            setLineSpacing={setLineSpacing}
            history={history}
            onApplyTemplate={applyTemplate}
            onInsertElement={insertElement}
            onAiGenerate={aiGenerateFullPage}
            onAiTextAction={aiTextAction}
            onTranslate={translatePage}
            onRestoreSnapshot={restoreSnapshot}
            aiLoading={aiLoading}
            maxChars={maxChars}
            compact={compact}
          />

          {/* ─── CANVAS AREA ─── */}
          <div className="flex-1 flex flex-col overflow-hidden relative" ref={canvasRef}>
            <div className="flex-1 overflow-auto bg-muted/40">
              <div className="py-8 px-4 min-h-full flex flex-col items-center">
                {/* AI Content Preview */}
                {showPreview && (
                  <div className="mb-4 w-full" style={{ maxWidth: currentPageSize.width }}>
                    <AIContentPreview
                      content={previewContent}
                      onApply={handleApplyContent}
                      onRegenerate={handleRegenerate}
                      onClose={() => setShowPreview(false)}
                      isRegenerating={isRegenerating}
                    />
                  </div>
                )}

                {aiLoading && !showPreview && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 w-full" style={{ maxWidth: currentPageSize.width }}>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">AI is processing...</span>
                  </div>
                )}

                {/* Editor Canvas */}
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                  <div
                    className={cn(
                      "bg-white dark:bg-zinc-900 shadow-lg rounded border border-border/50",
                      "outline-none focus-within:shadow-xl transition-shadow ring-2 ring-primary/30"
                    )}
                    style={{
                      width: currentPageSize.width,
                      minHeight: currentPageSize.height,
                    }}
                  >
                    <EditorContent editor={editor} />
                  </div>
                </div>

                {/* Add page */}
                <div className="mt-6">
                  <Button variant="outline" size="sm" onClick={addPage} className="text-xs gap-1 shadow-sm">
                    <Plus className="h-3.5 w-3.5" /> Add Page
                  </Button>
                </div>
              </div>
            </div>

            {/* Page thumbnails with drag-and-drop */}
            <DocuDexPageList
              pages={pages}
              activePageIdx={activePageIdx}
              onPageSelect={setActivePageIdx}
              onAddPage={addPage}
              onReorder={setPages}
            />
          </div>

          {/* ─── AI CHAT PANEL ─── */}
          {showAiChat && (
            <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> DocuDex AI</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowAiChat(false)}><X className="h-3.5 w-3.5" /></Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {aiMessages.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                      <Sparkles className="h-8 w-8 text-primary/30 mx-auto" />
                      <p className="text-xs text-muted-foreground">Ask me to help draft, rewrite, or improve your document.</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={cn("rounded-lg p-2.5 text-xs", msg.role === "user" ? "bg-primary/10 ml-6" : "bg-muted mr-4")}>
                      <div className="prose prose-xs dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.content) }} />
                      {msg.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] mt-1 px-1.5"
                          onClick={() => insertAiResponse(msg.content)}
                        >
                          Insert at cursor
                        </Button>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-border p-2.5 flex gap-1.5">
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="Ask DocuDex AI..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAiChat()}
                />
                <Button size="sm" className="h-8 w-8 p-0" onClick={sendAiChat} disabled={aiLoading || !aiPrompt.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ STATUS BAR ═══ */}
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-1.5 shrink-0" role="status" aria-live="polite">
          <div className="flex items-center gap-5 text-[10px] text-muted-foreground">
            <span className="font-medium">{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
            <span>{totalWords.toLocaleString()} words</span>
            <span>{readTime(totalWords)} read</span>
            <span>{totalChars.toLocaleString()} / {maxChars.toLocaleString()} chars</span>
            <span>Page {activePageIdx + 1} of {pages.length}</span>
            <span title={`Flesch-Kincaid: ${readScore}`}>Readability: {readLevel}</span>
          </div>
          <div className="flex items-center gap-2">
            {totalChars > maxChars * 0.9 && (
              <Badge variant="destructive" className="text-[10px]">Approaching limit</Badge>
            )}
          </div>
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" id="docudex-announcements" />
      </div>
    </TooltipProvider>
  );
}
