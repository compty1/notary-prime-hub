import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Globe, Shield, Lock } from "lucide-react";
import { PAGE_REGISTRY, type PageEntry } from "./pageRegistry";
import type { TrackerItem } from "./constants";
import { CATEGORIES, SEVERITIES } from "./constants";
import { useInsertItem } from "./hooks";

type Props = {
  items: TrackerItem[];
};

export default function PageAuditorTab({ items }: Props) {
  const [search, setSearch] = useState("");
  const [protFilter, setProtFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [addForRoute, setAddForRoute] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState("gap");
  const [addSeverity, setAddSeverity] = useState("medium");
  const [addDesc, setAddDesc] = useState("");
  const insert = useInsertItem();

  const issuesByRoute = useMemo(() => {
    const map: Record<string, TrackerItem[]> = {};
    items.forEach((i) => {
      if (i.page_route) {
        if (!map[i.page_route]) map[i.page_route] = [];
        map[i.page_route].push(i);
      }
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    return PAGE_REGISTRY.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || p.route.toLowerCase().includes(q) || p.component.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchesProt = protFilter === "all" || p.protection === protFilter;
      const hasIssues = (issuesByRoute[p.route]?.length ?? 0) > 0;
      const matchesIssue = issueFilter === "all" || (issueFilter === "with" && hasIssues) || (issueFilter === "without" && !hasIssues);
      return matchesSearch && matchesProt && matchesIssue;
    });
  }, [search, protFilter, issueFilter, issuesByRoute]);

  const protIcon = (p: string) => {
    if (p === "public") return <Globe className="h-3.5 w-3.5 text-success" />;
    if (p === "auth") return <Lock className="h-3.5 w-3.5 text-info" />;
    return <Shield className="h-3.5 w-3.5 text-warning" />;
  };

  const handleAdd = () => {
    if (!addTitle.trim() || !addForRoute) return;
    insert.mutate({ title: addTitle, category: addCategory, severity: addSeverity, description: addDesc || undefined, page_route: addForRoute, status: "open" });
    setAddTitle(""); setAddDesc(""); setAddForRoute(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        All {PAGE_REGISTRY.length} routes in the application. Click + to add an issue scoped to a specific page.
      </p>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search routes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={protFilter} onValueChange={setProtFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Protection" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="auth">Auth Required</SelectItem>
            <SelectItem value="admin">Admin Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={issueFilter} onValueChange={setIssueFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Issues" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="with">With Issues</SelectItem>
            <SelectItem value="without">Without Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} pages shown</p>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader data-no-glossary="true">
            <TableRow>
              <TableHead className="w-[200px]">Route</TableHead>
              <TableHead className="w-[160px]">Component</TableHead>
              <TableHead className="w-[100px]">Protection</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[80px]">Issues</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((page) => {
              const issues = issuesByRoute[page.route] ?? [];
              const openIssues = issues.filter((i) => i.status === "open" || i.status === "in_progress");
              return (
                <TableRow key={page.route}>
                  <TableCell className="font-mono text-xs">{page.route}</TableCell>
                  <TableCell className="text-xs">{page.component}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs">
                      {protIcon(page.protection)}{page.protection}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{page.category}</Badge></TableCell>
                  <TableCell>
                    {openIssues.length > 0 ? (
                      <Badge className="bg-destructive text-destructive-foreground text-xs">{openIssues.length}</Badge>
                    ) : issues.length > 0 ? (
                      <Badge variant="outline" className="text-xs text-success">{issues.length} ✓</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddForRoute(page.route); setAddTitle(""); setAddDesc(""); }} aria-label="Action">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!addForRoute} onOpenChange={(o) => !o && setAddForRoute(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Issue for {addForRoute}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input autoFocus placeholder="Issue title" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} />
            <Textarea placeholder="Description (optional)" value={addDesc} onChange={(e) => setAddDesc(e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={addSeverity} onValueChange={setAddSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} className="w-full">Add Issue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
