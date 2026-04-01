import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Download, Save, Trash2, Type, PenTool, Loader2, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SIGNATURE_FONTS = [
  { value: "'Dancing Script', cursive", label: "Dancing Script" },
  { value: "'Great Vibes', cursive", label: "Great Vibes" },
  { value: "'Pacifico', cursive", label: "Pacifico" },
  { value: "'Caveat', cursive", label: "Caveat" },
  { value: "'Sacramento', cursive", label: "Sacramento" },
  { value: "'Satisfy', cursive", label: "Satisfy" },
  { value: "'Allura', cursive", label: "Allura" },
  { value: "'Kaushan Script', cursive", label: "Kaushan Script" },
  { value: "'Lobster', cursive", label: "Lobster" },
  { value: "'Alex Brush', cursive", label: "Alex Brush" },
];

const FONT_URL = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Caveat:wght@400;700&family=Sacramento&family=Satisfy&family=Allura&family=Kaushan+Script&family=Lobster&family=Alex+Brush&display=swap";

const COLORS = [
  { value: "#1a1a2e", label: "Navy" },
  { value: "#000000", label: "Black" },
  { value: "#1B4D7A", label: "Blue" },
  { value: "#2d3436", label: "Charcoal" },
  { value: "#6c5ce7", label: "Purple" },
  { value: "#c0392b", label: "Red" },
];

export default function SignatureGenerator() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("");
  const [font, setFont] = useState(SIGNATURE_FONTS[0].value);
  const [color, setColor] = useState(COLORS[0].value);
  const [fontSize, setFontSize] = useState([48]);
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONT_URL;
    link.rel = "stylesheet";
    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Render typed signature on canvas
  useEffect(() => {
    if (mode !== "type" || !canvasRef.current || !fontsLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!name.trim()) return;
    ctx.fillStyle = color;
    ctx.font = `${fontSize[0]}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  }, [name, font, color, fontSize, mode, fontsLoaded]);

  // Drawing handlers
  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode, color]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }, [isDrawing, mode]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadSignature = (format: "png" | "svg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (format === "png") {
      const link = document.createElement("a");
      link.download = `signature-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      // Simple SVG export for typed signatures
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="${font}" font-size="${fontSize[0]}" fill="${color}">${name}</text>
      </svg>`;
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.download = `signature-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
    toast.success(`Signature downloaded as ${format.toUpperCase()}`);
  };

  const saveSignature = async () => {
    if (!user) { toast.error("Please sign in to save signatures"); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to create image");
      const fileName = `${user.id}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from("signatures").upload(fileName, blob, { contentType: "image/png" });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("user_signatures").insert({
        user_id: user.id,
        name: name || "My Signature",
        font_family: font,
        style_config: { color, fontSize: fontSize[0], mode },
        image_path: fileName,
      });
      if (dbError) throw dbError;
      toast.success("Signature saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Create Your Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as "type" | "draw"); clearCanvas(); }}>
            <TabsList>
              <TabsTrigger value="type" className="gap-1.5"><Type className="h-4 w-4" /> Type</TabsTrigger>
              <TabsTrigger value="draw" className="gap-1.5"><PenTool className="h-4 w-4" /> Draw</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="sig-name">Your Name</Label>
                <Input id="sig-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Style</Label>
                  <Select value={font} onValueChange={setFont}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIGNATURE_FONTS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          <span style={{ fontFamily: f.value }}>{f.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c.value ? "border-primary scale-110" : "border-border"}`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label>Size: {fontSize[0]}px</Label>
                <Slider value={fontSize} onValueChange={setFontSize} min={24} max={80} step={2} className="mt-2" />
              </div>
            </TabsContent>

            <TabsContent value="draw" className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c.value ? "border-primary scale-110" : "border-border"}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <Button size="sm" variant="ghost" onClick={clearCanvas}><Trash2 className="h-3.5 w-3.5 mr-1" /> Clear</Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Draw your signature in the canvas below</p>
            </TabsContent>
          </Tabs>

          {/* Canvas Preview */}
          <div className="border-2 border-dashed border-border rounded-lg bg-card p-2">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full bg-background rounded cursor-crosshair"
              style={{ touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadSignature("png")} variant="outline"><Download className="h-4 w-4 mr-1.5" /> PNG</Button>
            {mode === "type" && (
              <Button onClick={() => downloadSignature("svg")} variant="outline"><Download className="h-4 w-4 mr-1.5" /> SVG</Button>
            )}
            <Button onClick={saveSignature} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save Signature
            </Button>
            <Button onClick={clearCanvas} variant="ghost"><Trash2 className="h-4 w-4 mr-1.5" /> Clear</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
