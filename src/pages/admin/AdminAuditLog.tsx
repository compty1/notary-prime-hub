import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Search, ChevronLeft, ChevronRight, Download, CalendarIcon, ExternalLink, Rows3, Rows4, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const actionColors: Record<string, string> = {
  appointment_status_changed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  appointment_created_by_admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  journal_entry_created: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  document_status_changed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  document_deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ron_session_saved: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ron_session_completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  payment_marked_paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  apostille_status_changed: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  correspondence_sent: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  verification_created: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  verification_revoked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  client_profile_updated: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  business_verification_changed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  admin_document_view: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  admin_document_download: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
};

const allActions = [
  { value: "appointment_status_changed", label: "Status Changes" },
  { value: "appointment_created_by_admin", label: "Admin Created Appts" },
  { value: "journal_entry_created", label: "Journal Entries" },
  { value: "document_status_changed", label: "Document Changes" },
  { value: "document_deleted", label: "Document Deletions" },
  { value: "ron_session_saved", label: "RON Sessions Saved" },
  { value: "ron_session_completed", label: "RON Completed" },
  { value: "payment_marked_paid", label: "Payments" },
  { value: "apostille_status_changed", label: "Apostille" },
  { value: "correspondence_sent", label: "Correspondence" },
  { value: "verification_created", label: "Verifications Created" },
  { value: "verification_revoked", label: "Verifications Revoked" },
  { value: "client_profile_updated", label: "Profile Updates" },
  { value: "business_verification_changed", label: "Business Verification" },
  { value: "admin_document_view", label: "Admin Doc Views" },
  { value: "admin_document_download", label: "Admin Doc Downloads" },
];

const entityRoutes: Record<string, string> = {
  appointment: "/admin/appointments",
  document: "/admin/documents",
  profile: "/admin/clients",
  e_seal_verification: "/admin/documents",
  payment: "/admin/revenue",
  apostille: "/admin/apostille",
};

const PAGE_SIZE = 25;

interface AuditLogEntry {
  id: string; action: string; entity_type: string | null; entity_id: string | null;
  user_id: string | null; details: unknown;
  old_value_json: unknown; new_value_json: unknown;
  ip_address: string | null; created_at: string;
}

export default function AdminAuditLog() {
  usePageMeta({ title: "Audit Log", noIndex: true });
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [compact, setCompact] = useState(false);

  // URL-synced filters
  const search = searchParams.get("q") || "";
  const filterAction = searchParams.get("action") || "all";
  const page = parseInt(searchParams.get("page") || "0");
  const dateFrom = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const dateTo = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "0") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== "page") params.delete("page");
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = search || filterAction !== "all" || dateFrom || dateTo;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (filterAction !== "all") query = query.eq("action", filterAction);
    if (search) query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    if (dateFrom) query = query.gte("created_at", dateFrom.toISOString());
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const { data, count } = await query;
    if (data) setLogs(data);
    setTotal(count || 0);
    setLastRefreshed(new Date());
    setLoading(false);
  }, [page, filterAction, search, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCSV = async () => {
    let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(999);
    if (filterAction !== "all") query = query.eq("action", filterAction);
    if (dateFrom) query = query.gte("created_at", dateFrom.toISOString());
    if (dateTo) query = query.lte("created_at", new Date(dateTo.getTime() + 86400000).toISOString());
    const { data } = await query;
    if (!data || data.length === 0) return;
    const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "User ID", "IP Address", "Details"];
    const rows = data.map((log) => [
      new Date(log.created_at).toISOString(), log.action, log.entity_type || "", log.entity_id || "",
      log.user_id || "", log.ip_address || "",
      log.details ? JSON.stringify(log.details) : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const getEntityLink = (log: any) => {
    if (!log.entity_type || !log.entity_id) return null;
    const route = entityRoutes[log.entity_type];
    return route || null;
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-sans text-2xl font-bold text-foreground">Audit Log</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCompact(!compact)} title={compact ? "Comfortable view" : "Compact view"}>
            {compact ? <Rows4 className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchLogs}><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-3 w-3" /> Export CSV</Button>
        </div>
      </div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ohio RON compliance — all digital transactions are logged with timestamps.</p>
        <p className="text-xs text-muted-foreground">Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
      </div>

      <div className="mb-4 mt-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search actions or entity types..."
            value={search}
            onChange={(e) => updateParam("q", e.target.value)}
            className="pl-10"
            aria-label="Search audit log entries"
          />
        </div>
        <Select value={filterAction} onValueChange={(v) => updateParam("action", v)}>
          <SelectTrigger className="w-52" aria-label="Filter by action type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {allActions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Date range filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3 w-3" />
              {dateFrom ? format(dateFrom, "MMM d") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={(d) => updateParam("from", d ? d.toISOString().split("T")[0] : "")} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3 w-3" />
              {dateTo ? format(dateTo, "MMM d") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={(d) => updateParam("to", d ? d.toISOString().split("T")[0] : "")} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Audit log entries loading">
                <thead><tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Details</th>
                </tr></thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-32 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ScrollText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">No audit log entries found</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" /> Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="Audit log entries">
                  <thead><tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground" scope="col">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell" scope="col">Details</th>
                  </tr></thead>
                  <tbody>
                    {logs.map((log) => {
                      const entityLink = getEntityLink(log);
                      return (
                        <tr
                          key={log.id}
                          className={cn(
                            "border-b border-border/30 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors",
                            compact ? "text-xs" : ""
                          )}
                          onClick={() => setSelectedLog(log)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && setSelectedLog(log)}
                          role="row"
                        >
                          <td className={cn("px-4 text-muted-foreground whitespace-nowrap", compact ? "py-1.5" : "py-3")}>
                            {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </td>
                          <td className={cn("px-4", compact ? "py-1.5" : "py-3")}>
                            <Badge className={`text-xs ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className={cn("px-4", compact ? "py-1.5" : "py-3")}>
                            {entityLink ? (
                              <Link
                                to={entityLink}
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {log.entity_type || "—"}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-xs">{log.entity_type || "—"}</span>
                            )}
                          </td>
                          <td className={cn("px-4 text-muted-foreground max-w-[300px] truncate hidden md:table-cell", compact ? "py-1.5" : "py-3")} title={log.details ? JSON.stringify(log.details) : ""}>
                            {log.details ? Object.entries(log.details as Record<string, any>).map(([k, v]) => `${k}: ${v}`).join(", ") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{total} total entries</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => updateParam("page", String(page - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => updateParam("page", String(page + 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-sans">Audit Log Detail</SheetTitle>
          </SheetHeader>
          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Timestamp</p>
                <p className="text-sm">{new Date(selectedLog.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Action</p>
                <Badge className={`text-xs ${actionColors[selectedLog.action] || "bg-muted text-muted-foreground"}`}>
                  {selectedLog.action.replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Entity</p>
                <p className="text-sm">{selectedLog.entity_type || "—"} {selectedLog.entity_id ? `(${selectedLog.entity_id.slice(0, 8)}…)` : ""}</p>
              </div>
              {selectedLog.user_id && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">User ID</p>
                  <p className="text-sm font-mono text-xs">{selectedLog.user_id}</p>
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">IP Address</p>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Full Details (JSON)</p>
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                  {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : "No additional details"}
                </pre>
              </div>
              {getEntityLink(selectedLog) && (
                <Link to={getEntityLink(selectedLog)!}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <ExternalLink className="mr-2 h-3 w-3" /> View {selectedLog.entity_type}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
