import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CheckCircle2, ArrowUp, ArrowDown, StickyNote } from "lucide-react";
import type { TrackerItem } from "./constants";
import { CATEGORIES, SEVERITIES, STATUSES, severityColor, statusIcon } from "./constants";
import { useUpdateItem, useBulkUpdate } from "./hooks";

export default function TodoTab({ items }: { items: TrackerItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [todoCatFilter, setTodoCatFilter] = useState("all");
  const [todoSevFilter, setTodoSevFilter] = useState("all");
  const update = useUpdateItem();
  const bulk = useBulkUpdate();

  const todoItems = useMemo(() => {
    let list = items.filter((i) => i.is_on_todo);
    if (todoCatFilter !== "all") list = list.filter((i) => i.category === todoCatFilter);
    if (todoSevFilter !== "all") list = list.filter((i) => i.severity === todoSevFilter);
    return list.sort((a, b) => (a.todo_priority ?? 999) - (b.todo_priority ?? 999));
  }, [items, todoCatFilter, todoSevFilter]);

  const nonTodoOpen = useMemo(() => items.filter((i) => !i.is_on_todo && (i.status === "open" || i.status === "in_progress")), [items]);

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = todoItems.length > 0 && todoItems.every((i) => selected.has(i.id));

  const movePriority = (id: string, dir: -1 | 1) => {
    const idx = todoItems.findIndex((i) => i.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= todoItems.length) return;
    const itemA = todoItems[idx];
    const itemB = todoItems[swapIdx];
    update.mutate({ id: itemA.id, todo_priority: swapIdx });
    setTimeout(() => update.mutate({ id: itemB.id, todo_priority: idx }), 50);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={todoCatFilter === c ? "default" : "outline"} className="text-xs h-7"
            onClick={() => setTodoCatFilter(todoCatFilter === c ? "all" : c)}>{c}</Button>
        ))}
        <span className="text-muted-foreground mx-1">|</span>
        {SEVERITIES.map((s) => (
          <Badge key={s} className={`cursor-pointer text-xs ${todoSevFilter === s ? severityColor[s] : "bg-muted text-muted-foreground"}`}
            onClick={() => setTodoSevFilter(todoSevFilter === s ? "all" : s)}>{s}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? setSelected(new Set()) : setSelected(new Set(todoItems.map((i) => i.id)))} />
        <span className="text-sm text-muted-foreground mr-2">{selected.size} selected</span>
        <Button size="sm" variant="outline" disabled={nonTodoOpen.length === 0}
          onClick={() => bulk.mutate({ ids: nonTodoOpen.map((i) => i.id), fields: { is_on_todo: true } })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add All Open ({nonTodoOpen.length})
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0}
          onClick={() => { bulk.mutate({ ids: [...selected], fields: { status: "resolved", is_on_todo: false } }); setSelected(new Set()); }}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Done
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0}
          onClick={() => { bulk.mutate({ ids: [...selected], fields: { is_on_todo: false } }); setSelected(new Set()); }}>
          Remove from To-Do
        </Button>
      </div>

      {todoItems.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No to-do items. Add from Gap Analysis or use "Add All Open".</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {todoItems.map((item, idx) => (
            <Card key={item.id} className={`transition-all ${selected.has(item.id) ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.title}</span>
                      <Badge className={`text-xs ${severityColor[item.severity]}`}>{item.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      <Select value={item.status} onValueChange={(v) => {
                        const fields: Partial<TrackerItem> = { status: v };
                        if (v === "resolved") fields.is_on_todo = false;
                        update.mutate({ id: item.id, ...fields });
                      }}>
                        <SelectTrigger className="h-6 text-xs w-auto min-w-[100px]">
                          <span className="flex items-center gap-1">{statusIcon[item.status]}{item.status.replace("_", " ")}</span>
                        </SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {item.suggested_fix && <p className="text-sm text-muted-foreground mt-1">{item.suggested_fix}</p>}
                    <div className="mt-2 flex items-start gap-2">
                      <StickyNote className="h-3.5 w-3.5 mt-1 text-muted-foreground shrink-0" />
                      <Textarea rows={2} className="text-xs"
                        value={editingNotes[item.id] ?? item.admin_notes ?? ""}
                        onChange={(e) => setEditingNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                        placeholder="Add notes..." />
                      <Button size="sm" variant="ghost" onClick={() => {
                        update.mutate({ id: item.id, admin_notes: editingNotes[item.id] ?? item.admin_notes ?? "" });
                        toast.success("Saved");
                      }}>Save</Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => movePriority(item.id, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === todoItems.length - 1} onClick={() => movePriority(item.id, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
