import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { AUTH_TEMPLATES } from "../AdminProcessFlows";

interface EmailTemplatesTabProps {
  globalTemplates: Record<string, string>;
  services: any[];
  onEdit: (key: string, value: string, scope: string) => void;
}

export default function EmailTemplatesTab({ globalTemplates, services, onEdit }: EmailTemplatesTabProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-black text-sm text-foreground uppercase tracking-widest">Global Email Templates</h3>
      <div className="space-y-2">
        {Object.entries(globalTemplates).map(([key, value]) => (
          <Card key={key} className="rounded-[20px] border-2 border-[hsl(220,10%,90%)] shadow-[3px_3px_0px_hsl(220,10%,85%)]">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{key.replace("email_template_", "").replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{value.slice(0, 100)}…</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold border-2" onClick={() => onEdit(key, value, "global")}>
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
        {Object.keys(globalTemplates).length === 0 && (
          <p className="text-sm text-muted-foreground">No global email templates configured in platform settings.</p>
        )}
      </div>

      <h3 className="font-black text-sm text-foreground uppercase tracking-widest mt-6">Per-Service Email Overrides</h3>
      <div className="space-y-2">
        {services.filter(s => s.email_templates && Object.keys(s.email_templates).length > 0).map(svc => (
          <Card key={svc.id} className="rounded-[20px] border-2 border-[hsl(220,10%,90%)] shadow-[3px_3px_0px_hsl(220,10%,85%)]">
            <CardContent className="p-3">
              <p className="text-sm font-black text-foreground mb-2">{svc.name}</p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(svc.email_templates || {}).map(tplKey => (
                  <Badge key={tplKey} variant="outline" className="text-[10px] rounded-md font-bold border-2">
                    {tplKey.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {services.filter(s => s.email_templates && Object.keys(s.email_templates).length > 0).length === 0 && (
          <p className="text-sm text-muted-foreground">No per-service email overrides configured.</p>
        )}
      </div>

      <h3 className="font-black text-sm text-foreground uppercase tracking-widest mt-6">Auth Email Templates</h3>
      <div className="flex flex-wrap gap-2">
        {AUTH_TEMPLATES.map(t => (
          <Badge key={t} className="bg-[hsl(220,10%,95%)] text-muted-foreground rounded-lg font-bold">
            <Mail className="h-3 w-3 mr-1" /> {t}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Auth templates are defined in <code className="bg-[hsl(220,10%,95%)] px-1 py-0.5 rounded text-[10px] font-bold">supabase/functions/_shared/email-templates/</code> and deployed via the auth-email-hook edge function.</p>
    </div>
  );
}
