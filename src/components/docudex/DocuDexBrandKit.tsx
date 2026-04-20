import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Palette, Plus, X, Upload } from "lucide-react";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

export interface BrandKit {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  logoUrl: string;
}

interface BrandKitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (kit: BrandKit) => void;
}

const DEFAULT_KIT: BrandKit = {
  name: "Default Brand",
  primaryColor: "#1a1a2e",
  secondaryColor: "#16213e",
  accentColor: "#F59E0B",
  fontHeading: "Georgia",
  fontBody: "Arial",
  logoUrl: "",
};

const FONT_OPTIONS = [
  "Arial", "Georgia", "Times New Roman", "Helvetica", "Garamond",
  "Palatino", "Trebuchet MS", "Verdana", "Courier New", "Cambria",
];

export function DocuDexBrandKit({ open, onOpenChange, onApply }: BrandKitProps) {
  const [kits, setKits] = useState<BrandKit[]>(() => {
    try { return JSON.parse(safeGetItem("docudex_brand_kits") || "[]"); } catch { return []; }
  });
  const [editing, setEditing] = useState<BrandKit>({ ...DEFAULT_KIT });
  const [showEditor, setShowEditor] = useState(false);

  const saveKit = () => {
    const updated = [...kits.filter(k => k.name !== editing.name), editing];
    setKits(updated);
    safeSetItem("docudex_brand_kits", JSON.stringify(updated));
    setShowEditor(false);
  };

  const deleteKit = (name: string) => {
    const updated = kits.filter(k => k.name !== name);
    setKits(updated);
    safeSetItem("docudex_brand_kits", JSON.stringify(updated));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Brand Kit</DialogTitle>
        </DialogHeader>

        {!showEditor ? (
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => { setEditing({ ...DEFAULT_KIT, name: "" }); setShowEditor(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Create New Brand Kit
            </Button>

            {kits.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No brand kits saved yet</p>}

            {kits.map(kit => (
              <div key={kit.name} className="flex items-center gap-3 border rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: kit.primaryColor }} />
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: kit.secondaryColor }} />
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: kit.accentColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{kit.name}</p>
                  <p className="text-xs text-muted-foreground">{kit.fontHeading} / {kit.fontBody}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onApply(kit)}>Apply</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() = aria-label="Action"> { setEditing(kit); setShowEditor(true); }}>
                  <Palette className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() = aria-label="Action"> deleteKit(kit.name)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div><Label>Brand Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="My Brand" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Primary</Label>
                <Input type="color" value={editing.primaryColor} onChange={e => setEditing({ ...editing, primaryColor: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">Secondary</Label>
                <Input type="color" value={editing.secondaryColor} onChange={e => setEditing({ ...editing, secondaryColor: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">Accent</Label>
                <Input type="color" value={editing.accentColor} onChange={e => setEditing({ ...editing, accentColor: e.target.value })} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Heading Font</Label>
                <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={editing.fontHeading} onChange={e => setEditing({ ...editing, fontHeading: e.target.value })}>
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Body Font</Label>
                <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={editing.fontBody} onChange={e => setEditing({ ...editing, fontBody: e.target.value })}>
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
              <Button onClick={saveKit} disabled={!editing.name.trim()}>Save Brand Kit</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
