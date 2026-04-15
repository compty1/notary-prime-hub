import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BulkTarget = "appointments" | "documents" | "orders";

const STATUS_OPTIONS: Record<BulkTarget, string[]> = {
  appointments: ["pending", "confirmed", "completed", "cancelled", "no_show"],
  documents: ["pending", "approved", "rejected"],
  orders: ["pending", "processing", "shipped", "delivered", "cancelled"],
};

interface BulkStatusUpdaterProps {
  target: BulkTarget;
  selectedIds: string[];
  onComplete: () => void;
}

export function BulkStatusUpdater({ target, selectedIds, onComplete }: BulkStatusUpdaterProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (!newStatus || selectedIds.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from(target)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in("id", selectedIds);

      if (error) throw error;

      // Log bulk action to audit
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_log").insert({
          action: "bulk_status_update",
          entity_type: target,
          details: { ids: selectedIds, new_status: newStatus, reason, count: selectedIds.length },
          user_id: user.id,
        });
      }

      toast.success(`Updated ${selectedIds.length} ${target} to "${newStatus}"`);
      setOpen(false);
      setNewStatus("");
      setReason("");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Bulk update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={selectedIds.length === 0}>
        Bulk Update ({selectedIds.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                This will update <Badge variant="secondary">{selectedIds.length}</Badge> {target}
              </span>
            </div>

            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS[target].map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Reason for bulk change (optional, logged to audit)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={!newStatus || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Update {selectedIds.length} Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
