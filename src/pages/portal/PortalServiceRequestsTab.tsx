import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  awaiting_client: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, any> = {
  submitted: AlertTriangle,
  in_progress: Clock,
  completed: CheckCircle,
};

interface Props {
  serviceRequests: any[];
}

export default function PortalServiceRequestsTab({ serviceRequests }: Props) {
  if (serviceRequests.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-foreground">No service requests yet</p>
          <p className="text-sm text-muted-foreground mt-1">When you submit a service request, it will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {serviceRequests.map(req => {
        const Icon = statusIcons[req.status] || FileText;
        return (
          <Card key={req.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{req.service_name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Submitted {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {req.client_visible_status && req.client_visible_status !== "Submitted" && (
                      <p className="text-sm text-primary mt-1">Status: {req.client_visible_status}</p>
                    )}
                    {req.deliverable_url && (
                      <a href={req.deliverable_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 inline-block">
                        Download Deliverable →
                      </a>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[req.status] || "bg-muted text-muted-foreground"}>
                  {req.status.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* Intake summary */}
              {req.intake_data && Object.keys(req.intake_data).length > 0 && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Details</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(req.intake_data).slice(0, 4).map(([key, val]) => (
                      <p key={key} className="text-xs text-muted-foreground truncate">
                        <span className="capitalize">{key.replace(/_/g, " ")}:</span> {String(val)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
