import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { AIContentPreview } from "@/components/AIContentPreview";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Type, Wand2, Plus, Trash2, Copy, ChevronDown, ChevronUp, Save, FileDown,
  Printer, Undo2, MessageSquare, Loader2, Languages, History, Palette, LayoutTemplate,
  Sparkles, Table, X, Send, ZoomIn, ZoomOut, GripVertical, Maximize2,
  FileText, Minus, PenLine, SeparatorHorizontal, Quote, Image,
} from "lucide-react";

/* ─────────── Types ─────────── */
interface PageData { id: string; html: string; }
interface HistorySnapshot { timestamp: string; pages: PageData[]; label: string; }
interface DocuDexEditorProps {
  initialPages?: PageData[];
  initialTitle?: string;
  onSave?: (title: string, pages: PageData[]) => Promise<void>;
  maxChars?: number;
  clientName?: string;
  serviceName?: string;
  compact?: boolean;
}

/* ─────────── Templates ─────────── */
const TEMPLATES = [
  { id: "blank", label: "Blank Document", icon: "📄", content: "<p><br></p>" },
  { id: "contract", label: "Service Contract", icon: "📋", content: "<h1>Service Agreement</h1><p>This agreement is entered into between the following parties...</p><h2>1. Scope of Services</h2><p></p><h2>2. Compensation</h2><p></p><h2>3. Terms & Conditions</h2><p></p><h2>4. Signatures</h2><p></p>" },
  { id: "affidavit", label: "Affidavit", icon: "⚖️", content: "<h1>Affidavit</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I, ____________, being duly sworn, do hereby state under oath:</p><ol><li></li></ol><p>Signed this ___ day of ____________, 20___.</p><p>___________________________<br>Affiant Signature</p>" },
  { id: "deed", label: "Warranty Deed", icon: "🏠", content: "<h1>Warranty Deed</h1><p>This deed is made on ____________, by and between:</p><p><strong>Grantor:</strong> ____________</p><p><strong>Grantee:</strong> ____________</p><h2>Property Description</h2><p></p><h2>Covenants</h2><p></p>" },
  { id: "poa", label: "Power of Attorney", icon: "✍️", content: "<h1>Power of Attorney</h1><p>I, ____________ (\"Principal\"), of ____________, Ohio, hereby appoint ____________ (\"Agent\") as my attorney-in-fact to act on my behalf...</p><h2>Powers Granted</h2><ul><li></li></ul><h2>Duration</h2><p></p>" },
  { id: "proposal", label: "Business Proposal", icon: "💼", content: "<h1>Proposal</h1><h2>Executive Summary</h2><p></p><h2>Problem Statement</h2><p></p><h2>Proposed Solution</h2><p></p><h2>Timeline & Deliverables</h2><p></p><h2>Investment</h2><p></p>" },
  { id: "letter", label: "Formal Letter", icon: "✉️", content: "<p>[Your Name]<br>[Address]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Address]</p><p>Dear ____________,</p><p></p><p>Sincerely,</p><p>___________________________</p>" },
  { id: "report", label: "Report", icon: "📊", content: "<h1>Report Title</h1><p><strong>Prepared by:</strong> ____________<br><strong>Date:</strong> ____________</p><h2>1. Introduction</h2><p></p><h2>2. Findings</h2><p></p><h2>3. Recommendations</h2><p></p><h2>4. Conclusion</h2><p></p>" },
];

const BRAND_FONTS = [
  { value: "sans", label: "Sans-Serif", family: "ui-sans-serif, system-ui, sans-serif" },
  { value: "serif", label: "Serif", family: "ui-serif, Georgia, serif" },
  { value: "mono", label: "Monospace", family: "ui-monospace, monospace" },
];

const ACCENT_COLORS = [
  { value: "#F59E0B", label: "Amber" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Emerald" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EF4444", label: "Red" },
  { value: "#1E293B", label: "Slate" },
];

const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
];

const SIDEBAR_TABS = [
  { id: "templates", icon: LayoutTemplate, label: "Templates" },
  { id: "ai", icon: Wand2, label: "AI Tools" },
  { id: "elements", icon: Table, label: "Elements" },
  { id: "design", icon: Palette, label: "Design" },
  { id: "translate", icon: Languages, label: "Translate" },
  { id: "history", icon: History, label: "History" },
] as const;

/* ─────────── Helpers ─────────── */
function uid() { return crypto.randomUUID(); }
function wordCount(html: string): number {
  const text = stripHtml(html).trim();
  return text ? text.split(/\s+/).length : 0;
}
function charCount(pages: PageData[]): number {
  return pages.reduce((sum, p) => sum + stripHtml(p.html).length, 0);
}
function readTime(words: number): string {
  const m = Math.ceil(words / 200);
  return m < 1 ? "< 1 min" : `${m} min`;
}

/* ─────────── Component ─────────── */
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
  const [saving, setSaving] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [targetLength, setTargetLength] = useState<number[]>([5000]);
  const [zoom, setZoom] = useState(100);
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);

  // Floating toolbar on text selection
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setFloatingToolbar(prev => ({ ...prev, visible: false }));
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      // Check if selection is within the canvas
      if (rect.top < canvasRect.top || rect.bottom > canvasRect.bottom) return;
      setFloatingToolbar({
        x: rect.left + rect.width / 2 - canvasRect.left,
        y: rect.top - canvasRect.top - 48,
        visible: true,
      });
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  // Save snapshot
  const saveSnapshot = useCallback((label: string = "Manual save") => {
    setHistory(prev => [
      { timestamp: new Date().toISOString(), pages: pages.map(p => ({ ...p })), label },
      ...prev.slice(0, 19),
    ]);
  }, [pages]);

  // Toolbar commands
  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  // Sync page content
  const syncPage = useCallback((pageId: string) => {
    const el = pageRefs.current.get(pageId);
    if (!el) return;
    const html = el.innerHTML;
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, html } : p));
  }, []);

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
  const duplicatePage = (idx: number) => {
    const clone = { id: uid(), html: pages[idx].html };
    const next = [...pages];
    next.splice(idx + 1, 0, clone);
    setPages(next);
  };
  const movePage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[idx], next[target]] = [next[target], next[idx]];
    setPages(next);
    setActivePageIdx(target);
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    saveSnapshot("Before template");
    setPages([{ id: uid(), html: tpl.content }]);
    setActivePageIdx(0);
    toast({ title: "Template applied", description: tpl.label });
  };

  // Insert element
  const insertElement = (type: string) => {
    const el = pageRefs.current.get(pages[activePageIdx]?.id);
    if (!el) return;
    let html = "";
    if (type === "callout") html = `<div style="border-left:4px solid ${accentColor};padding:12px;margin:12px 0;background:#f8f9fa;border-radius:4px;"><strong>Note:</strong> </div>`;
    if (type === "table") html = `<table style="width:100%;border-collapse:collapse;margin:12px 0;"><tr><th style="border:1px solid #ddd;padding:8px;background:#f0f0f0;">Header 1</th><th style="border:1px solid #ddd;padding:8px;background:#f0f0f0;">Header 2</th><th style="border:1px solid #ddd;padding:8px;background:#f0f0f0;">Header 3</th></tr><tr><td style="border:1px solid #ddd;padding:8px;"></td><td style="border:1px solid #ddd;padding:8px;"></td><td style="border:1px solid #ddd;padding:8px;"></td></tr></table>`;
    if (type === "divider") html = `<hr style="border:none;border-top:2px solid ${accentColor};margin:16px 0;">`;
    if (type === "signature") html = `<div style="margin-top:40px;"><p>___________________________</p><p style="font-size:12px;">Signature / Date</p></div>`;
    if (type === "image") html = `<div style="text-align:center;margin:16px 0;padding:24px;border:2px dashed #ccc;border-radius:8px;color:#999;font-size:13px;">[Image Placeholder — paste or upload an image]</div>`;
    el.focus();
    document.execCommand("insertHTML", false, html);
    syncPage(pages[activePageIdx].id);
  };

  // AI: generate full page
  const aiGenerateFullPage = async (prompt: string) => {
    setAiLoading(true);
    try {
      const systemPrompt = `You are a professional document writer for NotarDex. Generate document content in clean HTML (p, h1-h3, ul, ol, li, strong, em, table, tr, td, th tags). ${clientName ? `Client: ${clientName}.` : ""} ${serviceName ? `Service: ${serviceName}.` : ""} Target length: approximately ${targetLength[0]} characters. Style: professional legal/business.`;
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

  // AI: text action on selection
  const aiTextAction = async (action: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      toast({ title: "Select text first", description: "Highlight text on the page, then try again." });
      return;
    }
    const selectedText = sel.toString();
    if (!selectedText.trim()) return;
    setAiLoading(true);
    try {
      const prompts: Record<string, string> = {
        improve: `Improve this text, keeping the same meaning but making it clearer and more polished:\n\n${selectedText}`,
        formal: `Rewrite this text in a formal, professional tone:\n\n${selectedText}`,
        shorter: `Make this text more concise while keeping key points:\n\n${selectedText}`,
        expand: `Expand this text with more detail and explanation:\n\n${selectedText}`,
        grammar: `Fix grammar, spelling, and punctuation in this text. Return only the corrected text:\n\n${selectedText}`,
      };
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: { messages: [{ role: "system", content: "You are a professional editor. Return only the revised text in clean HTML (p, strong, em tags). No explanations." }, { role: "user", content: prompts[action] || selectedText }] },
      });
      if (resp.error) throw resp.error;
      const result = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const frag = document.createRange().createContextualFragment(sanitizeHtml(result));
      range.insertNode(frag);
      syncPage(pages[activePageIdx].id);
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
      const systemPrompt = `You are DocuDex AI, a document assistant for NotarDex. The user is editing a document titled "${title || "Untitled"}". Current document content:\n\n${currentContent.slice(0, 8000)}\n\nHelp the user edit, draft, or improve their document. When generating content, use clean HTML tags (p, h1-h3, ul, ol, li, strong, em). Be concise and helpful.`;
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

  // Translate
  const translatePage = async (lang: string) => {
    setAiLoading(true);
    try {
      const content = pages[activePageIdx]?.html || "";
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: {
          messages: [
            { role: "system", content: `Translate the following HTML document content to ${LANGUAGES.find(l => l.value === lang)?.label || lang}. Preserve all HTML formatting tags. Return only the translated HTML.` },
            { role: "user", content: content },
          ],
        },
      });
      if (resp.error) throw resp.error;
      const translated = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      saveSnapshot("Before translation");
      setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, html: sanitizeHtml(translated) } : p));
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
    toast({ title: "Restored", description: `Reverted to ${new Date(snapshot.timestamp).toLocaleTimeString()}` });
  };

  // Save
  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      pages.forEach(p => syncPage(p.id));
      await onSave(title, pages);
      saveSnapshot("Saved");
      toast({ title: "Document saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Export .DOC
  const exportDoc = () => {
    const fontFamily = BRAND_FONTS.find(f => f.value === brandFont)?.family || "sans-serif";
    const allHtml = pages.map(p => `<div style="page-break-after:always;">${p.html}</div>`).join("");
    const full = `<html><head><meta charset="utf-8"><style>body{font-family:${fontFamily};font-size:14px;line-height:1.6;color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px;}h1{font-size:24px;}h2{font-size:20px;}h3{font-size:17px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>${allHtml}</body></html>`;
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
    const fontFamily = BRAND_FONTS.find(f => f.value === brandFont)?.family || "sans-serif";
    const allHtml = pages.map(p => `<div style="page-break-after:always;">${p.html}</div>`).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>${title || "DocuDex"}</title><style>body{font-family:${fontFamily};font-size:14px;line-height:1.6;color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px;}h1{font-size:24px;}h2{font-size:20px;}h3{font-size:17px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}@media print{body{padding:0;}}</style></head><body>${allHtml}</body></html>`);
    win.document.close();
    win.print();
  };

  // Apply AI content from preview
  const handleApplyContent = (content: string) => {
    saveSnapshot("Before AI insert");
    setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, html: sanitizeHtml(content) } : p));
    setShowPreview(false);
    toast({ title: "Content applied" });
  };

  const handleRegenerate = async (style: string, format: string) => {
    setIsRegenerating(true);
    try {
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: {
          messages: [
            { role: "system", content: `Generate document content in ${style} style using ${format} format. Output clean HTML. Target length: ${targetLength[0]} characters.` },
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

  // Scroll to page thumbnail
  const scrollToPage = (idx: number) => {
    setActivePageIdx(idx);
    const el = pageRefs.current.get(pages[idx]?.id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const totalChars = charCount(pages);
  const totalWords = pages.reduce((sum, p) => sum + wordCount(p.html), 0);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 shrink-0">
          {/* Left: File actions */}
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-primary" />
            <Input
              className="h-7 w-52 text-sm font-semibold border-none bg-transparent shadow-none focus-visible:ring-0 px-1"
              placeholder="Untitled Document"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleSave} disabled={saving || !onSave}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => saveSnapshot("Undo point")}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save checkpoint</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border" />

          {/* Export */}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={exportDoc}>
            <FileDown className="h-3.5 w-3.5" /> .DOC
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={printDoc}>
            <Printer className="h-3.5 w-3.5" /> PDF
          </Button>

          <div className="flex-1" />

          {/* Client context */}
          {(clientName || serviceName) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
              {clientName && <Badge variant="outline" className="text-[10px]">{clientName}</Badge>}
              {serviceName && <Badge variant="outline" className="text-[10px]">{serviceName}</Badge>}
            </div>
          )}

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(50, z - 10))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* AI Chat toggle */}
          <Button
            variant={showAiChat ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAiChat(!showAiChat)}
          >
            <MessageSquare className="h-3.5 w-3.5" /> AI Chat
          </Button>
        </div>

        {/* ═══ MAIN BODY ═══ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ─── VERTICAL ICON BAR ─── */}
          {!compact && (
            <div className="w-12 shrink-0 border-r border-border bg-card flex flex-col items-center py-2 gap-1">
              {SIDEBAR_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (sidebarTab === tab.id && sidebarOpen) {
                            setSidebarOpen(false);
                          } else {
                            setSidebarTab(tab.id);
                            setSidebarOpen(true);
                          }
                        }}
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                          sidebarTab === tab.id && sidebarOpen
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{tab.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}

          {/* ─── SIDEBAR PANEL ─── */}
          {!compact && sidebarOpen && (
            <div className="w-64 shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold capitalize">{sidebarTab}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSidebarOpen(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  {/* Templates */}
                  {sidebarTab === "templates" && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground">Start from a template</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TEMPLATES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => applyTemplate(t.id)}
                            className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs hover:bg-muted hover:border-primary/30 transition-all group"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
                            <span className="text-[10px] text-center font-medium leading-tight">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Tools */}
                  {sidebarTab === "ai" && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">AI Smart Drafter</p>
                        <Textarea
                          className="text-xs min-h-[60px] resize-none"
                          placeholder="Describe what you want to generate..."
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Target: ~{targetLength[0].toLocaleString()} chars</label>
                        <Slider value={targetLength} onValueChange={setTargetLength} min={500} max={maxChars} step={500} className="mt-1" />
                      </div>
                      <Button size="sm" className="w-full text-xs" onClick={() => aiGenerateFullPage(aiPrompt)} disabled={aiLoading || !aiPrompt.trim()}>
                        {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        Generate Page
                      </Button>

                      <div className="border-t border-border pt-3">
                        <p className="text-[10px] text-muted-foreground mb-2 font-medium">Text Actions <span className="italic">(select text first)</span></p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { action: "improve", label: "✨ Improve" },
                            { action: "formal", label: "👔 Formal" },
                            { action: "shorter", label: "✂️ Shorter" },
                            { action: "expand", label: "📝 Expand" },
                            { action: "grammar", label: "📖 Grammar" },
                          ].map(a => (
                            <Button key={a.action} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => aiTextAction(a.action)} disabled={aiLoading}>
                              {a.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Elements */}
                  {sidebarTab === "elements" && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground mb-2">Insert into current page</p>
                      {[
                        { type: "callout", label: "Callout Box", icon: Quote },
                        { type: "table", label: "Table (3-col)", icon: Table },
                        { type: "divider", label: "Divider", icon: SeparatorHorizontal },
                        { type: "signature", label: "Signature Line", icon: PenLine },
                        { type: "image", label: "Image Placeholder", icon: Image },
                      ].map(el => (
                        <button
                          key={el.type}
                          onClick={() => insertElement(el.type)}
                          className="w-full flex items-center gap-2.5 rounded-lg border border-border p-2.5 text-xs hover:bg-muted hover:border-primary/30 transition-all"
                        >
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                            <el.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{el.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Design */}
                  {sidebarTab === "design" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Typography</label>
                        <Select value={brandFont} onValueChange={setBrandFont}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BRAND_FONTS.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Accent Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {ACCENT_COLORS.map(c => (
                            <button
                              key={c.value}
                              onClick={() => setAccentColor(c.value)}
                              className={cn(
                                "h-8 w-8 rounded-full border-2 transition-all shadow-sm",
                                accentColor === c.value ? "border-foreground scale-110 ring-2 ring-primary/20" : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: c.value }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Page Size</label>
                        <p className="text-[10px] text-muted-foreground">US Letter (8.5" × 11") — 816 × 1056px</p>
                      </div>
                    </div>
                  )}

                  {/* Translate */}
                  {sidebarTab === "translate" && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground mb-2">Translate current page</p>
                      {LANGUAGES.map(l => (
                        <Button key={l.value} variant="outline" size="sm" className="w-full text-xs justify-start h-8" onClick={() => translatePage(l.value)} disabled={aiLoading}>
                          {l.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* History */}
                  {sidebarTab === "history" && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground mb-2">Version snapshots</p>
                      {history.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic text-center py-6">No snapshots yet. Use the checkpoint button to create one.</p>
                      ) : (
                        history.map((snap, i) => (
                          <button
                            key={i}
                            onClick={() => restoreSnapshot(snap)}
                            className="w-full text-left rounded-lg border border-border p-2.5 text-[10px] hover:bg-muted hover:border-primary/30 transition-all"
                          >
                            <div className="font-medium">{snap.label}</div>
                            <div className="text-muted-foreground mt-0.5">{new Date(snap.timestamp).toLocaleTimeString()}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* ─── CANVAS AREA ─── */}
          <div className="flex-1 flex flex-col overflow-hidden relative" ref={canvasRef}>
            {/* Floating format toolbar */}
            {floatingToolbar.visible && (
              <div
                className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-border bg-card shadow-lg px-1.5 py-1 transition-all"
                style={{
                  left: `${Math.max(8, Math.min(floatingToolbar.x - 120, (canvasRef.current?.clientWidth || 400) - 260))}px`,
                  top: `${Math.max(8, floatingToolbar.y)}px`,
                }}
              >
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("bold")}><Bold className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("italic")}><Italic className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("underline")}><Underline className="h-3 w-3" /></Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("justifyLeft")}><AlignLeft className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("justifyCenter")}><AlignCenter className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("justifyRight")}><AlignRight className="h-3 w-3" /></Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("insertUnorderedList")}><List className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => execCmd("insertOrderedList")}><ListOrdered className="h-3 w-3" /></Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Select onValueChange={(v) => execCmd("formatBlock", v)}>
                  <SelectTrigger className="h-6 w-20 text-[10px] border-none shadow-none"><SelectValue placeholder="Style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p">Text</SelectItem>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => aiTextAction("improve")} disabled={aiLoading}>
                  <Sparkles className="h-3 w-3 mr-0.5" /> AI
                </Button>
              </div>
            )}

            {/* Canvas scroll area */}
            <div className="flex-1 overflow-auto bg-muted/40">
              <div className="py-8 px-4 min-h-full flex flex-col items-center">
                {/* AI Content Preview */}
                {showPreview && (
                  <div className="mb-4 w-full max-w-[816px]">
                    <AIContentPreview
                      content={previewContent}
                      onApply={handleApplyContent}
                      onRegenerate={handleRegenerate}
                      onClose={() => setShowPreview(false)}
                      isRegenerating={isRegenerating}
                    />
                  </div>
                )}

                {/* AI loading */}
                {aiLoading && !showPreview && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 w-full max-w-[816px]">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">AI is processing...</span>
                  </div>
                )}

                {/* Pages */}
                <div className="space-y-8" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                  {pages.map((page, idx) => (
                    <div key={page.id} className="relative group">
                      {/* Page controls */}
                      <div className="absolute -left-10 top-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => movePage(idx, -1)} disabled={idx === 0}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Move up</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => movePage(idx, 1)} disabled={idx === pages.length - 1}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Move down</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicatePage(idx)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Duplicate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deletePage(idx)} disabled={pages.length <= 1}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Delete</TooltipContent>
                        </Tooltip>
                      </div>

                      {/* The page canvas */}
                      <div
                        ref={el => { if (el) pageRefs.current.set(page.id, el); }}
                        contentEditable
                        suppressContentEditableWarning
                        className={cn(
                          "bg-white dark:bg-zinc-900 shadow-lg rounded border border-border/50",
                          "min-h-[1056px] w-[816px] p-12 outline-none",
                          "prose prose-sm dark:prose-invert max-w-none",
                          "focus:shadow-xl transition-shadow",
                          idx === activePageIdx && "ring-2 ring-primary/30"
                        )}
                        style={{
                          fontFamily: BRAND_FONTS.find(f => f.value === brandFont)?.family,
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }}
                        onFocus={() => setActivePageIdx(idx)}
                        onInput={() => syncPage(page.id)}
                      />

                      {/* Page label */}
                      <div className="absolute -right-8 top-2 text-[10px] text-muted-foreground font-mono opacity-50">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add page */}
                <div className="mt-6">
                  <Button variant="outline" size="sm" onClick={addPage} className="text-xs gap-1 shadow-sm">
                    <Plus className="h-3.5 w-3.5" /> Add Page
                  </Button>
                </div>
              </div>
            </div>

            {/* ─── PAGE THUMBNAILS BAR ─── */}
            {pages.length > 1 && (
              <div className="h-20 shrink-0 border-t border-border bg-card flex items-center gap-2 px-4 overflow-x-auto">
                {pages.map((page, idx) => (
                  <button
                    key={page.id}
                    onClick={() => scrollToPage(idx)}
                    className={cn(
                      "h-14 w-10 rounded border-2 bg-white dark:bg-zinc-900 shrink-0 overflow-hidden transition-all hover:scale-105",
                      idx === activePageIdx ? "border-primary shadow-md" : "border-border/50"
                    )}
                    title={`Page ${idx + 1}`}
                  >
                    <div
                      className="w-full h-full text-[2px] leading-[2.5px] p-[2px] overflow-hidden pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html).slice(0, 200) }}
                    />
                  </button>
                ))}
                <button
                  onClick={addPage}
                  className="h-14 w-10 rounded border-2 border-dashed border-border shrink-0 flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
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
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-5 text-[10px] text-muted-foreground">
            <span className="font-medium">{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
            <span>{totalWords.toLocaleString()} words</span>
            <span>{readTime(totalWords)} read</span>
            <span>{totalChars.toLocaleString()} / {maxChars.toLocaleString()} chars</span>
            <span>Page {activePageIdx + 1} of {pages.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {totalChars > maxChars * 0.9 && (
              <Badge variant="destructive" className="text-[10px]">Approaching limit</Badge>
            )}
            <div className="flex items-center gap-1">
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={50}
                max={200}
                step={10}
                className="w-24"
              />
              <span className="text-[10px] font-mono w-8 text-right">{zoom}%</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
