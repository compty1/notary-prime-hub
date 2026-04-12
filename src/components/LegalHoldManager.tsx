import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LegalHoldManagerProps {
  onCreated?: () => void;
}

export function LegalHoldManager({ onCreated }: LegalHoldManagerProps) {
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!entityType || !entityId || !reason) { toast.error("All fields required"); return; }
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("legal_holds").insert({
        entity_type: entityType,
        entity_id: entityId,
        reason,
        placed_by: user!.id,
      });
      if (error) throw error;
      toast.success("Legal hold placed");
      setOpen(false);
      setEntityType(""); setEntityId(""); setReason("");
      onCreated?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" /> Place Legal Hold</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Place Legal Hold</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Entity Type</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="journal_entry">Journal Entry</SelectItem>
                <SelectItem value="ron_session">RON Session</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Entity ID</Label>
            <Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="UUID of the record" />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Legal reason for the hold..." rows={3} />
          </div>
          <Button onClick={handleCreate} disabled={saving} className="w-full">
            {saving ? "Placing hold..." : "Place Legal Hold"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
