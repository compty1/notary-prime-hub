import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Droplets } from "lucide-react";

interface WatermarkConfig {
  text: string;
  opacity: number;
  angle: number;
  fontSize: number;
  color: string;
  position: "center" | "diagonal" | "top" | "bottom";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (config: WatermarkConfig | null) => void;
  current?: WatermarkConfig | null;
}

const PRESETS: { label: string; config: Partial<WatermarkConfig> }[] = [
  { label: "DRAFT", config: { text: "DRAFT", color: "#ef4444", opacity: 15, angle: -45 } },
  { label: "CONFIDENTIAL", config: { text: "CONFIDENTIAL", color: "#f59e0b", opacity: 12, angle: -30 } },
  { label: "COPY", config: { text: "COPY", color: "#6b7280", opacity: 10, angle: -45 } },
  { label: "SAMPLE", config: { text: "SAMPLE", color: "#3b82f6", opacity: 15, angle: -45 } },
];

export function DocuDexWatermark({ open, onOpenChange, onApply, current }: Props) {
  const [config, setConfig] = useState<WatermarkConfig>(current || {
    text: "DRAFT", opacity: 15, angle: -45, fontSize: 72, color: "#9ca3af", position: "diagonal",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Droplets className="h-4 w-4" /> Watermark Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map(p => (
              <Button key={p.label} variant="outline" size="sm" className="text-xs h-6" onClick={() => setConfig(prev => ({ ...prev, ...p.config }))}>
                {p.label}
              </Button>
            ))}
          </div>

          <div>
            <Label className="text-xs">Text</Label>
            <Input value={config.text} onChange={e => setConfig(prev => ({ ...prev, text: e.target.value }))} className="h-7 text-xs" />
          </div>

          <div>
            <Label className="text-xs">Opacity: {config.opacity}%</Label>
            <Slider value={[config.opacity]} onValueChange={([v]) => setConfig(prev => ({ ...prev, opacity: v }))} min={5} max={50} step={1} />
          </div>

          <div>
            <Label className="text-xs">Rotation: {config.angle}°</Label>
            <Slider value={[config.angle]} onValueChange={([v]) => setConfig(prev => ({ ...prev, angle: v }))} min={-90} max={90} step={5} />
          </div>

          <div>
            <Label className="text-xs">Font Size: {config.fontSize}px</Label>
            <Slider value={[config.fontSize]} onValueChange={([v]) => setConfig(prev => ({ ...prev, fontSize: v }))} min={24} max={144} step={4} />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Color</Label>
              <Input type="color" value={config.color} onChange={e => setConfig(prev => ({ ...prev, color: e.target.value }))} className="h-7" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Position</Label>
              <Select value={config.position} onValueChange={(v: any) => setConfig(prev => ({ ...prev, position: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="relative h-24 border rounded bg-background overflow-hidden flex items-center justify-center">
            <span style={{ color: config.color, opacity: config.opacity / 100, fontSize: Math.min(config.fontSize, 32), transform: `rotate(${config.angle}deg)`, fontWeight: 700 }} className="select-none">
              {config.text}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button variant="outline" size="sm" onClick={() => { onApply(null); onOpenChange(false); }}>Remove</Button>
          <Button size="sm" onClick={() => { onApply(config); onOpenChange(false); }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
