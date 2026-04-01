import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, SEVERITIES, autoCategorize } from "./constants";
import type { PlanItem, TrackerItem } from "./constants";
import { useInsertItem, useBulkInsert, useInsertPlan, useTrackerItems } from "./hooks";

export default function AddImportTab() {
  const insert = useInsertItem();
  const bulkInsert = useBulkInsert();
  const insertPlan = useInsertPlan();
  const { data: existingItems = [] } = useTrackerItems();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", category: "gap", severity: "medium",
    impact_area: "", suggested_fix: "", page_route: "",
  });
  const [bulkText, setBulkText] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [planText, setPlanText] = useState("");

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const payload: Record<string, unknown> = { ...form };
    if (!payload.page_route) delete payload.page_route;
    insert.mutate(payload as any);
    setForm({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "", page_route: "" });
  };

  /** Deduplicate against existing items by normalized title */
  const deduplicateLines = (lines: string[]): string[] => {
    const existingTitles = new Set(existingItems.map((i: TrackerItem) => i.title.toLowerCase().trim()));
    const seen = new Set<string>();
    return lines.filter(line => {
      const norm = line.toLowerCase().trim();
      if (existingTitles.has(norm) || seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });
  };

  const handleBulk = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("Enter at least one item"); return; }
    const unique = deduplicateLines(lines);
    if (unique.length === 0) { toast.info("All items already exist — no duplicates imported"); return; }
    const skipped = lines.length - unique.length;
    const items = unique.map((line) => {
      const { category, impact_area } = autoCategorize(line);
      return { title: line, category, severity: "medium", status: "open", impact_area: impact_area || undefined };
    });
    bulkInsert.mutate(items as any[]);
    if (skipped > 0) toast.info(`Skipped ${skipped} duplicate items`);
    setBulkText("");
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
      
      const header = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
      const titleIdx = header.findIndex(h => h === "title" || h === "name" || h === "item");
      const catIdx = header.findIndex(h => h === "category" || h === "cat");
      const sevIdx = header.findIndex(h => h === "severity" || h === "sev" || h === "priority");
      const descIdx = header.findIndex(h => h === "description" || h === "desc");

      if (titleIdx === -1) { toast.error("CSV must have a 'title' column"); return; }

      const items = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
        const title = cols[titleIdx] || "";
        if (!title || title.length < 3) return null;
        const { category: autoCat, impact_area } = autoCategorize(title);
        return {
          title,
          category: (catIdx >= 0 && CATEGORIES.includes(cols[catIdx])) ? cols[catIdx] : autoCat,
          severity: (sevIdx >= 0 && SEVERITIES.includes(cols[sevIdx])) ? cols[sevIdx] : "medium",
          description: descIdx >= 0 ? cols[descIdx] || undefined : undefined,
          status: "open",
          impact_area: impact_area || undefined,
        };
      }).filter(Boolean);

      if (items.length === 0) { toast.error("No valid items found in CSV"); return; }
      bulkInsert.mutate(items as any[]);
      toast.success(`Importing ${items.length} items from CSV`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportPlan = () => {
    if (!planTitle.trim() || !planText.trim()) { toast.error("Title and plan text required"); return; }
    const lines = planText.split("\n").map((l) => l.trim()).filter(Boolean);
    const planItems: PlanItem[] = [];
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      if (cleaned.length > 3) {
        planItems.push({ title: cleaned, status: "pending" });
      }
    }
    if (planItems.length === 0) { toast.error("No items parsed from plan text"); return; }
    insertPlan.mutate({
      plan_title: planTitle,
      plan_items: planItems,
      source: "chat",
      chat_context: planText,
    });
    setPlanTitle("");
    setPlanText("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Add Single Item</CardTitle><CardDescription>Manually add a gap, feature, or issue</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Impact Area (e.g. Booking Flow)" value={form.impact_area} onChange={(e) => setForm((p) => ({ ...p, impact_area: e.target.value }))} />
          <Input placeholder="Page Route (e.g. /book)" value={form.page_route} onChange={(e) => setForm((p) => ({ ...p, page_route: e.target.value }))} />
          <Textarea placeholder="Suggested Fix" value={form.suggested_fix} onChange={(e) => setForm((p) => ({ ...p, suggested_fix: e.target.value }))} rows={2} />
          <Button onClick={handleAdd} disabled={insert.isPending}>{insert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Add Item</Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Bulk Import</CardTitle><CardDescription>One title per line — auto-categorized, deduplicated</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} placeholder={"Rate limiting on forms\nCSRF protection\nRON session timeout..."} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleBulk} variant="outline" disabled={bulkInsert.isPending}>
                {bulkInsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                <Upload className="h-4 w-4 mr-1" /> Import Lines
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={bulkInsert.isPending}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Import CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Import Plan from Chat</CardTitle><CardDescription>Paste a plan from Lovable chat to track implementation</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Plan Title" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
            <Textarea rows={8} placeholder={"Paste plan text here...\n- Task 1\n- Task 2\n- Task 3"} value={planText} onChange={(e) => setPlanText(e.target.value)} />
            <Button onClick={handleImportPlan} variant="outline" disabled={insertPlan.isPending}>
              {insertPlan.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              <Upload className="h-4 w-4 mr-1" /> Import Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
