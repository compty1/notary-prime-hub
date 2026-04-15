import React, { useState, useCallback } from "react";
import { FileEdit, Upload, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const POSITIONS = [
  { id: "top-right", label: "Top Right" },
  { id: "top-left", label: "Top Left" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "bottom-left", label: "Bottom Left" },
];

const COLORS = [
  { id: "red", label: "Red", hex: "#dc2626" },
  { id: "blue", label: "Blue", hex: "#2563eb" },
  { id: "black", label: "Black", hex: "#000000" },
];

const ExhibitStamper = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [stampText, setStampText] = useState("EXHIBIT");
  const [startLabel, setStartLabel] = useState("A");
  const [position, setPosition] = useState("top-right");
  const [color, setColor] = useState("red");
  const [fontSize, setFontSize] = useState([24]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (newFiles.length === 0) { toast.error("Only PDF files accepted"); return; }
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleStamp = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const selectedColor = COLORS.find(c => c.id === color)!;
      const r = parseInt(selectedColor.hex.slice(1, 3), 16) / 255;
      const g = parseInt(selectedColor.hex.slice(3, 5), 16) / 255;
      const b = parseInt(selectedColor.hex.slice(5, 7), 16) / 255;

      // Process first file
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      let labelChar = startLabel.charCodeAt(0);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const label = `${stampText} ${String.fromCharCode(labelChar)}`;
        const textWidth = font.widthOfTextAtSize(label, fontSize[0]);
        const textHeight = fontSize[0];

        let x = 0, y = 0;
        if (position === "top-right") { x = width - textWidth - 30; y = height - textHeight - 30; }
        else if (position === "top-left") { x = 30; y = height - textHeight - 30; }
        else if (position === "bottom-right") { x = width - textWidth - 30; y = 30; }
        else { x = 30; y = 30; }

        page.drawText(label, { x, y, size: fontSize[0], font, color: rgb(r, g, b) });
      });

      labelChar++;
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      toast.success("PDF stamped successfully!");
    } catch (err: any) {
      toast.error(err.message || "Stamping failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <EnterpriseLayout title="Legal Exhibit Stamper" icon={FileEdit} description="Stamp exhibit labels on PDF documents using pdf-lib">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload + Config */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div
                className={`flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed p-8 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-semibold">Drop PDFs here</p>
                <input type="file" accept=".pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="hidden" id="exhibit-upload" />
                <Button variant="outline" size="sm" className="mt-3" onClick={() => document.getElementById("exhibit-upload")?.click()}>Choose Files</Button>
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-[8px] bg-muted px-3 py-1.5 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-xs text-destructive">×</button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <Label className="text-xs">Stamp Text</Label>
                <Select value={stampText} onValueChange={setStampText}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXHIBIT">EXHIBIT</SelectItem>
                    <SelectItem value="ATTACHMENT">ATTACHMENT</SelectItem>
                    <SelectItem value="APPENDIX">APPENDIX</SelectItem>
                    <SelectItem value="SCHEDULE">SCHEDULE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Starting Label</Label>
                <Input value={startLabel} onChange={(e) => setStartLabel(e.target.value.toUpperCase())} maxLength={1} className="w-20" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {POSITIONS.map(p => (
                    <button key={p.id} onClick={() => setPosition(p.id)}
                      className={`rounded-[8px] border px-3 py-2 text-xs font-medium transition-all ${position === p.id ? "border-primary bg-primary/10" : "border-border"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c.id} onClick={() => setColor(c.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${color === c.id ? "border-primary scale-110" : "border-border"}`}>
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: c.hex }} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Font Size: {fontSize[0]}px</Label>
                <Slider value={fontSize} onValueChange={setFontSize} min={12} max={48} step={2} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleStamp} disabled={files.length === 0 || processing} variant="dark" className="w-full">
            {processing ? "Stamping..." : "Stamp PDF"}
          </Button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-6">
              {resultUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Stamped PDF Preview</p>
                    <Button variant="dark" size="sm" asChild>
                      <a href={resultUrl} download="stamped.pdf"><Download className="mr-1.5 h-3.5 w-3.5" />Download</a>
                    </Button>
                  </div>
                  <iframe src={resultUrl} className="h-[600px] w-full rounded-[12px] border" />
                </div>
              ) : (
                <div className="flex h-[600px] items-center justify-center text-muted-foreground">
                  <p className="text-sm">Upload a PDF and stamp it to see the preview here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default ExhibitStamper;
