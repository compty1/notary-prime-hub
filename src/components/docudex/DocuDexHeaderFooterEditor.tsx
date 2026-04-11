import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/sanitize";

interface HeaderFooterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headerHtml: string;
  footerHtml: string;
  onApply: (header: string, footer: string) => void;
}

const ALIGNMENT_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const VARIABLES = [
  { token: "{{page}}", label: "Page #" },
  { token: "{{total}}", label: "Total Pages" },
];

export function DocuDexHeaderFooterEditor({ open, onOpenChange, headerHtml, footerHtml, onApply }: HeaderFooterEditorProps) {
  const [headerText, setHeaderText] = useState(() => stripTags(headerHtml));
  const [footerText, setFooterText] = useState(() => stripTags(footerHtml));
  const [headerAlign, setHeaderAlign] = useState("left");
  const [footerAlign, setFooterAlign] = useState("center");
  const [showHeader, setShowHeader] = useState(!!headerHtml);
  const [showFooter, setShowFooter] = useState(!!footerHtml);

  function stripTags(html: string) {
    return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  }

  function buildHtml(text: string, align: string) {
    if (!text.trim()) return "";
    return `<p style="text-align:${align};font-size:10px;color:#888;">${sanitizeHtml(text)}</p>`;
  }

  const insertVariable = (setter: (fn: (prev: string) => string) => void, token: string) => {
    setter(prev => prev + token);
  };

  const handleApply = () => {
    onApply(
      showHeader ? buildHtml(headerText, headerAlign) : "",
      showFooter ? buildHtml(footerText, footerAlign) : ""
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Header & Footer</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Header</Label>
              <Switch checked={showHeader} onCheckedChange={setShowHeader} />
            </div>
            {showHeader && (
              <div className="space-y-2 pl-1">
                <Input
                  placeholder="Document title, company name..."
                  value={headerText}
                  onChange={e => setHeaderText(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Select value={headerAlign} onValueChange={setHeaderAlign}>
                    <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALIGNMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {VARIABLES.map(v => (
                      <Badge
                        key={v.token}
                        variant="outline"
                        className="cursor-pointer text-[10px] hover:bg-muted"
                        onClick={() => insertVariable(setHeaderText, v.token)}
                      >
                        + {v.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="border rounded p-2 text-xs text-muted-foreground" style={{ textAlign: headerAlign as any }}>
                  Preview: {headerText.replace("{{page}}", "1").replace("{{total}}", "5") || "(empty)"}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Footer</Label>
              <Switch checked={showFooter} onCheckedChange={setShowFooter} />
            </div>
            {showFooter && (
              <div className="space-y-2 pl-1">
                <Input
                  placeholder="Page {{page}} of {{total}}"
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Select value={footerAlign} onValueChange={setFooterAlign}>
                    <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALIGNMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {VARIABLES.map(v => (
                      <Badge
                        key={v.token}
                        variant="outline"
                        className="cursor-pointer text-[10px] hover:bg-muted"
                        onClick={() => insertVariable(setFooterText, v.token)}
                      >
                        + {v.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="border rounded p-2 text-xs text-muted-foreground" style={{ textAlign: footerAlign as any }}>
                  Preview: {footerText.replace("{{page}}", "1").replace("{{total}}", "5") || "(empty)"}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
