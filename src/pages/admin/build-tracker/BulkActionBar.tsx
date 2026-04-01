import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Copy, Download, ListChecks, X, FolderEdit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TrackerItem } from "./constants";
import { CATEGORIES, SEVERITIES, exportCSV } from "./constants";
import { useBulkUpdate } from "./hooks";
import { safeClipboardWrite } from "./useSSEStream";

type Props = {
  selectedIds: Set<string>;
  items: TrackerItem[];
  onClear: () => void;
};

const BulkActionBar = React.forwardRef<HTMLDivElement, Props>(
  function BulkActionBar({ selectedIds, items, onClear }, ref) {
    const bulk = useBulkUpdate();
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    const ids = [...selectedIds];

    if (selectedIds.size === 0) return null;

    const copyToClipboard = async () => {
      const text = selectedItems.map(i => `- [${i.severity}] ${i.title} (${i.category})`).join("\n");
      const ok = await safeClipboardWrite(text);
      if (ok) toast.success(`Copied ${selectedItems.length} items`);
      else toast.error("Failed to copy to clipboard");
    };

    return (
      <div ref={ref} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3 mb-8">
        <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>

        <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids, fields: { status: "resolved", resolved_at: new Date().toISOString() } })} disabled={bulk.isPending}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
        </Button>
        <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids, fields: { status: "wont_fix" } })} disabled={bulk.isPending}>
          <XCircle className="h-3.5 w-3.5 mr-1" /> Dismiss
        </Button>
        <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids, fields: { is_on_todo: true } })} disabled={bulk.isPending}>
          <ListChecks className="h-3.5 w-3.5 mr-1" /> To-Do
        </Button>

        {/* Batch category/severity change */}
        <Select onValueChange={(v) => bulk.mutate({ ids, fields: { category: v } })}>
          <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs">
            <FolderEdit className="h-3.5 w-3.5 mr-1" />
            <span>Category</span>
          </SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={(v) => bulk.mutate({ ids, fields: { severity: v } })}>
          <SelectTrigger className="h-8 w-auto min-w-[90px] text-xs">
            <span>Severity</span>
          </SelectTrigger>
          <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>

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
);

export default BulkActionBar;
