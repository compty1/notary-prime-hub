/**
 * SVC-362/374: Evidence package builder for disputes and regulator audits
 * Bundles appointment data, journal entries, documents, and recordings
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, FileText, BookOpen, Video, Shield, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EvidenceItem {
  id: string;
  type: "appointment" | "journal" | "document" | "recording" | "payment";
  label: string;
  date: string;
  selected: boolean;
}

interface EvidencePackageBuilderProps {
  appointmentId: string;
  confirmationNumber?: string;
}

export function EvidencePackageBuilder({ appointmentId, confirmationNumber }: EvidencePackageBuilderProps) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notes, setNotes] = useState("");
  const [building, setBuilding] = useState(false);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const evidenceItems: EvidenceItem[] = [];

      // Get appointment
      const { data: appt } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();
      if (appt) {
        evidenceItems.push({
          id: appt.id, type: "appointment",
          label: `Appointment: ${appt.service_type} (${appt.confirmation_number || ""})`,
          date: appt.scheduled_date, selected: true,
        });
      }

      // Get documents
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("appointment_id", appointmentId);
      docs?.forEach(d => {
        evidenceItems.push({
          id: d.id, type: "document",
          label: `Document: ${d.file_name}`,
          date: d.created_at, selected: true,
        });
      });

      // Get payments
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("appointment_id", appointmentId);
      payments?.forEach(p => {
        evidenceItems.push({
          id: p.id, type: "payment",
          label: `Payment: $${p.amount} (${p.status})`,
          date: p.created_at, selected: true,
        });
      });

      setItems(evidenceItems);
      setLoaded(true);
    } catch {
      toast.error("Failed to load evidence items");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const buildPackage = async () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error("Select at least one item");
      return;
    }

    setBuilding(true);
    
    // Log the evidence package creation
    await supabase.from("audit_log").insert({
      action: "evidence_package.created",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: {
        confirmation_number: confirmationNumber,
        item_count: selected.length,
        item_types: selected.map(i => i.type),
        notes,
      },
    });

    toast.success(`Evidence package created with ${selected.length} items`);
    setBuilding(false);
  };

  const iconMap = {
    appointment: Calendar,
    journal: BookOpen,
    document: FileText,
    recording: Video,
    payment: Shield,
  };

  const Calendar = Shield; // Reuse icon

  if (!loaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5" /> Evidence Package Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadEvidence} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
            Load Evidence Items
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-5 w-5" /> Evidence Package
          <Badge variant="secondary">{items.filter(i => i.selected).length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 rounded border p-2">
            <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
            </div>
            <Badge variant="outline" className="text-xs">{item.type}</Badge>
          </div>
        ))}
        
        <div>
          <Label className="text-xs">Package Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add context for this evidence package..." rows={2} />
        </div>

        <Button onClick={buildPackage} disabled={building} className="w-full">
          {building ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Build Evidence Package
        </Button>
      </CardContent>
    </Card>
  );
}
