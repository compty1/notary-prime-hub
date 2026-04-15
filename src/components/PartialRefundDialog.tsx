/**
 * SVC-102: Partial Refund UI
 * Admin modal for issuing partial refunds with amount, reason, and audit trail.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

interface PartialRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  maxAmount: number;
  paymentIntentId?: string;
}

export function PartialRefundDialog({ open, onOpenChange, paymentId, maxAmount, paymentIntentId }: PartialRefundDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const refundMutation = useMutation({
    mutationFn: async () => {
      const refundAmount = parseFloat(amount);
      if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > maxAmount) {
        throw new Error(`Refund amount must be between $0.01 and $${maxAmount.toFixed(2)}`);
      }
      if (!reason.trim()) throw new Error("Refund reason is required");

      // Update payment record
      const { error } = await supabase
        .from("payments")
        .update({
          status: refundAmount >= maxAmount ? "refunded" : "partial_refund",
          refund_amount: refundAmount,
          refunded_at: new Date().toISOString(),
        })
        .eq("id", paymentId);
      if (error) throw error;

      // Audit trail
      await logAuditEvent("admin_partial_refund", {
        entityType: "payment",
        entityId: paymentId,
        details: {
          amount: refundAmount,
          reason: reason.trim(),
          stripe_pi: paymentIntentId || "n/a",
        },
      });
    },
    onSuccess: () => {
      toast.success("Refund recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onOpenChange(false);
      setAmount("");
      setReason("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Partial Refund</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Refund Amount (max ${maxAmount.toFixed(2)})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Reason for Refund</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain the reason for this refund..."
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => refundMutation.mutate()}
            disabled={refundMutation.isPending}
          >
            {refundMutation.isPending ? "Processing..." : "Issue Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
