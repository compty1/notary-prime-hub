import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, SEVERITIES, autoCategorize } from "./constants";
import type { PlanItem } from "./constants";
import { useInsertItem, useBulkInsert, useInsertPlan } from "./hooks";

export default function AddImportTab() {
  const insert = useInsertItem();
  const bulkInsert = useBulkInsert();
  const insertPlan = useInsertPlan();
  const [form, setForm] = useState({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "", page_route: "" });
  const [bulkText, setBulkText] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [planText, setPlanText] = useState("");

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const payload: any = { ...form };
    if (!payload.page_route) delete payload.page_route;
    insert.mutate(payload);
    setForm({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "", page_route: "" });
  };

  const handleBulk = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("Enter at least one item"); return; }
    const items = lines.map((line) => {
      const { category, impact_area } = autoCategorize(line);
      return { title: line, category, severity: "medium", status: "open", impact_area: impact_area || undefined };
    });
    bulkInsert.mutate(items as any[]);
    setBulkText("");
  };

  const handleImportPlan = () => {
    if (!planTitle.trim() || !planText.trim()) { toast.error("Title and plan text required"); return; }
    // Parse plan text into items: treat lines starting with - or * or numbered as items
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
          <CardHeader><CardTitle className="text-lg">Bulk Import</CardTitle><CardDescription>One title per line — auto-categorized by keywords</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} placeholder={"Rate limiting on forms\nCSRF protection\nRON session timeout..."} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            <Button onClick={handleBulk} variant="outline" disabled={bulkInsert.isPending}>
              {bulkInsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              <Upload className="h-4 w-4 mr-1" /> Import Lines
            </Button>
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
