import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, ChevronLeft, ChevronRight } from "lucide-react";

const actionColors: Record<string, string> = {
  appointment_status_changed: "bg-blue-100 text-blue-800",
  journal_entry_created: "bg-emerald-100 text-emerald-800",
  document_status_changed: "bg-yellow-100 text-yellow-800",
  ron_session_saved: "bg-purple-100 text-purple-800",
};

const PAGE_SIZE = 25;

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (filterAction !== "all") query = query.eq("action", filterAction);
    if (search) query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    if (data) setLogs(data);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, filterAction, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Audit Log</h1>
      <p className="mb-6 text-sm text-muted-foreground">Ohio RON compliance — all digital transactions are logged with timestamps.</p>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
        </div>
        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="appointment_status_changed">Status Changes</SelectItem>
            <SelectItem value="journal_entry_created">Journal Entries</SelectItem>
            <SelectItem value="document_status_changed">Document Changes</SelectItem>
            <SelectItem value="ron_session_saved">RON Sessions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      ) : logs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ScrollText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No audit log entries found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">{log.entity_type || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[300px] truncate">
                          {log.details ? Object.entries(log.details as Record<string, any>).map(([k, v]) => `${k}: ${v}`).join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{total} total entries</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
