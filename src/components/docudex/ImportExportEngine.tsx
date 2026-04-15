/**
 * P6-005: Import/Export expansion — PDF import, DOCX/SVG/PNG export
 */
import { useState, useCallback } from "react";
import { useEditorStore, type EditorPage, type ElementNode } from "@/stores/editorStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Download, Upload, FileText, FileImage, Code2,
  FileSpreadsheet, Loader2,
} from "lucide-react";

type ExportFormat = "pdf" | "png" | "svg" | "html" | "json";

interface ImportExportEngineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "import" | "export";
}

export function ImportExportEngine({ open, onOpenChange, mode }: ImportExportEngineProps) {
  const { toast } = useToast();
  const { pages, title, pageSize } = useEditorStore();

  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [includeBleed, setIncludeBleed] = useState(false);
  const [quality, setQuality] = useState<"draft" | "standard" | "high">("standard");
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const generateSVG = useCallback((page: EditorPage): string => {
    const sorted = [...page.elements].sort((a, b) => a.layerIndex - b.layerIndex);
    const svgElements = sorted
      .filter(el => el.visible)
      .map(el => {
        const transform = el.rotation ? ` transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : "";
        const opacity = el.opacity < 1 ? ` opacity="${el.opacity}"` : "";

        switch (el.type) {
          case "text":
            return `<text x="${el.x}" y="${el.y + 16}" font-family="${el.styles.fontFamily || 'Montserrat'}" font-size="${el.styles.fontSize || 16}" fill="${el.styles.color || '#000'}" font-weight="${el.styles.fontWeight || '400'}"${transform}${opacity}>${escapeXml(el.content?.text || "")}</text>`;
          case "shape":
            return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.styles.borderRadius || 0}" fill="${el.styles.fill || '#E4AC0F'}" stroke="${el.styles.stroke || 'none'}" stroke-width="${el.styles.strokeWidth || 0}"${transform}${opacity} />`;
          case "image":
            return `<image x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" href="${el.content?.src || ''}"${transform}${opacity} />`;
          default:
            return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="#ccc"${transform}${opacity} />`;
        }
      })
      .join("\n    ");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}">
  <rect width="100%" height="100%" fill="${page.background || 'white'}" />
    ${svgElements}
</svg>`;
  }, []);

  const generateHTML = useCallback((): string => {
    const pagesHtml = pages.map((page, i) => {
      const sorted = [...page.elements].sort((a, b) => a.layerIndex - b.layerIndex);
      const els = sorted.filter(el => el.visible).map(el => {
        const style = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}${el.opacity < 1 ? `opacity:${el.opacity};` : ""}`;
        switch (el.type) {
          case "text":
            return `<div style="${style}font-family:${el.styles.fontFamily || "Montserrat"};font-size:${el.styles.fontSize || 16}px;color:${el.styles.color || "#000"};font-weight:${el.styles.fontWeight || 400};">${el.content?.text || ""}</div>`;
          case "shape":
            return `<div style="${style}background:${el.styles.fill || "#E4AC0F"};border-radius:${el.styles.borderRadius || 0}px;border:${el.styles.strokeWidth || 0}px solid ${el.styles.stroke || "transparent"};"></div>`;
          case "image":
            return `<img style="${style}object-fit:cover;" src="${el.content?.src || ""}" alt="" />`;
          default:
            return `<div style="${style}background:#eee;"></div>`;
        }
      }).join("\n      ");

      return `    <div class="page" style="position:relative;width:${page.width}px;height:${page.height}px;background:${page.background || "white"};margin:0 auto 20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      ${els}
    </div>`;
    }).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f5; padding: 20px; font-family: Montserrat, sans-serif; }
    @media print { body { background: white; padding: 0; } .page { box-shadow: none !important; margin: 0 !important; page-break-after: always; } }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
  }, [pages, title]);

  const exportAs = useCallback(async (fmt: ExportFormat) => {
    setExporting(true);
    setExportProgress(10);

    try {
      let blob: Blob;
      let filename: string;

      switch (fmt) {
        case "svg": {
          setExportProgress(30);
          const svgs = pages.map(p => generateSVG(p));
          const content = svgs.length === 1 ? svgs[0] : svgs.map((s, i) => `<!-- Page ${i + 1} -->\n${s}`).join("\n\n");
          blob = new Blob([content], { type: "image/svg+xml" });
          filename = `${title || "document"}.svg`;
          setExportProgress(80);
          break;
        }

        case "html": {
          setExportProgress(30);
          const html = generateHTML();
          blob = new Blob([html], { type: "text/html" });
          filename = `${title || "document"}.html`;
          setExportProgress(80);
          break;
        }

        case "json": {
          setExportProgress(30);
          const json = JSON.stringify({ title, pageSize, pages }, null, 2);
          blob = new Blob([json], { type: "application/json" });
          filename = `${title || "document"}.json`;
          setExportProgress(80);
          break;
        }

        case "png": {
          setExportProgress(20);
          // Render first page to canvas
          const page = pages[0];
          if (!page) throw new Error("No pages to export");
          const canvas = document.createElement("canvas");
          const scale = quality === "high" ? 3 : quality === "standard" ? 2 : 1;
          canvas.width = page.width * scale;
          canvas.height = page.height * scale;
          const ctx = canvas.getContext("2d")!;
          ctx.scale(scale, scale);
          ctx.fillStyle = page.background || "white";
          ctx.fillRect(0, 0, page.width, page.height);
          setExportProgress(40);

          const sorted = [...page.elements].sort((a, b) => a.layerIndex - b.layerIndex);
          for (const el of sorted.filter(e => e.visible)) {
            ctx.save();
            if (el.rotation) {
              ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
              ctx.rotate((el.rotation * Math.PI) / 180);
              ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));
            }
            ctx.globalAlpha = el.opacity;

            if (el.type === "text") {
              ctx.font = `${el.styles.fontWeight || 400} ${el.styles.fontSize || 16}px ${el.styles.fontFamily || "Montserrat"}`;
              ctx.fillStyle = String(el.styles.color || "#000");
              ctx.fillText(el.content?.text || "", el.x, el.y + Number(el.styles.fontSize || 16));
            } else if (el.type === "shape") {
              ctx.fillStyle = String(el.styles.fill || "#E4AC0F");
              const r = Number(el.styles.borderRadius || 0);
              if (r > 0) {
                ctx.beginPath();
                ctx.roundRect(el.x, el.y, el.width, el.height, r);
                ctx.fill();
              } else {
                ctx.fillRect(el.x, el.y, el.width, el.height);
              }
            }
            ctx.restore();
          }

          setExportProgress(70);
          const dataUrl = canvas.toDataURL("image/png");
          const arr = atob(dataUrl.split(",")[1]);
          const u8 = new Uint8Array(arr.length);
          for (let i = 0; i < arr.length; i++) u8[i] = arr.charCodeAt(i);
          blob = new Blob([u8], { type: "image/png" });
          filename = `${title || "document"}.png`;
          setExportProgress(90);
          break;
        }

        case "pdf":
        default: {
          // Generate print-ready HTML and trigger browser print
          setExportProgress(30);
          const html = generateHTML();
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setExportProgress(70);
            setTimeout(() => {
              printWindow.print();
              setExportProgress(100);
            }, 500);
          }
          setExporting(false);
          onOpenChange(false);
          toast({ title: "PDF export", description: "Print dialog opened. Select 'Save as PDF' to export." });
          return;
        }
      }

      setExportProgress(90);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportProgress(100);
      toast({ title: "Export complete", description: `Saved as ${filename}` });
    } catch (err) {
      toast({ title: "Export failed", description: String(err), variant: "destructive" });
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 500);
    }
  }, [pages, title, pageSize, quality, generateSVG, generateHTML, onOpenChange, toast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.pages && Array.isArray(data.pages)) {
          const { setPages, setTitle: storeSetTitle, setPageSize: storeSetPageSize } = useEditorStore.getState();
          storeSetTitle(data.title || "Imported Document");
          if (data.pageSize) storeSetPageSize(data.pageSize);
          setPages(data.pages);
          toast({ title: "Import successful", description: `Loaded ${data.pages.length} page(s).` });
        }
      } else if (file.name.endsWith(".svg")) {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (svg) {
          const { addElement, pages: currentPages, activePageId } = useEditorStore.getState();
          const pageId = activePageId || currentPages[0]?.id;
          if (pageId) {
            addElement(pageId, {
              type: "image",
              x: 50, y: 50,
              width: parseInt(svg.getAttribute("width") || "200"),
              height: parseInt(svg.getAttribute("height") || "200"),
              rotation: 0, opacity: 1, locked: false, visible: true,
              styles: {},
              content: { src: `data:image/svg+xml;base64,${btoa(text)}`, alt: file.name },
            });
            toast({ title: "SVG imported", description: "Added as image element." });
          }
        }
      } else {
        toast({ title: "Unsupported format", description: "Import supports .json and .svg files.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Import failed", description: String(err), variant: "destructive" });
    }

    e.target.value = "";
    onOpenChange(false);
  }, [toast, onOpenChange]);

  const formatOptions: Array<{ value: ExportFormat; label: string; icon: React.ReactNode; desc: string }> = [
    { value: "pdf", label: "PDF", icon: <FileText className="w-4 h-4" />, desc: "Print-ready document" },
    { value: "png", label: "PNG", icon: <FileImage className="w-4 h-4" />, desc: "Raster image" },
    { value: "svg", label: "SVG", icon: <Code2 className="w-4 h-4" />, desc: "Scalable vector" },
    { value: "html", label: "HTML", icon: <Code2 className="w-4 h-4" />, desc: "Web page" },
    { value: "json", label: "JSON", icon: <FileSpreadsheet className="w-4 h-4" />, desc: "Editor data" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "export" ? <Download className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {mode === "export" ? "Export Document" : "Import Document"}
          </DialogTitle>
          <DialogDescription>
            {mode === "export" ? "Choose a format and export your document." : "Import from a supported file format."}
          </DialogDescription>
        </DialogHeader>

        {mode === "export" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {formatOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors text-center ${format === opt.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                  >
                    {opt.icon}
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {format === "png" && (
              <div className="space-y-2">
                <Label>Quality</Label>
                <Select value={quality} onValueChange={(v) => setQuality(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (1×)</SelectItem>
                    <SelectItem value="standard">Standard (2×)</SelectItem>
                    <SelectItem value="high">High (3×)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {format === "pdf" && (
              <div className="flex items-center justify-between">
                <Label>Include bleed marks</Label>
                <Switch checked={includeBleed} onCheckedChange={setIncludeBleed} />
              </div>
            )}

            {exporting && (
              <div className="space-y-1.5">
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{exportProgress}%</p>
              </div>
            )}

            <Button className="w-full gap-2" onClick={() => exportAs(format)} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export as {format.toUpperCase()}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Supported formats: <strong>.json</strong> (DocuDex), <strong>.svg</strong> (Vector)
            </p>
            <div className="relative">
              <Input
                type="file"
                accept=".json,.svg"
                onChange={handleImport}
                className="cursor-pointer"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
