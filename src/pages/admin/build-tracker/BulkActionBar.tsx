import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Copy, Download, ListChecks, X } from "lucide-react";
import type { TrackerItem } from "./constants";
import { exportCSV } from "./constants";
import { useBulkUpdate } from "./hooks";

type Props = {
  selectedIds: Set<string>;
  items: TrackerItem[];
  onClear: () => void;
};

export default function BulkActionBar({ selectedIds, items, onClear }: Props) {
  const bulk = useBulkUpdate();
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const ids = [...selectedIds];

  if (selectedIds.size === 0) return null;

  const copyToClipboard = () => {
    const text = selectedItems.map(i => `- [${i.severity}] ${i.title} (${i.category})`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${selectedItems.length} items`);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3">
      <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>

      <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids, fields: { status: "resolved", resolved_at: new Date().toISOString() } })}>
        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
      </Button>
      <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids, fields: { status: "wont_fix" } })}>
        <XCircle className="h-3.5 w-3.5 mr-1" /> Dismiss
      </Button>
      <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids, fields: { is_on_todo: true } })}>
        <ListChecks className="h-3.5 w-3.5 mr-1" /> To-Do
      </Button>
      <Button size="sm" variant="outline" onClick={copyToClipboard}>
        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
      </Button>
      <Button size="sm" variant="outline" onClick={() => exportCSV(selectedItems)}>
        <Download className="h-3.5 w-3.5 mr-1" /> CSV
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
