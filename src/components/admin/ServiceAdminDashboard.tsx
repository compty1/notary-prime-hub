/**
 * Sprint 1: Reusable Admin Service Dashboard
 * Renders a filterable, searchable DataTable for any service type.
 * Supports status updates with audit logging, CSV export, and detail panels.
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Search, RefreshCw } from "lucide-react";
import { useAdminServiceRequests, ServiceRequest } from "@/hooks/useServiceScaffold";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed": case "delivered": return "default" as const;
    case "pending": return "secondary" as const;
    case "in_progress": case "review": return "outline" as const;
    case "cancelled": return "destructive" as const;
    default: return "secondary" as const;
  }
};

export interface AdminColumn {
  key: string;
  label: string;
  render?: (row: ServiceRequest) => React.ReactNode;
}

interface ServiceAdminDashboardProps {
  serviceType: string;
  title: string;
  description?: string;
  extraColumns?: AdminColumn[];
  detailPanel?: (request: ServiceRequest) => React.ReactNode;
}

export function ServiceAdminDashboard({
  serviceType,
  title,
  description,
  extraColumns = [],
  detailPanel,
}: ServiceAdminDashboardProps) {
  const { requests, loading, updateStatus, refetch } = useAdminServiceRequests(serviceType);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          r.reference_number?.toLowerCase().includes(s) ||
          r.notes?.toLowerCase().includes(s) ||
          r.status.toLowerCase().includes(s) ||
          JSON.stringify(r.intake_data).toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  const selectedRequest = selectedId ? requests.find(r => r.id === selectedId) : null;

  const exportCsv = () => {
    const headers = ["Reference", "Status", "Priority", "Created", "Notes"];
    const rows = filtered.map(r => [
      r.reference_number || "",
      r.status,
      r.priority || "",
      r.created_at,
      (r.notes || "").replace(/,/g, ";"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceType}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [requests]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.filter(s => s.value !== "all").map(s => (
          <Badge
            key={s.value}
            variant={statusFilter === s.value ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setStatusFilter(statusFilter === s.value ? "all" : s.value)}
          >
            {s.label} ({statusCounts[s.value] || 0})
          </Badge>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search requests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: selectedRequest && detailPanel ? "1fr 1fr" : "1fr" }}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    {extraColumns.map(col => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5 + extraColumns.length} className="text-center py-8 text-muted-foreground">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(req => (
                      <TableRow
                        key={req.id}
                        className={`cursor-pointer ${selectedId === req.id ? "bg-muted" : ""}`}
                        onClick={() => setSelectedId(req.id === selectedId ? null : req.id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {req.reference_number || req.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={req.status}
                            onValueChange={v => updateStatus(req.id, v)}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <Badge variant={statusBadgeVariant(req.status)} className="text-xs">
                                {req.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.filter(s => s.value !== "all").map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {req.priority || "normal"}
                          </Badge>
                        </TableCell>
                        {extraColumns.map(col => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(req) : ((req as Record<string, unknown>)[col.key])}
                          </TableCell>
                        ))}
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(req.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.stopPropagation(); setSelectedId(req.id); }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedRequest && detailPanel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Request Details — {selectedRequest.reference_number}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detailPanel(selectedRequest)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
