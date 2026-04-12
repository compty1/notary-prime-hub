import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocEntry { id: string; title: string; updatedAt: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocEntry[];
  onExport: (docIds: string[], format: string) => Promise<void>;
}

export function DocuDexBulkExport({ open, onOpenChange, documents, onExport }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState("html");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const toggleDoc = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === documents.length) setSelected(new Set());
    else setSelected(new Set(documents.map(d => d.id)));
  };

  const handleExport = async () => {
    if (selected.size === 0) return;
    setExporting(true);
    try {
      await onExport(Array.from(selected), format);
      toast({ title: "Export complete", description: `${selected.size} documents exported as ${format.toUpperCase()}` });
      onOpenChange(false);
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileDown className="h-4 w-4" /> Bulk Export</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="txt">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Select Documents ({selected.size}/{documents.length})</Label>
            <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={toggleAll}>
              {selected.size === documents.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <ScrollArea className="max-h-48 border rounded p-1">
            {documents.map(d => (
              <label key={d.id} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded text-xs cursor-pointer">
                <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleDoc(d.id)} />
                <span className="flex-1 truncate">{d.title}</span>
                <span className="text-muted-foreground text-[10px]">{new Date(d.updatedAt).toLocaleDateString()}</span>
              </label>
            ))}
            {documents.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No documents found</p>}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={handleExport} disabled={selected.size === 0 || exporting}>
            {exporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileDown className="h-3 w-3 mr-1" />}
            Export {selected.size} docs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
