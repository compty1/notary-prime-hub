import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate, Wand2, Table, Palette, Languages, History,
  X, Sparkles, Loader2, Quote, SeparatorHorizontal, PenLine, Image,
  QrCode, FileSignature,
} from "lucide-react";
import { TEMPLATES, BRAND_FONTS, ACCENT_COLORS, LANGUAGES, PAGE_SIZES, LINE_SPACINGS } from "./constants";
import type { Editor } from "@tiptap/react";
import type { HistorySnapshot } from "./types";

const SIDEBAR_TABS = [
  { id: "templates", icon: LayoutTemplate, label: "Templates" },
  { id: "ai", icon: Wand2, label: "AI Tools" },
  { id: "elements", icon: Table, label: "Elements" },
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
  history: HistorySnapshot[];
  onApplyTemplate: (id: string) => void;
  onInsertElement: (type: string) => void;
  onAiGenerate: (prompt: string) => void;
  onAiTextAction: (action: string) => void;
  onTranslate: (lang: string) => void;
  onRestoreSnapshot: (snap: HistorySnapshot) => void;
  aiLoading: boolean;
  maxChars: number;
  compact?: boolean;
}

export function DocuDexSidebar({
  editor, sidebarTab, setSidebarTab, sidebarOpen, setSidebarOpen,
  brandFont, setBrandFont, accentColor, setAccentColor,
  pageSize, setPageSize, lineSpacing, setLineSpacing,
  history, onApplyTemplate, onInsertElement, onAiGenerate, onAiTextAction,
  onTranslate, onRestoreSnapshot, aiLoading, maxChars, compact,
}: SidebarProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [targetLength, setTargetLength] = useState<number[]>([5000]);

  if (compact) return null;

  return (
    <>
      {/* Icon bar */}
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

      {/* Panel */}
      {sidebarOpen && (
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
                        onClick={() => onApplyTemplate(t.id)}
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
                        { action: "shorter", label: "✂️ Shorter" },
                        { action: "expand", label: "📝 Expand" },
                        { action: "grammar", label: "📖 Grammar" },
                      ].map(a => (
                        <Button key={a.action} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => onAiTextAction(a.action)} disabled={aiLoading}>
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
                    { type: "table", label: "Table (3×3)", icon: Table },
                    { type: "divider", label: "Divider", icon: SeparatorHorizontal },
                    { type: "signature", label: "Signature Line", icon: PenLine },
                    { type: "image", label: "Image", icon: Image },
                    { type: "notary-seal", label: "Notary Seal", icon: FileSignature },
                    { type: "qr-code", label: "QR Code", icon: QrCode },
                  ].map(el => (
                    <button
                      key={el.type}
                      onClick={() => onInsertElement(el.type)}
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
                </div>
              )}

              {/* Translate */}
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

              {/* History */}
              {sidebarTab === "history" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground mb-2">Version snapshots</p>
                  {history.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic text-center py-6">No snapshots yet. Changes auto-save periodically.</p>
                  ) : (
                    history.map((snap, i) => (
                      <button
                        key={i}
                        onClick={() => onRestoreSnapshot(snap)}
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
    </>
  );
}
