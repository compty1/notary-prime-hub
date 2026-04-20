import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/auditLog";
import { ClipboardPaste, Loader2 } from "lucide-react";

const PLATFORMS = ["fiverr", "upwork", "direct", "thumbtack", "other"] as const;

interface ExternalOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function ExternalOrderDialog({ open, onOpenChange, onCreated }: ExternalOrderDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    platform: "fiverr" as string,
    externalOrderId: "",
    serviceName: "General Notary Service",
    amount: "",
    paymentStatus: "paid_on_platform",
    notes: "",
  });

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  /** Parse pasted Fiverr / Upwork order text */
  const parsePaste = () => {
    if (!pasteText.trim()) return;
    const text = pasteText;

    // Try to extract order ID
    const orderMatch = text.match(/(?:order|#|ID)[:\s]*([A-Z0-9\-]+)/i);
    if (orderMatch) set("externalOrderId", orderMatch[1]);

    // Try to extract amount
    const amountMatch = text.match(/\$\s*([\d,]+\.?\d*)/);
    if (amountMatch) set("amount", amountMatch[1].replace(",", ""));

    // Try to extract email
    const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch) set("clientEmail", emailMatch[0]);

    // Try to extract name — look for "from" or "buyer" patterns
    const nameMatch = text.match(/(?:from|buyer|client)[:\s]+([A-Za-z\s]+)/i);
    if (nameMatch) set("clientName", nameMatch[1].trim());

    // Detect platform
    if (/fiverr/i.test(text)) set("platform", "fiverr");
    else if (/upwork/i.test(text)) set("platform", "upwork");
    else if (/thumbtack/i.test(text)) set("platform", "thumbtack");

    toast({ title: "Parsed order details", description: "Review and adjust fields as needed" });
  };

  const handleSubmit = async () => {
    if (!form.clientName && !form.clientEmail) {
      toast({ title: "Missing info", description: "Provide at least a client name or email", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Look up or create profile placeholder
    let clientId = user?.id; // fallback to admin as client_id for external orders
    if (form.clientEmail) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", form.clientEmail)
        .maybeSingle();
      if (existingProfile) clientId = existingProfile.user_id;
    }

    const { error } = await supabase.from("service_requests").insert({
      client_id: clientId,
      service_name: form.serviceName,
      status: "submitted",
      priority: "normal",
      notes: [
        form.notes,
        `External order — Platform: ${form.platform}`,
        form.externalOrderId ? `Platform Order ID: ${form.externalOrderId}` : "",
        form.clientName ? `Client Name: ${form.clientName}` : "",
        form.clientEmail ? `Client Email: ${form.clientEmail}` : "",
      ].filter(Boolean).join("\n"),
      source_platform: form.platform,
      external_order_id: form.externalOrderId || null,
      external_payment_status: form.paymentStatus,
      external_payment_amount: form.amount ? parseFloat(form.amount) : null,
    });

    if (error) {
      toast({ title: "Error creating order", description: error.message, variant: "destructive" });
    } else {
      await logAuditEvent("external_order_created", {
        entityType: "service_request",
        details: { platform: form.platform, external_order_id: form.externalOrderId },
      });
      toast({ title: "External order created" });
      onCreated();
      onOpenChange(false);
      // Reset
      setForm({ clientName: "", clientEmail: "", platform: "fiverr", externalOrderId: "", serviceName: "General Notary Service", amount: "", paymentStatus: "paid_on_platform", notes: "" });
      setPasteText("");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New External Order</DialogTitle>
        </DialogHeader>

        {/* Paste parser */}
        <div className="space-y-2">
          <Label>Paste Order Details (Fiverr, Upwork, etc.)</Label>
          <div className="flex gap-2">
            <Textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste order confirmation text here..."
              rows={3}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={parsePaste} className="self-end">
              <ClipboardPaste className="h-4 w-4 mr-1" /> Parse
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Client Name</Label>
            <Input value={form.clientName} onChange={e => set("clientName", e.target.value)} />
          </div>
          <div>
            <Label>Client Email</Label>
            <Input type="email" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} autoComplete="email" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Platform</Label>
            <Select value={form.platform} onValueChange={v => set("platform", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Platform Order ID</Label>
            <Input value={form.externalOrderId} onChange={e => set("externalOrderId", e.target.value)} placeholder="e.g. FO12345" />
          </div>
        </div>

        <div>
          <Label>Service</Label>
          <Input value={form.serviceName} onChange={e => set("serviceName", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount Paid ($)</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={form.paymentStatus} onValueChange={v => set("paymentStatus", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid_on_platform">Paid on Platform</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid_direct">Paid Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</> : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
