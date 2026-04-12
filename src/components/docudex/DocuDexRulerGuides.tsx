import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Plus, Trash2 } from "lucide-react";

interface Guide { id: string; position: number; axis: "x" | "y" }

interface Props { pageWidth: number; pageHeight: number; zoom: number }

export function DocuDexRulerGuides({ pageWidth, pageHeight, zoom }: Props) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [showRuler, setShowRuler] = useState(false);

  const addGuide = (axis: "x" | "y", position: number) => {
    setGuides(prev => [...prev, { id: crypto.randomUUID(), position, axis }]);
  };

  const removeGuide = (id: string) => setGuides(prev => prev.filter(g => g.id !== id));

  if (!showRuler) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowRuler(true)}>
            <Ruler className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Show Ruler & Guides</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      {/* Horizontal ruler */}
      <div className="relative h-5 bg-muted border-b border-border select-none overflow-hidden" style={{ width: pageWidth * zoom }}>
        {Array.from({ length: Math.ceil(pageWidth / 50) }, (_, i) => (
          <div key={i} className="absolute top-0 h-full border-l border-border/50" style={{ left: i * 50 * zoom }}>
            <span className="text-[8px] text-muted-foreground ml-0.5">{i * 50}</span>
          </div>
        ))}
        {guides.filter(g => g.axis === "x").map(g => (
          <div key={g.id} className="absolute top-0 h-full w-px bg-blue-500 cursor-pointer z-10" style={{ left: g.position * zoom }} onClick={() => removeGuide(g.id)} title="Click to remove" />
        ))}
      </div>

      {/* Guide controls */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="absolute top-0 right-0 h-5 text-[9px] z-20 rounded-none">
            <Plus className="h-3 w-3 mr-0.5" /> Guide
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2 space-y-2">
          <div className="flex gap-1">
            <Input type="number" placeholder="H pos (px)" className="h-6 text-xs" id="h-guide" />
            <Button size="sm" className="h-6 text-xs" onClick={() => { const v = (document.getElementById("h-guide") as HTMLInputElement)?.value; if (v) addGuide("x", Number(v)); }}>H</Button>
          </div>
          <div className="flex gap-1">
            <Input type="number" placeholder="V pos (px)" className="h-6 text-xs" id="v-guide" />
            <Button size="sm" className="h-6 text-xs" onClick={() => { const v = (document.getElementById("v-guide") as HTMLInputElement)?.value; if (v) addGuide("y", Number(v)); }}>V</Button>
          </div>
          {guides.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs w-full" onClick={() => setGuides([])}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear All
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-xs w-full" onClick={() => setShowRuler(false)}>
            Hide Ruler
          </Button>
        </PopoverContent>
      </Popover>

      {/* Vertical guides overlay */}
      {guides.filter(g => g.axis === "y").map(g => (
        <div key={g.id} className="absolute left-0 w-full h-px bg-blue-500 cursor-pointer z-10 pointer-events-auto" style={{ top: g.position * zoom }} onClick={() => removeGuide(g.id)} title="Click to remove" />
      ))}
    </>
  );
}
