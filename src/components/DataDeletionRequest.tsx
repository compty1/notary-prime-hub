/**
 * SVC-167/195/481: Data deletion request flow
 * Portal button for users to request account/data deletion.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

interface DataDeletionRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataDeletionRequest({ open, onOpenChange }: DataDeletionRequestProps) {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (confirmText !== "DELETE") throw new Error('Please type "DELETE" to confirm');
      if (!confirmed) throw new Error("Please check the confirmation box");

      // Create a service request for deletion
      const { error } = await supabase.from("service_requests").insert({
        client_id: user.id,
        service_name: "Account Data Deletion Request",
        status: "pending",
        priority: "standard",
        description: `User ${user.email} has requested complete data deletion per privacy policy. User ID: ${user.id}`,
      } as any);
      if (error) throw error;

      await logAuditEvent("data_deletion_requested", {
        entityType: "user",
        entityId: user.id,
        details: { email: user.email || "unknown" },
      });
    },
    onSuccess: () => {
      toast.success("Data deletion request submitted. We will process your request within 30 days.");
      onOpenChange(false);
      setConfirmed(false);
      setConfirmText("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Request Data Deletion
          </DialogTitle>
          <DialogDescription>
            This will submit a request to permanently delete all your personal data. 
            Note: Notarization records subject to legal retention requirements (10 years per ORC §147.141) 
            cannot be deleted until the retention period expires.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
            />
            <label htmlFor="confirm-delete" className="text-sm text-muted-foreground">
              I understand this action is irreversible and all my data (except legally retained records) will be permanently deleted.
            </label>
          </div>
          <div>
            <Label>Type "DELETE" to confirm</Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder='Type "DELETE"'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => submitRequest.mutate()}
            disabled={submitRequest.isPending || !confirmed || confirmText !== "DELETE"}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {submitRequest.isPending ? "Submitting..." : "Submit Deletion Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
