import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate, Wand2, Table, Palette, Languages, History,
  X, Sparkles, Loader2, Quote, SeparatorHorizontal, PenLine, Image,
  QrCode, FileSignature, Calendar, Clock, CheckSquare, Hash,
  Scale, BookOpen, Search, Eye, ChevronRight, Save, Trash2,
  Stamp, Users, Type as TypeIcon, Tag,
  LayoutGrid, Shapes, Lightbulb, CheckCircle, Plus, AlertTriangle,
} from "lucide-react";
import {
  TEMPLATES, TEMPLATE_CATEGORIES, BRAND_FONTS, ACCENT_COLORS,
  LANGUAGES, PAGE_SIZES, LINE_SPACINGS, MARGIN_PRESETS,
  SPECIAL_CHARACTERS, LEGAL_CLAUSES, PAGE_BACKGROUND_COLORS,
  COMPLIANCE_WATERMARKS,
  type MarginPreset,
} from "./constants";
import type { Editor } from "@tiptap/react";
import type { HistorySnapshot, CustomTemplate } from "./types";
import { DocuDexLayoutsPanel } from "./DocuDexLayoutsPanel";
import { DocuDexShapesPanel } from "./DocuDexShapesPanel";

const SIDEBAR_TABS = [
  { id: "templates", icon: LayoutTemplate, label: "Templates" },
  { id: "layouts", icon: LayoutGrid, label: "Layouts" },
  { id: "ai", icon: Wand2, label: "AI Tools" },
  { id: "recommend", icon: Lightbulb, label: "Recommend" },
  { id: "elements", icon: Table, label: "Elements" },
  { id: "shapes", icon: Shapes, label: "Shapes" },
  { id: "design", icon: Palette, label: "Design" },
  { id: "translate", icon: Languages, label: "Translate" },
  { id: "history", icon: History, label: "History" },
] as const;

interface SidebarProps {
  editor: Editor | null;
  sidebarTab: string;
  setSidebarTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  brandFont: string;
  setBrandFont: (font: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  pageSize: string;
  setPageSize: (size: string) => void;
  lineSpacing: string;
  setLineSpacing: (spacing: string) => void;
  pageMargins: MarginPreset;
  setPageMargins: (margins: MarginPreset) => void;
  pageBgColor: string;
  setPageBgColor: (color: string) => void;
  wordCountGoal: number | null;
  setWordCountGoal: (goal: number | null) => void;
  watermark: string;
  setWatermark: (wm: string) => void;
  headerHtml: string;
  setHeaderHtml: (html: string) => void;
  footerHtml: string;
  setFooterHtml: (html: string) => void;
  history: HistorySnapshot[];
  customTemplates: CustomTemplate[];
  onApplyTemplate: (id: string) => void;
  onInsertElement: (type: string) => void;
  onAiGenerate: (prompt: string) => void;
  onAiTextAction: (action: string) => void;
  onTranslate: (lang: string) => void;
  onRestoreSnapshot: (snap: HistorySnapshot) => void;
  onSaveAsTemplate: () => void;
  onDeleteCustomTemplate: (id: string) => void;
  onNameSnapshot: () => void;
  aiLoading: boolean;
  maxChars: number;
  compact?: boolean;
  isMobile?: boolean;
  recommendations?: { type: "suggestion" | "compliance" | "improvement"; title: string; description: string; insertHtml?: string }[];
  recommendLoading?: boolean;
  onRequestRecommendations?: () => void;
}

export function DocuDexSidebar({
  editor, sidebarTab, setSidebarTab, sidebarOpen, setSidebarOpen,
  brandFont, setBrandFont, accentColor, setAccentColor,
  pageSize, setPageSize, lineSpacing, setLineSpacing,
  pageMargins, setPageMargins, pageBgColor, setPageBgColor,
  wordCountGoal, setWordCountGoal,
  watermark, setWatermark,
  headerHtml, setHeaderHtml, footerHtml, setFooterHtml,
  history, customTemplates, onApplyTemplate, onInsertElement, onAiGenerate, onAiTextAction,
  onTranslate, onRestoreSnapshot, onSaveAsTemplate, onDeleteCustomTemplate,
  onNameSnapshot, aiLoading, maxChars, compact, isMobile,
  recommendations = [], recommendLoading = false, onRequestRecommendations,
}: SidebarProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [targetLength, setTargetLength] = useState<number[]>([5000]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showLegalClauses, setShowLegalClauses] = useState(false);
  const [legalClauseCategory, setLegalClauseCategory] = useState("all");

  const scrollRefs = useRef<Record<string, number>>({});

  // Save/restore scroll position per tab (SB-002)
  useEffect(() => {
    return () => {
      const el = document.querySelector("[data-sidebar-scroll]");
      if (el) scrollRefs.current[sidebarTab] = el.scrollTop;
    };
  }, [sidebarTab]);

  if (compact && !isMobile) return null;

  // Filtered templates (TP-003) — include custom templates
  const allTemplates = [
    ...TEMPLATES,
    ...customTemplates.map(ct => ({ ...ct, icon: ct.icon || "⭐" })),
  ];
  const filteredTemplates = allTemplates.filter(t => {
    const matchCategory = templateCategory === "all" || t.category === templateCategory;
    const matchSearch = !templateSearch || t.label.toLowerCase().includes(templateSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Filtered legal clauses
  const filteredClauses = LEGAL_CLAUSES.filter(c =>
    legalClauseCategory === "all" || c.category === legalClauseCategory
  );

  return (
    <>
      {/* Icon bar */}
      {!isMobile && (
        <div className="w-12 shrink-0 border-r border-border bg-card flex flex-col items-center py-2 gap-1">
          {SIDEBAR_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (sidebarTab === tab.id && sidebarOpen) setSidebarOpen(false);
                      else { setSidebarTab(tab.id); setSidebarOpen(true); }
                    }}
                    aria-label={tab.label}
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

      {/* Mobile tab bar */}
      {isMobile && (
        <div className="flex items-center border-b border-border bg-card overflow-x-auto px-1">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={cn(
                "px-3 py-2 text-[10px] whitespace-nowrap transition-colors",
                sidebarTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Panel */}
      {sidebarOpen && (
        <div className={cn(
          "shrink-0 border-r border-border bg-card overflow-hidden flex flex-col",
          isMobile ? "w-full" : "w-64"
        )}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold capitalize">{sidebarTab}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSidebarOpen(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1" data-sidebar-scroll="">
            <div className="p-3">
              {/* ═══ Templates (TP-001, TP-002, TP-003) ═══ */}
              {sidebarTab === "templates" && (
                <div className="space-y-2">
                  {/* Save as Template (TP-002) */}
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mb-2" onClick={onSaveAsTemplate}>
                    <Save className="h-3 w-3" /> Save Current as Template
                  </Button>
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      className="h-7 text-xs pl-7"
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={e => setTemplateSearch(e.target.value)}
                    />
                  </div>
                  {/* Category filter */}
                  <div className="flex gap-1 flex-wrap">
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setTemplateCategory(cat.value)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] transition-colors",
                          templateCategory === cat.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {/* Template list */}
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTemplates.map(t => {
                      const isCustom = "createdAt" in t;
                      return (
                        <Popover key={t.id}>
                          <PopoverTrigger asChild>
                            <button
                              className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs hover:bg-muted hover:border-primary/30 transition-all group relative"
                            >
                              <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
                              <span className="text-[10px] text-center font-medium leading-tight">{t.label}</span>
                              {isCustom && <span className="absolute top-1 left-1 text-[8px] text-primary">★</span>}
                              <Eye className="h-2.5 w-2.5 absolute top-1 right-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-2" side="right">
                            <div className="text-[10px] font-semibold mb-1">{t.label} Preview</div>
                            <div
                              className="prose prose-xs max-w-none max-h-48 overflow-auto border rounded p-2 text-[9px] bg-card"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.content.slice(0, 500)) }}
                            />
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" className="flex-1 text-xs h-7" onClick={() => onApplyTemplate(t.id)}>
                                Apply
                              </Button>
                              {isCustom && (
                                <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => onDeleteCustomTemplate(t.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                  {filteredTemplates.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-4">No templates match your search.</p>
                  )}
                </div>
              )}

              {/* ═══ Layouts ═══ */}
              {sidebarTab === "layouts" && (
                <DocuDexLayoutsPanel
                  onApplyLayout={(html) => {
                    if (editor) {
                      editor.chain().focus().setContent(html).run();
                    }
                  }}
                />
              )}

              {/* ═══ AI Tools (AI-001 to AI-005) ═══ */}
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
                  <Button size="sm" className="w-full text-xs" onClick={() => onAiGenerate(aiPrompt)} disabled={aiLoading || !aiPrompt.trim()}>
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Generate Page
                  </Button>

                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] text-muted-foreground mb-2 font-medium">Text Actions <span className="italic">(select text first)</span></p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { action: "improve", label: "✨ Improve" },
                        { action: "formal", label: "👔 Formal" },
                        { action: "casual", label: "😊 Casual" },
                        { action: "persuasive", label: "🎯 Persuasive" },
                        { action: "shorter", label: "✂️ Shorter" },
                        { action: "expand", label: "📝 Expand" },
                        { action: "grammar", label: "📖 Grammar" },
                        { action: "summarize", label: "📋 Summarize" },
                      ].map(a => (
                        <Button key={a.action} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => onAiTextAction(a.action)} disabled={aiLoading}>
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Legal Clause Suggestions (AI-005) */}
                  <div className="border-t border-border pt-3">
                    <button
                      className="text-[10px] text-muted-foreground mb-2 font-medium flex items-center gap-1 w-full"
                      onClick={() => setShowLegalClauses(!showLegalClauses)}
                    >
                      <Scale className="h-3 w-3" />
                      Legal Clause Library
                      <ChevronRight className={cn("h-3 w-3 ml-auto transition-transform", showLegalClauses && "rotate-90")} />
                    </button>
                    {showLegalClauses && (
                      <div className="space-y-2">
                        <div className="flex gap-1 flex-wrap">
                          {[{ value: "all", label: "All" }, { value: "legal", label: "Legal" }, { value: "notary", label: "Notary" }].map(cat => (
                            <button
                              key={cat.value}
                              onClick={() => setLegalClauseCategory(cat.value)}
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] transition-colors",
                                legalClauseCategory === cat.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                        {filteredClauses.map(clause => (
                          <button
                            key={clause.id}
                            onClick={() => {
                              if (editor) {
                                editor.chain().focus().insertContent(clause.content).run();
                              }
                            }}
                            className="w-full text-left rounded-lg border border-border p-2 text-[10px] hover:bg-muted hover:border-primary/30 transition-all"
                          >
                            <div className="font-medium flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-primary" />
                              {clause.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ Elements (EL-001 to EL-010) ═══ */}
              {sidebarTab === "elements" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground mb-2">Insert into current page</p>
                  {[
                    { type: "callout", label: "Callout Box", icon: Quote },
                    { type: "table", label: "Table (3×3)", icon: Table },
                    { type: "divider", label: "Divider", icon: SeparatorHorizontal },
                    { type: "signature", label: "Signature Line", icon: PenLine },
                    { type: "image", label: "Image", icon: Image },
                    { type: "notary-seal", label: "Notary Seal", icon: Stamp },
                    { type: "notarization-block", label: "Notarization Block", icon: FileSignature },
                    { type: "witness-block", label: "Witness Block", icon: Users },
                    { type: "qr-code", label: "QR Code", icon: QrCode },
                    { type: "page-number", label: "Page Number", icon: Hash },
                    { type: "date", label: "Date", icon: Calendar },
                    { type: "datetime", label: "Date & Time", icon: Clock },
                    { type: "checkbox", label: "Checkbox ☐", icon: CheckSquare },
                    { type: "checkbox-checked", label: "Checkbox ☑", icon: CheckSquare },
                  ].map(el => (
                    <button
                      key={el.type}
                      onClick={() => onInsertElement(el.type)}
                      className="w-full flex items-center gap-2.5 rounded-lg border border-border p-2.5 text-xs hover:bg-muted hover:border-primary/30 transition-all"
                    >
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <el.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{el.label}</span>
                    </button>
                  ))}

                  {/* Special Characters (EL-009) */}
                  <div className="border-t border-border pt-2 mt-2">
                    <button
                      className="text-[10px] text-muted-foreground mb-2 font-medium flex items-center gap-1 w-full"
                      onClick={() => setShowSpecialChars(!showSpecialChars)}
                    >
                      <TypeIcon className="h-3 w-3" />
                      Special Characters
                      <ChevronRight className={cn("h-3 w-3 ml-auto transition-transform", showSpecialChars && "rotate-90")} />
                    </button>
                    {showSpecialChars && (
                      <div className="grid grid-cols-6 gap-1">
                        {SPECIAL_CHARACTERS.map(sc => (
                          <Tooltip key={sc.char}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => editor?.chain().focus().insertContent(sc.char).run()}
                                className="h-8 w-8 rounded border border-border hover:bg-muted hover:border-primary/30 text-sm flex items-center justify-center transition-colors"
                              >
                                {sc.char}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[10px]">{sc.label}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ Shapes & Visual Blocks ═══ */}
              {sidebarTab === "shapes" && (
                <DocuDexShapesPanel
                  onInsertShape={(html) => {
                    if (editor) {
                      editor.chain().focus().insertContent(html).run();
                    }
                  }}
                />
              )}

              {/* ═══ AI Recommendations ═══ */}
              {sidebarTab === "recommend" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium">AI Document Analysis</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={onRequestRecommendations}
                      disabled={recommendLoading}
                    >
                      {recommendLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                      Analyze
                    </Button>
                  </div>

                  {recommendations.length === 0 && !recommendLoading && (
                    <div className="text-center py-6 space-y-2">
                      <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-[10px] text-muted-foreground">Click "Analyze" to get AI-powered recommendations for your document.</p>
                      <p className="text-[9px] text-muted-foreground italic">Checks completeness, compliance, tone, and suggests improvements.</p>
                    </div>
                  )}

                  {recommendLoading && (
                    <div className="text-center py-6 space-y-2">
                      <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                      <p className="text-[10px] text-muted-foreground">Analyzing your document...</p>
                    </div>
                  )}

                  {recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-2.5 text-[10px] hover:border-primary/30 transition-all space-y-1.5"
                    >
                      <div className="flex items-start gap-1.5">
                        {rec.type === "compliance" && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />}
                        {rec.type === "suggestion" && <Lightbulb className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />}
                        {rec.type === "improvement" && <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />}
                        <div>
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-muted-foreground mt-0.5">{rec.description}</div>
                        </div>
                      </div>
                      {rec.insertHtml && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-6 text-[10px] gap-1"
                          onClick={() => {
                            if (editor && rec.insertHtml) {
                              editor.chain().focus().insertContent(rec.insertHtml).run();
                            }
                          }}
                        >
                          <Plus className="h-2.5 w-2.5" /> Insert Suggestion
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ Design (CS-002, PM-004, PM-005, OC-006) ═══ */}
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
                    <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Line Spacing</label>
                    <Select value={lineSpacing} onValueChange={setLineSpacing}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LINE_SPACINGS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                    <Select value={pageSize} onValueChange={setPageSize}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Margins (PM-004) */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Page Margins</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {MARGIN_PRESETS.map(m => (
                        <button
                          key={m.value}
                          onClick={() => setPageMargins(m)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] border transition-colors",
                            pageMargins.value === m.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Background Color (CS-002, DM-004) */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Page Background</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {PAGE_BACKGROUND_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setPageBgColor(c.value)}
                          className={cn(
                            "h-7 w-7 rounded border-2 transition-all",
                            pageBgColor === c.value ? "border-primary ring-1 ring-primary" : "border-border dark:border-muted-foreground/30 hover:scale-105"
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Compliance Watermark (OC-006) */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Compliance Watermark</label>
                    <Select value={watermark} onValueChange={setWatermark}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPLIANCE_WATERMARKS.map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Headers & Footers (PM-005) — Visual builder */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Header & Footer</label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Header:</span>
                        <span className="flex-1 truncate text-foreground">{headerHtml ? "Configured" : "None"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Footer:</span>
                        <span className="flex-1 truncate text-foreground">{footerHtml ? "Configured" : "None"}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Use the Header & Footer button in the top bar to configure these with a visual editor.</p>
                    </div>
                  </div>

                  {/* Word Count Goal (CE-010) */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">Word Count Goal</label>
                    <div className="flex gap-1.5">
                      <Input
                        className="h-7 text-xs flex-1"
                        type="number"
                        placeholder="e.g. 1000"
                        value={wordCountGoal ?? ""}
                        onChange={e => setWordCountGoal(e.target.value ? parseInt(e.target.value) : null)}
                      />
                      {wordCountGoal && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWordCountGoal(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Translate ═══ */}
              {sidebarTab === "translate" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground mb-2">Translate current page</p>
                  {LANGUAGES.map(l => (
                    <Button key={l.value} variant="outline" size="sm" className="w-full text-xs justify-start h-8" onClick={() => onTranslate(l.value)} disabled={aiLoading}>
                      {l.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* ═══ History (HV-001 to HV-003) ═══ */}
              {sidebarTab === "history" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-[10px] text-muted-foreground flex-1">Version snapshots</p>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={onNameSnapshot}>
                      <Tag className="h-2.5 w-2.5" /> Name Version
                    </Button>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic text-center py-6">No snapshots yet. Changes auto-save periodically.</p>
                  ) : (
                    history.map((snap, i) => (
                      <button
                        key={i}
                        onClick={() => onRestoreSnapshot(snap)}
                        className="w-full text-left rounded-lg border border-border p-2.5 text-[10px] hover:bg-muted hover:border-primary/30 transition-all"
                      >
                        <div className="font-medium">
                          {snap.name || snap.label}
                          {snap.name && <span className="ml-1 text-primary">★</span>}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          {new Date(snap.timestamp).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
}
