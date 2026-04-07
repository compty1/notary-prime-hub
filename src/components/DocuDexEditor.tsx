import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import LinkExt from "@tiptap/extension-link";
import { Table as TableExt } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import SubScript from "@tiptap/extension-subscript";
import SuperScript from "@tiptap/extension-superscript";
import ImageExt from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import FontFamily from "@tiptap/extension-font-family";
import { FontSize } from "./docudex/FontSizeExtension";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/auditLog";
import { AIContentPreview } from "@/components/AIContentPreview";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";
import {
  FileText, Save, FileDown, Printer, Loader2, MessageSquare,
  ZoomIn, ZoomOut, Send, X, Sparkles, Plus, Maximize2, Minimize2,
  Eye, Copy, Trash2, MoveUp, MoveDown,
} from "lucide-react";
import { DocuDexToolbar } from "./docudex/DocuDexToolbar";
import { DocuDexSidebar } from "./docudex/DocuDexSidebar";
import { DocuDexPageList } from "./docudex/DocuDexPageList";
import { DocuDexFindReplace } from "./docudex/DocuDexFindReplace";
import { DocuDexTableToolbar } from "./docudex/DocuDexTableToolbar";
import { TEMPLATES, BRAND_FONTS, LANGUAGES, PAGE_SIZES, MARGIN_PRESETS, COMPLIANCE_WATERMARKS, DEFAULT_FOOTER } from "./docudex/constants";
import { uid, wordCount, charCount, readTime, readabilityScore } from "./docudex/helpers";
import type { PageData, HistorySnapshot, DocuDexEditorProps, CustomTemplate } from "./docudex/types";

export type { DocuDexEditorProps };
export { type PageData };

// SHA-256 hash for document integrity (OC-003)
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function DocuDexEditor({
  initialPages,
  initialTitle = "",
  onSave,
  maxChars = 500000,
  clientName,
  serviceName,
  compact,
  appointmentId,
  sessionId,
}: DocuDexEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [title, setTitle] = useState(initialTitle);
  const [pages, setPages] = useState<PageData[]>(
    initialPages?.length ? initialPages : [{ id: uid(), html: "<p><br></p>" }]
  );
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [sidebarTab, setSidebarTab] = useState<string>("templates");
  const [sidebarOpen, setSidebarOpen] = useState(!compact && !isMobile);
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
  const [zoom, setZoom] = useState(isMobile ? 60 : 100);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageMargins, setPageMargins] = useState(MARGIN_PRESETS[0]);
  const [pageBgColor, setPageBgColor] = useState("#FFFFFF");
  const [wordCountGoal, setWordCountGoal] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showAltTextDialog, setShowAltTextDialog] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [watermark, setWatermark] = useState("none");
  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState(DEFAULT_FOOTER);
  const [showHeaderFooterEditor, setShowHeaderFooterEditor] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    try { return JSON.parse(safeGetItem("docudex_custom_templates") || "[]"); } catch { return []; }
  });
  const [recentDocs, setRecentDocs] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [showRecentDocs, setShowRecentDocs] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [showVersionNameDialog, setShowVersionNameDialog] = useState(false);
  const [pendingSnapshot, setPendingSnapshot] = useState<HistorySnapshot | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  const currentPageSize = PAGE_SIZES.find(s => s.value === pageSize) || PAGE_SIZES[0];
  const fontFamily = BRAND_FONTS.find(f => f.value === brandFont)?.family || "sans-serif";

  // Screen reader announcement helper (A11-003)
  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = "";
      requestAnimationFrame(() => {
        if (announcerRef.current) announcerRef.current.textContent = message;
      });
    }
  }, []);

  // Mobile auto-scale (MB-001)
  useEffect(() => {
    if (isMobile) {
      setZoom(Math.min(60, Math.floor((window.innerWidth - 32) / currentPageSize.width * 100)));
      setSidebarOpen(false);
    }
  }, [isMobile, currentPageSize.width]);

  // First-time onboarding check (UX-003)
  useEffect(() => {
    const seen = localStorage.getItem("docudex_onboarding_seen");
    if (!seen && !compact) {
      setShowOnboarding(true);
      localStorage.setItem("docudex_onboarding_seen", "true");
    }
  }, [compact]);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] }, horizontalRule: false }),
      UnderlineExt,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      LinkExt.configure({ openOnClick: false }),
      TableExt.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      SubScript,
      SuperScript,
      ImageExt.configure({ inline: false, allowBase64: true }),
      HorizontalRule,
      Placeholder.configure({ placeholder: "Start typing or select a template..." }),
    ],
    content: pages[activePageIdx]?.html || "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, html } : p));
      setIsDirty(true);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      // Cursor position tracking (ST-002)
      const { from } = ed.state.selection;
      const resolved = ed.state.doc.resolve(from);
      const line = resolved.depth > 0 ? resolved.index(0) + 1 : 1;
      const parentOffset = resolved.parentOffset;
      setCursorPosition({ line, col: parentOffset + 1 });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full docudex-editor-content",
        style: `font-family: ${fontFamily}; line-height: ${lineSpacing};`,
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files?.length) {
          event.preventDefault();
          Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
              promptAltText(file);
            }
          });
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        // SC-001: Sanitize pasted HTML content with DOMPurify
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) promptAltText(file);
              return true;
            }
          }
        }
        // Sanitize any HTML being pasted
        const html = event.clipboardData?.getData("text/html");
        if (html) {
          event.preventDefault();
          const clean = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "table", "tr", "td", "th", "thead", "tbody", "blockquote", "hr", "img", "span", "sub", "sup", "code", "pre"],
            ALLOWED_ATTR: ["href", "src", "alt", "style", "class", "target", "colspan", "rowspan"],
            FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
            FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
          });
          // Insert via TipTap's safe content insertion
          if (editor) {
            editor.chain().focus().insertContent(clean).run();
          }
          return true;
        }
        return false;
      },
    },
  });

  // Sync editor content when switching pages (CE-005)
  useEffect(() => {
    if (editor && pages[activePageIdx]) {
      const currentContent = editor.getHTML();
      if (currentContent !== pages[activePageIdx].html) {
        editor.commands.setContent(pages[activePageIdx].html || "");
      }
    }
  }, [activePageIdx, editor]);

  // Update editor font/spacing when changed
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: {
            class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full docudex-editor-content",
            style: `font-family: ${fontFamily}; line-height: ${lineSpacing};`,
          },
        },
      });
    }
  }, [fontFamily, lineSpacing, editor]);

  // Keyboard shortcuts (CE-007)
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
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPrintPreview(true);
      }
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pages, title]);

  // Auto-save every 30 seconds (CE-006)
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (isDirty && onSave && user) {
        saveSnapshot("Auto-save");
        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
        announce("Document auto-saved");
      }
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [isDirty, onSave, user, announce]);

  // Unsaved changes warning (CE-006)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Alt text prompt for images (A11-006)
  const promptAltText = (file: File) => {
    setPendingImageFile(file);
    setAltText(file.name.replace(/\.[^.]+$/, ""));
    setShowAltTextDialog(true);
  };

  const confirmImageUpload = async () => {
    if (pendingImageFile) {
      await handleImageFile(pendingImageFile, altText);
    }
    setShowAltTextDialog(false);
    setPendingImageFile(null);
    setAltText("");
  };

  // Image upload (EL-001)
  const handleImageFile = useCallback(async (file: File, alt: string = "") => {
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
      editor.chain().focus().setImage({ src: urlData.publicUrl, alt: alt || file.name }).run();
      announce("Image inserted");
    }
  }, [editor, user, toast, announce]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) promptAltText(file);
    };
    input.click();
  }, []);

  // Save snapshot (HV-001, HV-003: with optional name)
  const saveSnapshot = useCallback((label: string = "Manual save", name?: string) => {
    setHistory(prev => [
      { timestamp: new Date().toISOString(), pages: pages.map(p => ({ ...p })), label, name },
      ...prev.slice(0, 49),
    ]);
  }, [pages]);

  // Page CRUD
  const addPage = () => {
    const newPage = { id: uid(), html: "<p><br></p>" };
    setPages(prev => [...prev, newPage]);
    setActivePageIdx(pages.length);
    announce(`Page ${pages.length + 1} added`);
  };
  const deletePage = (idx: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== idx));
    if (activePageIdx >= idx && activePageIdx > 0) setActivePageIdx(activePageIdx - 1);
    announce(`Page ${idx + 1} deleted`);
  };
  const duplicatePage = () => {
    const clone = { id: uid(), html: pages[activePageIdx].html };
    const next = [...pages];
    next.splice(activePageIdx + 1, 0, clone);
    setPages(next);
    setActivePageIdx(activePageIdx + 1);
    announce("Page duplicated");
  };

  const movePage = (direction: "up" | "down") => {
    const newIdx = direction === "up" ? activePageIdx - 1 : activePageIdx + 1;
    if (newIdx < 0 || newIdx >= pages.length) return;
    const next = [...pages];
    [next[activePageIdx], next[newIdx]] = [next[newIdx], next[activePageIdx]];
    setPages(next);
    setActivePageIdx(newIdx);
    announce(`Page moved ${direction}`);
  };

  // Apply template (TP-001)
  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    saveSnapshot("Before template");
    setPages([{ id: uid(), html: tpl.content }]);
    setActivePageIdx(0);
    if (editor) editor.commands.setContent(tpl.content);
    toast({ title: "Template applied", description: tpl.label });
    announce(`Template ${tpl.label} applied`);
  };

  // Insert element
  const insertElement = (type: string) => {
    if (!editor) return;
    if (type === "table") {
      (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      announce("Table inserted");
      return;
    }
    let html = "";
    if (type === "callout") html = `<blockquote><p><strong>Note:</strong> Enter your note here</p></blockquote>`;
    if (type === "divider") html = `<hr>`;
    if (type === "signature") html = `<p style="margin-top:40px">___________________________<br><em>Signature / Date</em></p>`;
    if (type === "image") { handleImageUpload(); return; }
    if (type === "notary-seal") html = `<div style="border:2px solid #1E293B;padding:16px;margin:16px 0;text-align:center;border-radius:8px;"><p><strong>NOTARY SEAL</strong></p><p>State of Ohio</p><p>Commission #: ____________</p><p>Expires: ____________</p></div>`;
    if (type === "qr-code") html = `<p style="text-align:center;padding:16px;border:1px dashed #ccc;margin:16px 0;">[QR Code — Use export to embed]</p>`;
    if (type === "page-number") html = `<p style="text-align:center;font-size:10px;color:#666;">Page ${activePageIdx + 1} of ${pages.length}</p>`;
    if (type === "date") html = `<p>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>`;
    if (type === "datetime") html = `<p>${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>`;
    if (type === "checkbox") html = `<p>☐ </p>`;
    if (type === "checkbox-checked") html = `<p>☑ </p>`;
    if (type === "witness-block") html = `<p><br></p><p><strong>WITNESSES:</strong></p><p>Witness 1: ___________________________ Date: _______________</p><p>Witness 2: ___________________________ Date: _______________</p>`;
    if (type === "notarization-block") html = `<div style="border:1px solid #333;padding:16px;margin:16px 0;"><p><strong>NOTARIZATION</strong></p><p><strong>State of Ohio</strong><br>County of ____________</p><p>Before me, the undersigned notary public, on this ___ day of ____________, 20___, personally appeared ____________.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p></div>`;
    if (html) {
      editor.chain().focus().insertContent(html).run();
      announce(`${type.replace(/-/g, " ")} inserted`);
    }
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
        summarize: `Provide a brief executive summary of this text in 2-3 sentences:\n\n${selectedText}`,
        casual: `Rewrite this text in a casual, friendly tone:\n\n${selectedText}`,
        persuasive: `Rewrite this text in a persuasive, compelling tone:\n\n${selectedText}`,
      };
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: { messages: [{ role: "system", content: "You are a professional editor. Return only the revised text. No explanations." }, { role: "user", content: prompts[action] || selectedText }] },
      });
      if (resp.error) throw resp.error;
      const result = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, sanitizeHtml(result)).run();
      toast({ title: "Text updated", description: `${action} applied successfully.` });
      announce(`Text ${action} complete`);
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

  // Insert AI response at cursor (AI-001)
  const insertAiResponse = (content: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(sanitizeHtml(content)).run();
    toast({ title: "Content inserted" });
    announce("AI content inserted at cursor");
  };

  // Translate (AI-007)
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
      announce("Translation complete");
    } catch (e: any) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Restore history (HV-002)
  const restoreSnapshot = (snapshot: HistorySnapshot) => {
    saveSnapshot("Before restore");
    setPages(snapshot.pages.map(p => ({ ...p })));
    setActivePageIdx(0);
    if (editor) editor.commands.setContent(snapshot.pages[0]?.html || "");
    toast({ title: "Restored", description: `Reverted to ${snapshot.name || new Date(snapshot.timestamp).toLocaleTimeString()}` });
    announce("Version restored");
  };

  // Name a snapshot (HV-003)
  const nameSnapshot = (label: string) => {
    saveSnapshot(label, label);
    setShowVersionNameDialog(false);
    setVersionName("");
    toast({ title: "Version saved", description: `"${label}" snapshot created.` });
    announce(`Version "${label}" saved`);
  };

  // Save as custom template (TP-002)
  const saveAsTemplate = () => {
    const templateName = window.prompt("Template name:", title || "Custom Template");
    if (!templateName) return;
    const newTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      label: templateName,
      icon: "⭐",
      category: "personal",
      content: pages.map(p => p.html).join("\n<!-- page-break -->\n"),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    safeSetItem("docudex_custom_templates", JSON.stringify(updated));
    toast({ title: "Template saved", description: `"${templateName}" added to your templates.` });
    announce("Custom template saved");
  };

  // Delete custom template
  const deleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    safeSetItem("docudex_custom_templates", JSON.stringify(updated));
    toast({ title: "Template deleted" });
  };

  // Load recent documents (UX-004)
  useEffect(() => {
    if (!user) return;
    const loadRecent = async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, file_name, updated_at")
        .eq("uploaded_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (data) {
        setRecentDocs(data.map(d => ({ id: d.id, title: d.file_name, updatedAt: d.updated_at })));
      }
    };
    loadRecent();
  }, [user]);

  // Build export HTML with headers/footers/watermark (PM-005, OC-006)
  const buildExportHtml = (forPrint = false) => {
    const watermarkStyle = watermark !== "none"
      ? `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:100px;opacity:0.08;font-weight:bold;color:#888;pointer-events:none;z-index:9999;`
      : "";
    const watermarkDiv = watermark !== "none" ? `<div style="${watermarkStyle}">${watermark.toUpperCase()}</div>` : "";
    return pages.map((p, i) => {
      const hdr = (headerHtml || "").replace("{{page}}", String(i + 1)).replace("{{total}}", String(pages.length));
      const ftr = (footerHtml || "").replace("{{page}}", String(i + 1)).replace("{{total}}", String(pages.length));
      return `<div style="page-break-after:${i < pages.length - 1 ? "always" : "auto"};position:relative;">${watermarkDiv}${hdr ? `<div style="margin-bottom:12px;">${hdr}</div>` : ""}${p.html}${ftr ? `<div style="margin-top:12px;">${ftr}</div>` : ""}</div>`;
    }).join("");
  };

  // Save with document hash (OC-003, OC-004, OC-005)
  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(title, pages);
      saveSnapshot("Saved");
      setIsDirty(false);
      setLastSaved(new Date().toLocaleTimeString());

      // Generate document hash for integrity verification (OC-003)
      const combinedContent = pages.map(p => p.html).join("");
      const docHash = await hashContent(combinedContent);

      // Log save to audit trail (SC-003, EX-009) with compliance linking (OC-004/005)
      logAuditEvent("document_save", {
        entityType: "docudex_document",
        details: {
          title: title || "Untitled",
          pageCount: pages.length,
          charCount: charCount(pages),
          documentHash: docHash,
          ...(appointmentId ? { appointmentId } : {}),
          ...(sessionId ? { ronSessionId: sessionId } : {}),
          watermark: watermark !== "none" ? watermark : undefined,
        },
      });

      toast({ title: "Document saved" });
      announce("Document saved successfully");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Export .DOC (EX-001 - with headers/footers/watermark)
  const exportDoc = () => {
    const allHtml = buildExportHtml();
    const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]--><style>body{font-family:${fontFamily};font-size:14px;line-height:${lineSpacing};color:#1a1a1a;max-width:700px;margin:0 auto;padding:${pageMargins.top}px ${pageMargins.right}px ${pageMargins.bottom}px ${pageMargins.left}px;}h1{font-size:24px;}h2{font-size:20px;}h3{font-size:17px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}@page{margin:1in;}</style></head><body>${allHtml}</body></html>`;
    const blob = new Blob([full], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "DocuDex-Document"}.doc`;
    a.click();
    URL.revokeObjectURL(url);

    logAuditEvent("document_export", {
      entityType: "docudex_document",
      details: { title, format: "doc", pageCount: pages.length },
    });
    announce("Document exported as DOC");
  };

  // Print/PDF (EX-002 - with headers/footers/watermark)
  const printDoc = () => {
    const allHtml = buildExportHtml(true);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>${title || "DocuDex"}</title><style>body{font-family:${fontFamily};font-size:14px;line-height:${lineSpacing};color:#1a1a1a;max-width:700px;margin:0 auto;padding:${pageMargins.top}px ${pageMargins.right}px ${pageMargins.bottom}px ${pageMargins.left}px;}h1{font-size:24px;}h2{font-size:20px;}h3{font-size:17px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}@media print{body{padding:0;}@page{margin:1in;}}</style></head><body>${allHtml}</body></html>`);
    win.document.close();
    win.print();

    logAuditEvent("document_export", {
      entityType: "docudex_document",
      details: { title, format: "pdf", pageCount: pages.length },
    });
    announce("Print dialog opened");
  };

  // Export as plain text
  const exportTxt = () => {
    const text = pages.map(p => stripHtml(p.html)).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "DocuDex-Document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    announce("Document exported as TXT");
  };

  // Export as HTML
  const exportHtml = () => {
    const allHtml = pages.map(p => p.html).join("\n<!-- page-break -->\n");
    const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || "DocuDex"}</title><style>body{font-family:${fontFamily};font-size:14px;line-height:${lineSpacing};color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>${allHtml}</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "DocuDex-Document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    announce("Document exported as HTML");
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

  // Context menu handler (UX-001)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const totalChars = charCount(pages);
  const totalWords = pages.reduce((sum, p) => sum + wordCount(p.html), 0);
  const plainText = pages.map(p => stripHtml(p.html)).join(" ");
  const { score: readScore, level: readLevel } = readabilityScore(plainText);
  const wordGoalProgress = wordCountGoal ? Math.min(100, Math.round((totalWords / wordCountGoal) * 100)) : null;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-background", isFullscreen && "fixed inset-0 z-50")}>
        {/* ═══ ONBOARDING TOOLTIP ═══ */}
        {showOnboarding && (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-md space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Welcome to DocuDex</h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Your professional document studio. Here's a quick overview:</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li><strong>Templates</strong> — Start from Ohio notary certificates, contracts, and more</li>
                  <li><strong>AI Tools</strong> — Generate, improve, or translate content with AI</li>
                  <li><strong>Elements</strong> — Insert tables, images, signature lines, seals</li>
                  <li><strong>Design</strong> — Change fonts, spacing, page size, and margins</li>
                  <li><strong>Keyboard shortcuts:</strong> Ctrl+S (save), Ctrl+F (find), Ctrl+P (print), F11 (fullscreen)</li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => setShowOnboarding(false)}>Get Started</Button>
            </div>
          </div>
        )}

        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center gap-1 md:gap-2 border-b border-border bg-card px-2 md:px-3 py-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <FileText className="h-4 w-4 text-primary hidden md:block" />
            <Input
              className="h-7 w-32 md:w-52 text-sm font-semibold border-none bg-transparent shadow-none focus-visible:ring-0 px-1"
              placeholder="Untitled Document"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="Document title"
            />
          </div>

          <div className="h-4 w-px bg-border shrink-0 hidden md:block" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" onClick={handleSave} disabled={saving || !onSave}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (Ctrl+S)</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border shrink-0 hidden md:block" />

          {/* Export buttons with dropdown on mobile */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={exportDoc}>
              <FileDown className="h-3.5 w-3.5" /> <span className="hidden md:inline">.DOC</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={printDoc}>
              <Printer className="h-3.5 w-3.5" /> <span className="hidden md:inline">PDF</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hidden md:flex" onClick={exportHtml}>
              HTML
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hidden md:flex" onClick={exportTxt}>
              TXT
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hidden md:flex" onClick={() => setShowPrintPreview(true)}>
              <Eye className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Preview</span>
            </Button>
          </div>

          <div className="flex-1" />

          {/* Save status (ST-005) */}
          <span className="text-[10px] text-muted-foreground shrink-0 hidden md:inline">
            {saving ? "Saving..." : isDirty ? "Unsaved changes" : lastSaved ? `Saved ${lastSaved}` : ""}
          </span>

          {(clientName || serviceName) && (
            <div className="items-center gap-2 text-xs text-muted-foreground mr-2 hidden lg:flex">
              {clientName && <Badge variant="outline" className="text-[10px]">{clientName}</Badge>}
              {serviceName && <Badge variant="outline" className="text-[10px]">{serviceName}</Badge>}
            </div>
          )}

          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(30, z - 10))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono w-8 md:w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setIsFullscreen(f => !f)}>
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Fullscreen (F11)"}</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border shrink-0" />

          <Button
            variant={showAiChat ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1 shrink-0"
            onClick={() => setShowAiChat(!showAiChat)}
          >
            <MessageSquare className="h-3.5 w-3.5" /> <span className="hidden md:inline">AI Chat</span>
          </Button>
        </div>

        {/* ═══ TOOLBAR (MB-002: overflow scroll on mobile) ═══ */}
        <DocuDexToolbar
          editor={editor}
          brandFont={brandFont}
          onBrandFontChange={setBrandFont}
          onImageUpload={handleImageUpload}
          onFindReplace={() => setShowFindReplace(f => !f)}
        />

        {/* Find & Replace (FR-001, FR-002) */}
        {showFindReplace && (
          <DocuDexFindReplace
            editor={editor}
            onClose={() => setShowFindReplace(false)}
            pageContents={pages.map(p => p.html)}
          />
        )}

        {/* ═══ MAIN BODY ═══ */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (SB-003: collapsible) */}
          {!isMobile && (
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
              pageMargins={pageMargins}
              setPageMargins={setPageMargins}
              pageBgColor={pageBgColor}
              setPageBgColor={setPageBgColor}
              wordCountGoal={wordCountGoal}
              setWordCountGoal={setWordCountGoal}
              watermark={watermark}
              setWatermark={setWatermark}
              headerHtml={headerHtml}
              setHeaderHtml={setHeaderHtml}
              footerHtml={footerHtml}
              setFooterHtml={setFooterHtml}
              history={history}
              customTemplates={customTemplates}
              onApplyTemplate={applyTemplate}
              onInsertElement={insertElement}
              onAiGenerate={aiGenerateFullPage}
              onAiTextAction={aiTextAction}
              onTranslate={translatePage}
              onRestoreSnapshot={restoreSnapshot}
              onSaveAsTemplate={saveAsTemplate}
              onDeleteCustomTemplate={deleteCustomTemplate}
              onNameSnapshot={() => setShowVersionNameDialog(true)}
              aiLoading={aiLoading}
              maxChars={maxChars}
              compact={compact}
            />
          )}

          {/* ─── CANVAS AREA ─── */}
          <div
            className="flex-1 flex flex-col overflow-hidden relative"
            ref={canvasRef}
            onContextMenu={handleContextMenu}
          >
            <div className="flex-1 overflow-auto bg-muted/40 docudex-canvas-area">
              <div className="py-4 md:py-8 px-2 md:px-4 min-h-full flex flex-col items-center">
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

                {/* Page actions bar */}
                <div className="flex items-center gap-1 mb-2" style={{ maxWidth: currentPageSize.width * (zoom / 100) }}>
                  <span className="text-[10px] text-muted-foreground mr-auto">Page {activePageIdx + 1} of {pages.length}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={duplicatePage}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate Page</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => movePage("up")} disabled={activePageIdx === 0}>
                        <MoveUp className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Move Page Up</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => movePage("down")} disabled={activePageIdx === pages.length - 1}>
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Move Page Down</TooltipContent>
                  </Tooltip>
                  {pages.length > 1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deletePage(activePageIdx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Page</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Editor Canvas (DM-001: dark mode aware, OC-006: watermark, PM-005: header/footer) */}
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                  <div
                    className={cn(
                      "docudex-canvas shadow-lg rounded border border-border/50 relative",
                      "outline-none focus-within:shadow-xl transition-shadow ring-2 ring-primary/30"
                    )}
                    style={{
                      width: currentPageSize.width,
                      minHeight: currentPageSize.height,
                      backgroundColor: pageBgColor,
                      color: pageBgColor === "#1E293B" || pageBgColor === "#111827" ? "#e2e8f0" : undefined,
                      padding: `${pageMargins.top}px ${pageMargins.right}px ${pageMargins.bottom}px ${pageMargins.left}px`,
                    }}
                  >
                    {/* Watermark overlay (OC-006) */}
                    {watermark !== "none" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ opacity: 0.06 }}>
                        <span className="text-7xl font-bold transform -rotate-45 select-none" style={{ color: pageBgColor === "#1E293B" || pageBgColor === "#111827" ? "#fff" : "#000" }}>
                          {watermark.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Header (PM-005) */}
                    {headerHtml && (
                      <div className="text-[10px] text-muted-foreground mb-2 border-b border-border/30 pb-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerHtml.replace("{{page}}", String(activePageIdx + 1)).replace("{{total}}", String(pages.length))) }} />
                    )}
                    <EditorContent editor={editor} />
                    {/* Footer (PM-005) */}
                    {footerHtml && (
                      <div className="text-[10px] text-muted-foreground mt-2 border-t border-border/30 pt-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(footerHtml.replace("{{page}}", String(activePageIdx + 1)).replace("{{total}}", String(pages.length))) }} />
                    )}
                  </div>

                  {/* Page break indicator (PM-006) */}
                  {activePageIdx < pages.length - 1 && (
                    <div className="flex items-center gap-2 my-2 opacity-50">
                      <div className="flex-1 border-t border-dashed border-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">Page Break</span>
                      <div className="flex-1 border-t border-dashed border-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Add page */}
                <div className="mt-6">
                  <Button variant="outline" size="sm" onClick={addPage} className="text-xs gap-1 shadow-sm">
                    <Plus className="h-3.5 w-3.5" /> Add Page
                  </Button>
                </div>
              </div>
            </div>

            {/* Page thumbnails with drag-and-drop (DD-001, PM-001) */}
            <DocuDexPageList
              pages={pages}
              activePageIdx={activePageIdx}
              onPageSelect={setActivePageIdx}
              onAddPage={addPage}
              onReorder={setPages}
            />

            {/* Context Menu (UX-001) */}
            {contextMenu && (
              <div
                className="fixed z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={e => e.stopPropagation()}
              >
                {editor && (
                  <>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { editor.chain().focus().toggleBold().run(); setContextMenu(null); }}>
                      Bold
                    </button>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { editor.chain().focus().toggleItalic().run(); setContextMenu(null); }}>
                      Italic
                    </button>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { editor.chain().focus().toggleUnderline().run(); setContextMenu(null); }}>
                      Underline
                    </button>
                    <div className="border-t border-border my-1" />
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { document.execCommand("copy"); setContextMenu(null); }}>
                      Copy
                    </button>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { document.execCommand("paste"); setContextMenu(null); }}>
                      Paste
                    </button>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { editor.chain().focus().selectAll().run(); setContextMenu(null); }}>
                      Select All
                    </button>
                    <div className="border-t border-border my-1" />
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { editor.chain().focus().clearNodes().unsetAllMarks().run(); setContextMenu(null); }}>
                      Clear Formatting
                    </button>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { insertElement("divider"); setContextMenu(null); }}>
                      Insert Divider
                    </button>
                    <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted" onClick={() => { handleImageUpload(); setContextMenu(null); }}>
                      Insert Image
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ─── AI CHAT PANEL ─── */}
          {showAiChat && (
            <div className={cn("shrink-0 border-l border-border bg-card flex flex-col", isMobile ? "w-full absolute inset-0 z-30" : "w-80")}>
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

        {/* ═══ STATUS BAR (ST-001 to ST-005) ═══ */}
        <div className="flex items-center justify-between border-t border-border bg-card px-2 md:px-4 py-1.5 shrink-0 overflow-x-auto" role="status" aria-live="polite">
          <div className="flex items-center gap-3 md:gap-5 text-[10px] text-muted-foreground whitespace-nowrap">
            <span className="font-medium">{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
            <span>{totalWords.toLocaleString()} words</span>
            {wordGoalProgress !== null && (
              <span className={wordGoalProgress >= 100 ? "text-green-600" : ""}>
                Goal: {wordGoalProgress}%
              </span>
            )}
            <span className="hidden md:inline">{readTime(totalWords)} read</span>
            <span className="hidden md:inline">{totalChars.toLocaleString()} / {maxChars.toLocaleString()} chars</span>
            <span>Pg {activePageIdx + 1}/{pages.length}</span>
            <span className="hidden md:inline">Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
            <span className="hidden lg:inline" title={`Flesch-Kincaid: ${readScore}`}>Readability: {readLevel}</span>
            <span className="hidden md:inline">{zoom}%</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Save status indicator (ST-005) */}
            <span className="text-[10px] text-muted-foreground md:hidden">
              {saving ? "Saving..." : isDirty ? "●" : ""}
            </span>
            {totalChars > maxChars * 0.9 && (
              <Badge variant="destructive" className="text-[10px]">Approaching limit</Badge>
            )}
          </div>
        </div>

        {/* Screen reader announcements (A11-003) */}
        <div className="sr-only" aria-live="polite" ref={announcerRef} />

        {/* Print Preview Dialog (EX-004) */}
        <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Print Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {pages.map((page, i) => (
                <div
                  key={page.id}
                  className="bg-white text-black shadow-md mx-auto border"
                  style={{
                    width: currentPageSize.width * 0.7,
                    minHeight: currentPageSize.height * 0.7,
                    padding: `${pageMargins.top * 0.7}px ${pageMargins.right * 0.7}px ${pageMargins.bottom * 0.7}px ${pageMargins.left * 0.7}px`,
                    fontFamily,
                    fontSize: "10px",
                    lineHeight: lineSpacing,
                  }}
                >
                  <div className="prose prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }} />
                  <div className="text-center text-[8px] text-gray-400 mt-4 pt-2 border-t">
                    Page {i + 1} of {pages.length}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrintPreview(false)}>Close</Button>
              <Button onClick={() => { setShowPrintPreview(false); printDoc(); }}>Print / Save as PDF</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alt Text Dialog (A11-006) */}
        <Dialog open={showAltTextDialog} onOpenChange={setShowAltTextDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Image Alt Text</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Provide a description for accessibility.</p>
            <Input
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Describe this image..."
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") confirmImageUpload(); }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAltTextDialog(false); setPendingImageFile(null); }}>Cancel</Button>
              <Button onClick={confirmImageUpload}>Insert Image</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version Name Dialog (HV-003) */}
        <Dialog open={showVersionNameDialog} onOpenChange={setShowVersionNameDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Name This Version</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Give this snapshot a descriptive name for easy identification.</p>
            <Input
              value={versionName}
              onChange={e => setVersionName(e.target.value)}
              placeholder="e.g. Final Draft, After Review..."
              autoFocus
              onKeyDown={e => { if (e.key === "Enter" && versionName.trim()) nameSnapshot(versionName.trim()); }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVersionNameDialog(false)}>Cancel</Button>
              <Button onClick={() => { if (versionName.trim()) nameSnapshot(versionName.trim()); }} disabled={!versionName.trim()}>Save Version</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-20 right-4 z-30 h-10 w-10 rounded-full p-0 shadow-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile sidebar as overlay (MB-004) */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative ml-auto w-80 max-w-[85vw] bg-card border-l border-border">
              <DocuDexSidebar
                editor={editor}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                sidebarOpen={true}
                setSidebarOpen={setSidebarOpen}
                brandFont={brandFont}
                setBrandFont={setBrandFont}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                pageSize={pageSize}
                setPageSize={setPageSize}
                lineSpacing={lineSpacing}
                setLineSpacing={setLineSpacing}
                pageMargins={pageMargins}
                setPageMargins={setPageMargins}
                pageBgColor={pageBgColor}
                setPageBgColor={setPageBgColor}
                wordCountGoal={wordCountGoal}
                setWordCountGoal={setWordCountGoal}
                watermark={watermark}
                setWatermark={setWatermark}
                headerHtml={headerHtml}
                setHeaderHtml={setHeaderHtml}
                footerHtml={footerHtml}
                setFooterHtml={setFooterHtml}
                history={history}
                customTemplates={customTemplates}
                onApplyTemplate={applyTemplate}
                onInsertElement={insertElement}
                onAiGenerate={aiGenerateFullPage}
                onAiTextAction={aiTextAction}
                onTranslate={translatePage}
                onRestoreSnapshot={restoreSnapshot}
                onSaveAsTemplate={saveAsTemplate}
                onDeleteCustomTemplate={deleteCustomTemplate}
                onNameSnapshot={() => setShowVersionNameDialog(true)}
                aiLoading={aiLoading}
                maxChars={maxChars}
                compact={false}
                isMobile={true}
              />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
