import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Hash } from "lucide-react";

export interface PageNumberConfig {
  enabled: boolean;
  position: "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";
  format: "numeric" | "roman" | "alpha";
  startFrom: number;
  showOnFirst: boolean;
  prefix: string;
  suffix: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: PageNumberConfig;
  onApply: (config: PageNumberConfig) => void;
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let r = ""; for (let i = 0; i < vals.length; i++) while (n >= vals[i]) { r += syms[i]; n -= vals[i]; } return r;
}

export function formatPageNumber(page: number, config: PageNumberConfig): string {
  const num = page + config.startFrom - 1;
  let formatted: string;
  switch (config.format) {
    case "roman": formatted = toRoman(num).toLowerCase(); break;
    case "alpha": formatted = String.fromCharCode(64 + ((num - 1) % 26 + 1)); break;
    default: formatted = String(num);
  }
  return `${config.prefix}${formatted}${config.suffix}`;
}

export function DocuDexPageNumbering({ open, onOpenChange, config, onApply }: Props) {
  const [local, setLocal] = useState<PageNumberConfig>(config);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Hash className="h-4 w-4" /> Page Numbering</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Enable numbering</Label>
            <Switch checked={local.enabled} onCheckedChange={v => setLocal(prev => ({ ...prev, enabled: v }))} />
          </div>

          <div>
            <Label className="text-xs">Position</Label>
            <Select value={local.position} onValueChange={(v: any) => setLocal(prev => ({ ...prev, position: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="top-center">Top Center</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Format</Label>
            <Select value={local.format} onValueChange={(v: any) => setLocal(prev => ({ ...prev, format: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">1, 2, 3...</SelectItem>
                <SelectItem value="roman">i, ii, iii...</SelectItem>
                <SelectItem value="alpha">A, B, C...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Show on first page</Label>
            <Switch checked={local.showOnFirst} onCheckedChange={v => setLocal(prev => ({ ...prev, showOnFirst: v }))} />
          </div>

          <div className="text-center text-xs text-muted-foreground border rounded p-2">
            Preview: {formatPageNumber(1, local)} · {formatPageNumber(2, local)} · {formatPageNumber(3, local)}
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => { onApply(local); onOpenChange(false); }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
