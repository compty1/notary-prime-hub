/**
 * OPS-002: Fee calculation display with override justification
 * Shows calculated fees and allows admin override with reason
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Edit3, Check, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeeOverridePanelProps {
  appointmentId: string;
  calculatedFee: number;
  currentFee: number | null;
  serviceType: string;
  onUpdate?: (newFee: number) => void;
}

export function FeeOverridePanel({
  appointmentId, calculatedFee, currentFee, serviceType, onUpdate,
}: FeeOverridePanelProps) {
  const [editing, setEditing] = useState(false);
  const [overrideFee, setOverrideFee] = useState(String(currentFee ?? calculatedFee));
  const [justification, setJustification] = useState("");
  const isOverridden = currentFee !== null && currentFee !== calculatedFee;

  const applyOverride = async () => {
    const fee = parseFloat(overrideFee);
    if (isNaN(fee) || fee < 0) {
      toast.error("Enter a valid fee amount");
      return;
    }
    if (!justification.trim()) {
      toast.error("Override justification is required");
      return;
    }

    await supabase.from("appointments").update({
      estimated_price: fee,
      admin_notes: `Fee override: $${calculatedFee} → $${fee}. Reason: ${justification}`,
    }).eq("id", appointmentId);

    await supabase.from("audit_log").insert({
      action: "fee.override",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: {
        original_fee: calculatedFee,
        new_fee: fee,
        justification,
        service_type: serviceType,
      },
    });

    toast.success("Fee updated");
    setEditing(false);
    onUpdate?.(fee);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Fee Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Calculated Fee</span>
          <span className="text-sm font-medium">${calculatedFee.toFixed(2)}</span>
        </div>
        {isOverridden && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-warning" /> Override Applied
            </span>
            <Badge variant="outline" className="text-warning">${currentFee?.toFixed(2)}</Badge>
          </div>
        )}
        
        {editing ? (
          <div className="space-y-2 pt-2 border-t">
            <div>
              <Label className="text-xs">New Fee Amount</Label>
              <Input type="number" step="0.01" value={overrideFee} onChange={e => setOverrideFee(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Justification (required)</Label>
              <Textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} placeholder="Reason for fee override..." />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyOverride} className="flex-1">
                <Check className="mr-1 h-3 w-3" /> Apply
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing(true)}>
            <Edit3 className="mr-1 h-3 w-3" /> Override Fee
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
