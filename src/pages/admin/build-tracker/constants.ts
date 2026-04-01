import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { createElement } from "react";
import { formatDistanceToNow } from "date-fns";

export type TrackerItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  impact_area: string | null;
  suggested_fix: string | null;
  is_on_todo: boolean;
  todo_priority: number | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  flow_steps?: any;
  page_route?: string | null;
  plan_id?: string | null;
};

export type TrackerPlan = {
  id: string;
  plan_title: string;
  plan_summary: string | null;
  plan_items: PlanItem[];
  source: string;
  chat_context: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanItem = {
  title: string;
  status: "pending" | "implemented" | "partial";
  tracker_item_id?: string;
};

export const CATEGORIES = [
  "gap", "feature", "workflow", "security", "compliance", "ux", "seo",
  "performance", "brand", "integration", "mobile", "accessibility", "data",
];

export const SEVERITIES = ["critical", "high", "medium", "low", "info"];
export const STATUSES = ["open", "in_progress", "resolved", "deferred", "wont_fix"];
export const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500/90 text-white",
  medium: "bg-yellow-500/90 text-white",
  low: "bg-blue-500/80 text-white",
  info: "bg-muted text-muted-foreground",
};

export const statusIcon: Record<string, React.ReactNode> = {
  open: createElement(AlertTriangle, { className: "h-3.5 w-3.5 text-yellow-500" }),
  in_progress: createElement(Clock, { className: "h-3.5 w-3.5 text-blue-500" }),
  resolved: createElement(CheckCircle2, { className: "h-3.5 w-3.5 text-green-500" }),
  deferred: createElement(XCircle, { className: "h-3.5 w-3.5 text-muted-foreground" }),
  wont_fix: createElement(XCircle, { className: "h-3.5 w-3.5 text-muted-foreground" }),
};

export const sevColors: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#3b82f6", info: "#94a3b8",
};

export type SortField = "title" | "category" | "severity" | "status" | "impact_area" | "updated_at";
export type SortDir = "asc" | "desc";

export function sortItems(items: TrackerItem[], field: SortField, dir: SortDir): TrackerItem[] {
  const m = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (field === "severity") return m * ((SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9));
    if (field === "updated_at") return m * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    const av = (a[field] ?? "") as string;
    const bv = (b[field] ?? "") as string;
    return m * av.localeCompare(bv);
  });
}

export function relTime(d: string | null) {
  if (!d) return "—";
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true });
  } catch { return "—"; }
}

/** Auto-categorize based on title keywords */
export function autoCategorize(title: string): { category: string; impact_area: string } {
  const t = title.toLowerCase();
  const map: [string[], string, string][] = [
    [["security", "csrf", "xss", "auth", "rls", "password"], "security", "Security"],
    [["ron", "remote", "notariz", "e-seal", "kba"], "compliance", "RON Session"],
    [["booking", "appointment", "schedule"], "workflow", "Booking Flow"],
    [["payment", "stripe", "invoice", "billing"], "integration", "Payment"],
    [["email", "ionos", "smtp", "imap"], "integration", "Email System"],
    [["brand", "logo", "color", "font", "theme"], "brand", "Brand"],
    [["mobile", "responsive", "viewport"], "mobile", "Mobile"],
    [["seo", "meta", "title tag", "og:"], "seo", "SEO"],
    [["performance", "speed", "lazy", "bundle"], "performance", "Performance"],
    [["portal", "client portal", "dashboard"], "workflow", "Client Portal"],
    [["document", "upload", "file"], "workflow", "Document Flow"],
    [["lead", "crm", "contact"], "workflow", "Lead Capture"],
    [["accessible", "aria", "screen reader"], "accessibility", "Accessibility"],
  ];
  for (const [keywords, cat, area] of map) {
    if (keywords.some((k) => t.includes(k))) return { category: cat, impact_area: area };
  }
  return { category: "gap", impact_area: "" };
}

export function exportCSV(items: TrackerItem[]) {
  const headers = ["Title", "Category", "Severity", "Status", "Impact Area", "Page Route", "Description", "Suggested Fix", "Admin Notes", "On To-Do", "Updated At"];
  const rows = items.map((i) => [
    i.title, i.category, i.severity, i.status, i.impact_area ?? "", i.page_route ?? "",
    i.description ?? "", i.suggested_fix ?? "", i.admin_notes ?? "", i.is_on_todo ? "Yes" : "No", i.updated_at,
  ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
  const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `build-tracker-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}
