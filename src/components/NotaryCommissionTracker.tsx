import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Shield, Clock, RefreshCw } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

type CommissionStatus = {
  notaryName: string;
  commissionExpiry: string | null;
  bondExpiry: string | null;
  eoInsuranceExpiry: string | null;
  status: "active" | "expiring" | "expired";
};

export function NotaryCommissionTracker() {
  const [commissions, setCommissions] = useState<CommissionStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase
        .from("platform_credentials" as never)
        .select("user_id, credential_type, expiration_date, status") as ReturnType<typeof supabase.from>)
        .in("credential_type", ["notary_commission", "surety_bond", "eo_insurance"])
        .order("expiration_date", { ascending: true });

      if (!data) { setLoading(false); return; }

      // Group by user
      const map = new Map<string, Partial<CommissionStatus>>();
      for (const row of data as Record<string, unknown>[]) {
        const existing = map.get(row.user_id) || {};
        if (row.credential_type === "notary_commission") {
          existing.commissionExpiry = row.expiration_date;
        } else if (row.credential_type === "surety_bond") {
          existing.bondExpiry = row.expiration_date;
        } else if (row.credential_type === "eo_insurance") {
          existing.eoInsuranceExpiry = row.expiration_date;
        }
        map.set(row.user_id, existing);
      }

      // Get names
      const userIds = Array.from(map.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name || "Unknown"]) ?? []);

      const now = new Date();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      const results: CommissionStatus[] = Array.from(map.entries()).map(([uid, creds]) => {
        const dates = [creds.commissionExpiry, creds.bondExpiry, creds.eoInsuranceExpiry]
          .filter(Boolean)
          .map(d => new Date(d!).getTime());

        const earliest = dates.length > 0 ? Math.min(...dates) : Infinity;
        let status: CommissionStatus["status"] = "active";
        if (earliest < now.getTime()) status = "expired";
        else if (earliest - now.getTime() < thirtyDays) status = "expiring";

        return {
          notaryName: nameMap.get(uid) ?? "Unknown",
          commissionExpiry: creds.commissionExpiry ?? null,
          bondExpiry: creds.bondExpiry ?? null,
          eoInsuranceExpiry: creds.eoInsuranceExpiry ?? null,
          status,
        };
      });

      setCommissions(results);
      setLoading(false);
    };
    load();
  }, []);

  const statusBadge = (s: CommissionStatus["status"]) => {
    const map = {
      active: "bg-green-500/10 text-green-600 border-green-500/30",
      expiring: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
      expired: "bg-red-500/10 text-red-600 border-red-500/30",
    };
    return <Badge variant="outline" className={`text-[10px] ${map[s]}`}>{s}</Badge>;
  };

  const formatExpiry = (d: string | null) => {
    if (!d) return "Not set";
    const date = parseISO(d);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" /> Notary Commission Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notary credentials found</p>
        ) : (
          <div className="space-y-3">
            {commissions.map((c, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{c.notaryName}</span>
                  {statusBadge(c.status)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <div>
                    <span className="block font-medium">Commission</span>
                    <span>{formatExpiry(c.commissionExpiry)}</span>
                  </div>
                  <div>
                    <span className="block font-medium">Surety Bond</span>
                    <span>{formatExpiry(c.bondExpiry)}</span>
                  </div>
                  <div>
                    <span className="block font-medium">E&O Insurance</span>
                    <span>{formatExpiry(c.eoInsuranceExpiry)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
