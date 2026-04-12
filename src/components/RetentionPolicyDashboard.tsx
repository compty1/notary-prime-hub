/**
 * SVC-169: Data retention policy enforcement UI
 * Shows retention status and allows policy management.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, AlertTriangle } from "lucide-react";
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
          {RETENTION_POLICIES.map((policy: RetentionPolicy) => (
            <div key={policy.dataType} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium capitalize">{policy.dataType.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{policy.description}</p>
                {policy.legalBasis && (
                  <p className="text-xs text-primary mt-0.5">{policy.legalBasis}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {policy.retentionYears === -1 ? "Indefinite" : `${policy.retentionYears} years`}
                </Badge>
                {policy.deletionMethod === "hard_delete" && (
                  <Badge variant="destructive" className="text-xs">Hard Delete</Badge>
                )}
                {policy.deletionMethod === "anonymize" && (
                  <Badge variant="secondary" className="text-xs">Anonymize</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
