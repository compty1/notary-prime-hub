import { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";

interface TablePickerProps {
  editor: Editor | null;
}

const MAX_ROWS = 8;
const MAX_COLS = 8;

export function DocuDexTablePicker({ editor }: TablePickerProps) {
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);
  const [open, setOpen] = useState(false);

  const insertTable = useCallback((rows: number, cols: number) => {
    if (!editor) return;
    (editor.chain().focus() as any).insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
  }, [editor]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Insert Table"
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Table className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Insert Table</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <p className="text-xs font-medium mb-2">
          {hoveredRow > 0 && hoveredCol > 0
            ? `${hoveredRow} × ${hoveredCol} table`
            : "Select table size"}
        </p>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
          onMouseLeave={() => { setHoveredRow(0); setHoveredCol(0); }}
        >
          {Array.from({ length: MAX_ROWS }).map((_, row) =>
            Array.from({ length: MAX_COLS }).map((_, col) => (
              <button
                key={`${row}-${col}`}
                type="button"
                className={cn(
                  "h-4 w-4 border rounded-[2px] transition-colors",
                  row < hoveredRow && col < hoveredCol
                    ? "bg-primary border-primary"
                    : "bg-muted/50 border-border hover:border-primary/50"
                )}
                onMouseEnter={() => { setHoveredRow(row + 1); setHoveredCol(col + 1); }}
                onClick={() => insertTable(row + 1, col + 1)}
                aria-label={`${row + 1} rows by ${col + 1} columns`}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
