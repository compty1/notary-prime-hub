/**
 * SVC-224: Searchable audit logs with filters
 * Enhanced audit log viewer with actor, action, date range, and CSV export.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter } from "lucide-react";
import { toast } from "sonner";

interface SearchableAuditLogProps {
  maxRows?: number;
}

export function SearchableAuditLog({ maxRows = 200 }: SearchableAuditLogProps) {
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs-search", actionFilter, dateFrom, dateTo, entityTypeFilter],
    queryFn: async () => {
      let q = supabase
        .from("audit_log")
        .select("id, action, entity_type, entity_id, user_id, created_at, details, ip_address")
        .order("created_at", { ascending: false })
        .limit(maxRows);

      if (actionFilter) q = q.ilike("action", `%${actionFilter}%`);
      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);
      if (entityTypeFilter !== "all") q = q.eq("entity_type", entityTypeFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const handleExportCSV = () => {
    if (!logs?.length) {
      toast.info("No logs to export");
      return;
    }
    const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "User ID", "IP Address"];
    const rows = logs.map(l => [
      l.created_at, l.action, l.entity_type || "", l.entity_id || "",
      l.user_id || "", l.ip_address || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${logs.length} entries`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="w-40"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="w-40"
          placeholder="To"
        />
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="appointment">Appointments</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="consent">Consent</SelectItem>
            <SelectItem value="stripe_webhook">Webhooks</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-1">
          {(logs || []).map(log => (
            <Card key={log.id} className="py-0">
              <CardContent className="flex items-center justify-between py-2 px-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] font-mono">{log.action}</Badge>
                  {log.entity_type && (
                    <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                  )}
                  {log.entity_id && (
                    <span className="text-xs font-mono text-muted-foreground">{log.entity_id.slice(0, 8)}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
          {(!logs || logs.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No audit log entries match your filters</p>
          )}
        </div>
      )}
    </div>
  );
}
