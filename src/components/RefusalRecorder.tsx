import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Ban, Loader2 } from "lucide-react";

interface RefusalRecorderProps {
  appointmentId: string;
  onRefused?: () => void;
}

/**
 * Per Ohio ORC §147.01(G), a notary may refuse to perform a notarial act.
 * This component records the refusal with reason for audit/compliance.
 */
export function RefusalRecorder({ appointmentId, onRefused }: RefusalRecorderProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const REASONS = [
    "Signer unable to verify identity",
    "Signer appears coerced or unwilling",
    "Document appears fraudulent or incomplete",
    "Signer does not understand the document",
    "Notary has personal interest in transaction",
    "Signer under influence of substances",
    "Other (describe below)",
  ];

  const handleRefusal = async () => {
    if (!category) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled" as any,
          refusal_reason: `${category}${reason ? ": " + reason : ""}`,
          refused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;

      // Audit log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_log").insert({
        action: "notarial_act_refused",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { category, reason, statute: "ORC §147.01(G)" },
        user_id: user?.id,
      });

      toast.success("Refusal recorded and logged to compliance audit");
      setOpen(false);
      onRefused?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to record refusal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Ban className="h-4 w-4 mr-1" /> Refuse Act
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Notarial Act Refusal</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Per Ohio ORC §147.01(G), a notary may refuse to perform a notarial act. This refusal will be recorded in the compliance audit trail.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Refusal Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Details (optional)</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe circumstances..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefusal} disabled={!category || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm Refusal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
