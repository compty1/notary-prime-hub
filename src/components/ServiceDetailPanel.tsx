import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, FileText, Scale, Loader2 } from "lucide-react";

interface ServiceDetailPanelProps {
  serviceId: string;
  serviceName?: string;
  category?: string;
}

export default function ServiceDetailPanel({ serviceId, serviceName, category }: ServiceDetailPanelProps) {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: reqs }, { data: wfs }] = await Promise.all([
        supabase.from("service_requirements").select("*").eq("service_id", serviceId).order("display_order"),
        supabase.from("service_workflows").select("*").eq("service_id", serviceId).order("step_number"),
      ]);
      if (reqs) setRequirements(reqs);
      if (wfs) setWorkflows(wfs);
      setLoading(false);
    };
    fetch();
  }, [serviceId]);

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (requirements.length === 0 && workflows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No specific requirements or workflow steps configured for this service yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {requirements.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Requirements</h4>
            {requirements.map((req) => (
              <div key={req.id} className="flex items-start gap-2 text-sm">
                <CheckCircle className={`h-3 w-3 mt-1 shrink-0 ${req.is_required ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <span className={req.is_required ? "font-medium" : ""}>{req.description}</span>
                  {req.ohio_statute_ref && (
                    <Badge variant="outline" className="ml-2 text-[10px]"><Scale className="h-2 w-2 mr-1" />{req.ohio_statute_ref}</Badge>
                  )}
                  <Badge variant="outline" className="ml-2 text-[10px]">{req.requirement_type}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {workflows.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-sm font-semibold">Workflow Steps</h4>
            <div className="space-y-3">
              {workflows.map((step, i) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.step_number}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.step_name}</p>
                    {step.step_description && <p className="text-xs text-muted-foreground">{step.step_description}</p>}
                    <div className="flex gap-1 mt-1">
                      {step.requires_client_action && <Badge variant="outline" className="text-[10px]">Client Action</Badge>}
                      {step.requires_admin_action && <Badge variant="outline" className="text-[10px]">Admin Action</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
