/**
 * DocuDex Layers Panel — Visual z-index management (P1-007)
 */
import { useEditorStore } from "@/stores/editorStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown,
  ChevronsUp, ChevronsDown, Type, Image, Square, Table2,
  PenTool, QrCode, Group
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="w-3.5 h-3.5" />,
  image: <Image className="w-3.5 h-3.5" />,
  shape: <Square className="w-3.5 h-3.5" />,
  table: <Table2 className="w-3.5 h-3.5" />,
  signature: <PenTool className="w-3.5 h-3.5" />,
  qrcode: <QrCode className="w-3.5 h-3.5" />,
  group: <Group className="w-3.5 h-3.5" />,
};

export function LayersPanel() {
  const {
    pages, activePageId, selectedElementIds,
    selectElement, updateElement, reorderElement,
  } = useEditorStore();

  const activePage = pages.find(p => p.id === activePageId);
  if (!activePage) return null;

  const sorted = [...activePage.elements].sort((a, b) => b.layerIndex - a.layerIndex);

  return (
    <div className="w-60 border-l border-border bg-card flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layers</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((el) => (
          <div
            key={el.id}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors",
              selectedElementIds.includes(el.id) && "bg-primary/10 border-l-2 border-primary"
            )}
            onClick={() => selectElement(el.id)}
          >
            <span className="text-muted-foreground">{TYPE_ICONS[el.type] || <Square className="w-3.5 h-3.5" />}</span>
            <span className={cn("flex-1 text-xs truncate", !el.visible && "opacity-40")}>
              {el.type === "text" ? ((el.content.text as string)?.slice(0, 20) || "Text") : `${el.type} ${el.id.slice(-4)}`}
            </span>
            <div className="flex gap-0.5">
              <button onClick={(e) => { e.stopPropagation(); updateElement(activePage.id, el.id, { visible: !el.visible }); }} className="p-0.5 hover:text-primary">
                {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); updateElement(activePage.id, el.id, { locked: !el.locked }); }} className="p-0.5 hover:text-primary">
                {el.locked ? <Lock className="w-3 h-3 text-warning" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">No elements on this page</div>
        )}
      </div>
      {selectedElementIds.length === 1 && (
        <div className="px-3 py-2 border-t border-border flex gap-1 justify-center">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => activePageId && reorderElement(activePageId, selectedElementIds[0], "top")} title="Bring to front">
            <ChevronsUp className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => activePageId && reorderElement(activePageId, selectedElementIds[0], "up")} title="Move up">
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => activePageId && reorderElement(activePageId, selectedElementIds[0], "down")} title="Move down">
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => activePageId && reorderElement(activePageId, selectedElementIds[0], "bottom")} title="Send to back">
            <ChevronsDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
