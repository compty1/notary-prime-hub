import { type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Minus, Trash2, Columns, Rows, Merge, Split, ToggleLeft,
} from "lucide-react";

interface TableToolbarProps {
  editor: Editor;
}

function TBtn({ onClick, children, title, disabled }: {
  onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2" onClick={onClick} disabled={disabled}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{title}</TooltipContent>
    </Tooltip>
  );
}

export function DocuDexTableToolbar({ editor }: TableToolbarProps) {
  if (!editor.isActive("table")) return null;

  const chain = () => editor.chain().focus();

  return (
    <div className="flex items-center gap-1 flex-wrap border-b border-border bg-accent/30 px-2 py-1 shrink-0">
      <span className="text-[10px] font-semibold text-muted-foreground mr-1">Table:</span>

      <TBtn title="Add Row Before" onClick={() => (chain() as any).addRowBefore().run()}>
        <Plus className="h-3 w-3" /><Rows className="h-3 w-3" />↑
      </TBtn>
      <TBtn title="Add Row After" onClick={() => (chain() as any).addRowAfter().run()}>
        <Plus className="h-3 w-3" /><Rows className="h-3 w-3" />↓
      </TBtn>
      <TBtn title="Delete Row" onClick={() => (chain() as any).deleteRow().run()}>
        <Minus className="h-3 w-3" /><Rows className="h-3 w-3" />
      </TBtn>

      <div className="w-px h-5 bg-border mx-0.5" />

      <TBtn title="Add Column Before" onClick={() => (chain() as any).addColumnBefore().run()}>
        <Plus className="h-3 w-3" /><Columns className="h-3 w-3" />←
      </TBtn>
      <TBtn title="Add Column After" onClick={() => (chain() as any).addColumnAfter().run()}>
        <Plus className="h-3 w-3" /><Columns className="h-3 w-3" />→
      </TBtn>
      <TBtn title="Delete Column" onClick={() => (chain() as any).deleteColumn().run()}>
        <Minus className="h-3 w-3" /><Columns className="h-3 w-3" />
      </TBtn>

      <div className="w-px h-5 bg-border mx-0.5" />

      <TBtn title="Merge Cells" onClick={() => (chain() as any).mergeCells().run()}>
        <Merge className="h-3 w-3" /> Merge
      </TBtn>
      <TBtn title="Split Cell" onClick={() => (chain() as any).splitCell().run()}>
        <Split className="h-3 w-3" /> Split
      </TBtn>
      <TBtn title="Toggle Header Row" onClick={() => (chain() as any).toggleHeaderRow().run()}>
        <ToggleLeft className="h-3 w-3" /> Header
      </TBtn>

      <div className="w-px h-5 bg-border mx-0.5" />

      <TBtn title="Delete Table" onClick={() => (chain() as any).deleteTable().run()}>
        <Trash2 className="h-3 w-3 text-destructive" /> Delete Table
      </TBtn>
    </div>
  );
}
