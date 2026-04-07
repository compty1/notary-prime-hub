import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, RefreshCw, Wand2 } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const STYLES = [
  { value: "professional", label: "Professional", desc: "Clear, business-appropriate tone" },
  { value: "legal", label: "Legal", desc: "Formal legal language & structure" },
  { value: "casual", label: "Casual", desc: "Friendly, conversational tone" },
  { value: "academic", label: "Academic", desc: "Scholarly, citation-ready" },
  { value: "creative", label: "Creative", desc: "Engaging, narrative style" },
];

const FORMATS = [
  { value: "paragraphs", label: "Paragraphs" },
  { value: "bullets", label: "Bullet Points" },
  { value: "numbered", label: "Numbered List" },
  { value: "headings", label: "With Headings" },
];

const FONTS = [
  { value: "sans", label: "Sans-Serif", cls: "font-sans" },
  { value: "serif", label: "Serif", cls: "font-serif" },
  { value: "mono", label: "Monospace", cls: "font-mono" },
];

interface AIContentPreviewProps {
  content: string;
  onApply: (content: string, style: string) => void;
  onRegenerate: (style: string, format: string) => void;
  onClose: () => void;
  isRegenerating?: boolean;
}

export function AIContentPreview({ content, onApply, onRegenerate, onClose, isRegenerating }: AIContentPreviewProps) {
  const [style, setStyle] = useState("professional");
  const [format, setFormat] = useState("paragraphs");
  const [font, setFont] = useState("sans");

  const fontCls = FONTS.find(f => f.value === font)?.cls || "font-sans";

  return (
    <Card className="border-primary/20 bg-card shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Content Preview</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
        </div>

        {/* Style options */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMATS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Font</label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONTS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Style badges */}
        <div className="flex flex-wrap gap-1">
          {STYLES.map(s => (
            <Badge
              key={s.value}
              variant={s.value === style ? "default" : "outline"}
              className={cn("text-[10px] cursor-pointer transition-colors", s.value === style && "bg-primary")}
              onClick={() => setStyle(s.value)}
            >
              {s.label}
            </Badge>
          ))}
        </div>

        {/* Preview */}
        <div className={cn("rounded-lg border border-border bg-background p-4 max-h-64 overflow-auto text-sm leading-relaxed", fontCls)}>
          {isRegenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground text-xs">Regenerating with {STYLES.find(s => s.value === style)?.label} style...</span>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onApply(content, style)}
            disabled={isRegenerating}
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Apply to Document
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRegenerate(style, format)}
            disabled={isRegenerating}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
