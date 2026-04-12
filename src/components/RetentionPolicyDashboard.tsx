/**
 * SVC-169: Data retention policy enforcement UI
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield } from "lucide-react";
import { RETENTION_POLICIES, type RetentionPolicy } from "@/lib/retentionPolicies";

export function RetentionPolicyDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" /> Data Retention Policies
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {RETENTION_POLICIES.map((policy: RetentionPolicy) => {
            const years = Math.round(policy.retentionDays / 365);
            return (
              <div key={policy.dataType} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{policy.dataType}</p>
                  <p className="text-xs text-muted-foreground">{policy.notes}</p>
                  {policy.legalBasis && (
                    <p className="text-xs text-primary mt-0.5">{policy.legalBasis}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {policy.retentionDays === -1 ? "Indefinite" : `${years} years`}
                  </Badge>
                  {policy.canBeDeleted ? (
                    <Badge variant="secondary" className="text-xs">Deletable</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Protected</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
