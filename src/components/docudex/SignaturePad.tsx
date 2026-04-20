/**
 * P2-005: Signature element (draw/type/upload modes)
 */
import { useRef, useState, useEffect } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PenTool, Type, Upload, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  className?: string;
}

export function SignaturePad({ onSave, onCancel, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("");
  const [typedFont, setTypedFont] = useState("'Dancing Script', cursive");

  useEffect(() => {
    if (mode !== "draw" || !canvasRef.current) return;
    const pad = new SignaturePadLib(canvasRef.current, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "#000000",
      minWidth: 1.5,
      maxWidth: 3,
    });
    padRef.current = pad;

    // Handle resize
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
    };
    resize();

    return () => { pad.off(); };
  }, [mode]);

  const handleClear = () => {
    padRef.current?.clear();
  };

  const handleSave = () => {
    if (mode === "draw") {
      if (padRef.current?.isEmpty()) return;
      onSave(padRef.current?.toDataURL("image/png") || "");
    } else if (mode === "type") {
      // Render typed signature to canvas
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, 400, 120);
        ctx.font = `italic 48px ${typedFont}`;
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, 20, 60);
        onSave(canvas.toDataURL("image/png"));
      }
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onSave(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const SIGNATURE_FONTS = [
    { value: "'Dancing Script', cursive", label: "Script" },
    { value: "'Great Vibes', cursive", label: "Elegant" },
    { value: "'Sacramento', cursive", label: "Flow" },
    { value: "italic serif", label: "Classic" },
  ];

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 w-full max-w-md", className)}>
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="w-full grid grid-cols-3 mb-3">
          <TabsTrigger value="draw" className="text-xs gap-1"><PenTool className="w-3 h-3" /> Draw</TabsTrigger>
          <TabsTrigger value="type" className="text-xs gap-1"><Type className="w-3 h-3" /> Type</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1"><Upload className="w-3 h-3" /> Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-3">
          <div className="border border-border rounded-lg bg-background relative">
            <canvas
              ref={canvasRef}
              className="w-full h-28 cursor-crosshair"
            />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-muted-foreground/20 mx-6" />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleClear}>
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="type" className="space-y-3">
          <Input
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder="Type your name..."
            className="text-lg"
          />
          <div className="flex gap-2 flex-wrap">
            {SIGNATURE_FONTS.map(f => (
              <button
                key={f.value}
                className={cn(
                  "px-3 py-1.5 rounded-md border text-sm transition-colors",
                  typedFont === f.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                )}
                style={{ fontFamily: f.value }}
                onClick={() => setTypedFont(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {typedName && (
            <div className="border border-border rounded-lg bg-background p-4 text-center">
              <span style={{ fontFamily: typedFont, fontSize: "32px", fontStyle: "italic" }}>
                {typedName}
              </span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/40 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload signature image</span>
            <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG up to 2MB</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Check className="w-3.5 h-3.5" /> Apply Signature
        </Button>
      </div>
    </div>
  );
}
