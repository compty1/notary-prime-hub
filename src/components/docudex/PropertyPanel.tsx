/**
 * DocuDex Property Panel — Element-specific property editors (P2-001 to P2-007)
 */
import { useEditorStore } from "@/stores/editorStore";
import type { ElementNode } from "@/stores/editorStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Lock, Unlock, Eye, EyeOff, RotateCcw, Trash2, Copy } from "lucide-react";

const FONT_FAMILIES = [
  "Montserrat", "Inter", "Georgia", "Times New Roman", "Arial",
  "Helvetica", "Courier New", "Roboto", "Open Sans", "Lato",
  "Playfair Display", "Merriweather", "Source Sans Pro", "PT Sans", "Nunito",
];

const SHAPES = [
  "rectangle", "circle", "triangle", "star", "hexagon",
  "diamond", "arrow-right", "arrow-left", "heart", "shield",
  "banner", "cloud", "lightning", "chat-bubble", "document",
];

export function PropertyPanel() {
  const {
    pages, activePageId, selectedElementIds,
    updateElement, removeElement, duplicateElement,
  } = useEditorStore();

  const activePage = pages.find(p => p.id === activePageId);
  if (!activePage || selectedElementIds.length === 0) {
    return (
      <div className="w-72 border-l border-border bg-card p-4 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">Select an element to edit its properties</p>
      </div>
    );
  }

  const selectedElement = activePage.elements.find(e => e.id === selectedElementIds[0]);
  if (!selectedElement) return null;

  const update = (updates: Partial<ElementNode>) => {
    if (activePageId) updateElement(activePageId, selectedElement.id, updates);
  };

  const updateStyle = (key: string, value: string | number) => {
    update({ styles: { ...selectedElement.styles, [key]: value } });
  };

  const updateContent = (key: string, value: any) => {
    update({ content: { ...selectedElement.content, [key]: value } });
  };

  return (
    <div className="w-72 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {selectedElement.type}
          </span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => update({ locked: !selectedElement.locked })}>
              {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => update({ visible: !selectedElement.visible })}>
              {selectedElement.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => activePageId && duplicateElement(activePageId, selectedElement.id)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => activePageId && removeElement(activePageId, selectedElement.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="position" className="p-3">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
          <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
          <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
        </TabsList>

        {/* Position tab */}
        <TabsContent value="position" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input type="number" value={Math.round(selectedElement.x)} onChange={e => update({ x: Number(e.target.value) })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input type="number" value={Math.round(selectedElement.y)} onChange={e => update({ y: Number(e.target.value) })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Width</Label>
              <Input type="number" value={Math.round(selectedElement.width)} onChange={e => update({ width: Number(e.target.value) })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input type="number" value={Math.round(selectedElement.height)} onChange={e => update({ height: Number(e.target.value) })} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Rotation (°)</Label>
            <div className="flex gap-2 items-center">
              <Slider value={[selectedElement.rotation]} min={0} max={360} step={1} onValueChange={([v]) => update({ rotation: v })} className="flex-1" />
              <span className="text-xs w-8 text-right">{selectedElement.rotation}°</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => update({ rotation: 0 })}>
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Opacity</Label>
            <Slider value={[selectedElement.opacity * 100]} min={0} max={100} step={1} onValueChange={([v]) => update({ opacity: v / 100 })} />
          </div>
        </TabsContent>

        {/* Style tab */}
        <TabsContent value="style" className="space-y-3 mt-3">
          {(selectedElement.type === "text") && (
            <>
              <div>
                <Label className="text-xs">Font Family</Label>
                <Select value={(selectedElement.styles.fontFamily as string) || "Montserrat"} onValueChange={v => updateStyle("fontFamily", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Size</Label>
                  <Input type="number" value={(selectedElement.styles.fontSize as number) || 16} onChange={e => updateStyle("fontSize", Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Weight</Label>
                  <Select value={String((selectedElement.styles.fontWeight as string) || "400")} onValueChange={v => updateStyle("fontWeight", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["300", "400", "500", "600", "700", "800", "900"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={(selectedElement.styles.color as string) || "#000000"} onChange={e => updateStyle("color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input value={(selectedElement.styles.color as string) || "#000000"} onChange={e => updateStyle("color", e.target.value)} className="h-8 text-xs flex-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Line Height</Label>
                <Slider value={[((selectedElement.styles.lineHeight as number) || 1.4) * 10]} min={8} max={30} step={1} onValueChange={([v]) => updateStyle("lineHeight", v / 10)} />
              </div>
              <div>
                <Label className="text-xs">Letter Spacing (px)</Label>
                <Slider value={[(selectedElement.styles.letterSpacing as number) || 0]} min={-2} max={10} step={0.5} onValueChange={([v]) => updateStyle("letterSpacing", v)} />
              </div>
            </>
          )}

          {(selectedElement.type === "shape") && (
            <>
              <div>
                <Label className="text-xs">Fill</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={(selectedElement.styles.fill as string) || "#E4AC0F"} onChange={e => updateStyle("fill", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input value={(selectedElement.styles.fill as string) || "#E4AC0F"} onChange={e => updateStyle("fill", e.target.value)} className="h-8 text-xs flex-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Stroke</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={(selectedElement.styles.stroke as string) || "#000000"} onChange={e => updateStyle("stroke", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input type="number" value={(selectedElement.styles.strokeWidth as number) || 0} onChange={e => updateStyle("strokeWidth", Number(e.target.value))} placeholder="Width" className="h-8 text-xs w-16" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Border Radius</Label>
                <Slider value={[(selectedElement.styles.borderRadius as number) || 0]} min={0} max={100} step={1} onValueChange={([v]) => updateStyle("borderRadius", v)} />
              </div>
            </>
          )}

          {(selectedElement.type === "image") && (
            <>
              <div>
                <Label className="text-xs">Fit Mode</Label>
                <Select value={(selectedElement.styles.objectFit as string) || "cover"} onValueChange={v => updateStyle("objectFit", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Border Radius</Label>
                <Slider value={[(selectedElement.styles.borderRadius as number) || 0]} min={0} max={100} step={1} onValueChange={([v]) => updateStyle("borderRadius", v)} />
              </div>
            </>
          )}
        </TabsContent>

        {/* Content tab */}
        <TabsContent value="content" className="space-y-3 mt-3">
          {selectedElement.type === "text" && (
            <div>
              <Label className="text-xs">Text Content</Label>
              <textarea
                value={(selectedElement.content.text as string) || ""}
                onChange={e => updateContent("text", e.target.value)}
                className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Enter text..."
              />
            </div>
          )}
          {selectedElement.type === "image" && (
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input value={(selectedElement.content.src as string) || ""} onChange={e => updateContent("src", e.target.value)} className="h-8 text-xs" placeholder="https://..." />
            </div>
          )}
          {selectedElement.type === "qrcode" && (
            <div>
              <Label className="text-xs">QR Data</Label>
              <Input value={(selectedElement.content.data as string) || ""} onChange={e => updateContent("data", e.target.value)} className="h-8 text-xs" placeholder="https://notar.com" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
