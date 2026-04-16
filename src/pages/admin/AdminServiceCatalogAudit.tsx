/**
 * Sprint F — Admin page surfacing service catalog reconciliation.
 */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auditServiceCatalog } from "@/lib/serviceCatalogAudit";
import { AlertTriangle, CheckCircle, Database, RefreshCw } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function AdminServiceCatalogAudit() {
  usePageMeta({ title: "Service Catalog Audit", noIndex: true });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ["service-catalog-audit"],
    queryFn: auditServiceCatalog,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Service Catalog Audit
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconciles the service registry, database `services` table, and pricing rules.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
          <RefreshCw className="h-4 w-4 mr-1" /> Re-run Audit
        </Button>
      </div>

      {isLoading && <Card className="rounded-[24px]"><CardContent className="p-8 text-center text-muted-foreground">Running audit...</CardContent></Card>}

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Registry Entries" value={report.registryCount} icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} />
            <StatCard label="DB Services" value={report.dbCount} icon={<Database className="h-4 w-4 text-primary" />} />
            <StatCard label="Missing Pricing" value={report.missingPricingRules.length} icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} alert={report.missingPricingRules.length > 0} />
            <StatCard label="Orphan DB Rows" value={report.orphanedDbServices.length} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} alert={report.orphanedDbServices.length > 0} />
          </div>

          <AuditSection
            title="Orphaned DB Services (no registry entry)"
            items={report.orphanedDbServices}
            render={(s) => `${s.name} (${s.slug})`}
          />
          <AuditSection
            title="Registry without DB row"
            items={report.registryWithoutDb}
            render={(s) => `${s.name} (${s.slug})`}
          />
          <AuditSection
            title="Services missing pricing rules"
            items={report.missingPricingRules}
            render={(s) => s.name}
          />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, alert }: { label: string; value: number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <Card className={`rounded-[24px] ${alert ? "border-destructive/40" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function AuditSection<T>({ title, items, render }: { title: string; items: T[]; render: (item: T) => string }) {
  return (
    <Card className="rounded-[24px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          {title}
          <Badge variant={items.length === 0 ? "outline" : "destructive"}>{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-emerald-600" /> All clear.
          </p>
        ) : (
          <ScrollArea className="h-48">
            <ul className="space-y-1 text-xs font-mono">
              {items.map((it, i) => <li key={i} className="border-b border-border/50 py-1">{render(it)}</li>)}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
