/**
 * Sprint 6: Compliance Scorecard Widget
 * Dashboard widget showing notary credential status.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, parseISO } from "date-fns";

interface CredentialItem {
  label: string;
  status: "valid" | "expiring" | "expired" | "missing";
  expiresAt?: string;
  daysLeft?: number;
}

export function ComplianceScorecard({ className }: { className?: string }) {
  const { user } = useAuth();

  const { data: credentials = [] } = useQuery({
    queryKey: ["compliance-scorecard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: creds } = await (supabase
        .from("platform_credentials" as never)
        .select("*") as ReturnType<typeof supabase.from>)
        .eq("user_id", user!.id);

      const items: CredentialItem[] = [];
      const now = new Date();

      const checkCred = (label: string, type: string) => {
        const cred = ((creds as Record<string, unknown>[]) ?? []).find((c) => c.credential_type === type);
        if (!cred) {
          items.push({ label, status: "missing" });
        } else if (cred.expiration_date) {
          const days = differenceInDays(parseISO(cred.expiration_date), now);
          items.push({
            label,
            status: days < 0 ? "expired" : days < 60 ? "expiring" : "valid",
            expiresAt: cred.expiration_date,
            daysLeft: days,
          });
        } else {
          items.push({ label, status: "valid" });
        }
      };

      checkCred("Notary Commission", "commission");
      checkCred("E&O Insurance", "eo_insurance");
      checkCred("Surety Bond", "surety_bond");
      checkCred("NNA Membership", "nna_membership");
      checkCred("Background Check", "background_check");

      return items;
    },
  });

  const score = credentials.filter(c => c.status === "valid").length;
  const total = credentials.length || 5;

  const statusIcon = (status: string) => {
    switch (status) {
      case "valid": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "expiring": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "expired": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Compliance Scorecard
          <Badge variant={score === total ? "default" : "secondary"} className="ml-auto">
            {score}/{total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {credentials.map((cred, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-2">
            <div className="flex items-center gap-2">
              {statusIcon(cred.status)}
              <span className="text-sm">{cred.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {cred.status === "expiring" && cred.daysLeft !== undefined && (
                <Badge variant="secondary">{cred.daysLeft}d left</Badge>
              )}
              {cred.status === "expired" && <Badge variant="destructive">Expired</Badge>}
              {cred.status === "missing" && <Badge variant="outline">Missing</Badge>}
              {cred.status === "valid" && <Badge variant="default">Valid</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
