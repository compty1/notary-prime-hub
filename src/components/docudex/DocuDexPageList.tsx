import { cn } from "@/lib/utils";
import { Plus, GripVertical } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import type { PageData } from "./types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageListProps {
  pages: PageData[];
  activePageIdx: number;
  onPageSelect: (idx: number) => void;
  onAddPage: () => void;
  onReorder: (pages: PageData[]) => void;
}

function SortablePageThumb({ page, idx, active, onClick }: {
  page: PageData; idx: number; active: boolean; onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "h-14 w-10 rounded border-2 bg-white dark:bg-zinc-900 shrink-0 overflow-hidden transition-all hover:scale-105 relative group/thumb",
        active ? "border-primary shadow-md" : "border-border/50"
      )}
      title={`Page ${idx + 1}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-0 left-0 right-0 h-3 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 cursor-grab bg-muted/80 z-10"
      >
        <GripVertical className="h-2 w-2 text-muted-foreground" />
      </div>
      <div
        className="w-full h-full text-[2px] leading-[2.5px] p-[2px] overflow-hidden pointer-events-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html).slice(0, 200) }}
      />
      <span className="absolute bottom-0 right-0.5 text-[6px] text-muted-foreground font-mono">{idx + 1}</span>
    </button>
  );
}

export function DocuDexPageList({ pages, activePageIdx, onPageSelect, onAddPage, onReorder }: PageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex(p => p.id === active.id);
    const newIndex = pages.findIndex(p => p.id === over.id);
    onReorder(arrayMove(pages, oldIndex, newIndex));
  };

  if (pages.length <= 1) return null;

  return (
    <div className="h-20 shrink-0 border-t border-border bg-card flex items-center gap-2 px-4 overflow-x-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map(p => p.id)} strategy={horizontalListSortingStrategy}>
          {pages.map((page, idx) => (
            <SortablePageThumb
              key={page.id}
              page={page}
              idx={idx}
              active={idx === activePageIdx}
              onClick={() => onPageSelect(idx)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={onAddPage}
        className="h-14 w-10 rounded border-2 border-dashed border-border shrink-0 flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
