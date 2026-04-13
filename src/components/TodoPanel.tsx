/**
 * Sprint 7: TodoPanel — personal todo list with Enter-to-add and bulk paste support.
 */
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export default function TodoPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["user_todos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_todos")
        .select("*")
        .order("is_completed")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Todo[];
    },
    enabled: !!user,
  });

  const addTodos = useMutation({
    mutationFn: async (titles: string[]) => {
      const maxOrder = todos.reduce((m, t) => Math.max(m, t.sort_order), 0);
      const rows = titles.map((title, i) => ({
        user_id: user!.id,
        title: title.trim(),
        sort_order: maxOrder + i + 1,
      }));
      const { error } = await supabase.from("user_todos").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_todos"] });
      setNewTitle("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("user_todos").update({ is_completed: completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_todos"] }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_todos"] }),
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && newTitle.trim()) {
        e.preventDefault();
        // Support multi-line paste: split by newlines
        const lines = newTitle.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) addTodos.mutate(lines);
      }
    },
    [newTitle, addTodos]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      if (text.includes("\n")) {
        e.preventDefault();
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          addTodos.mutate(lines);
          toast.success(`${lines.length} items added`);
        }
      }
    },
    [addTodos]
  );

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const lines = newTitle.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) addTodos.mutate(lines);
  };

  const active = todos.filter((t) => !t.is_completed);
  const completed = todos.filter((t) => t.is_completed);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Add a todo… (paste multiple lines for bulk add)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim() || addTodos.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-8">Loading…</div>
      ) : todos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No to-do items yet. Type above and press Enter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {active.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group">
              <Checkbox
                checked={false}
                onCheckedChange={() => toggleTodo.mutate({ id: t.id, completed: true })}
              />
              <span className="flex-1 text-sm">{t.title}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteTodo.mutate(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {completed.length > 0 && (
            <div className="pt-3 border-t mt-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Completed ({completed.length})</p>
              {completed.map((t) => (
                <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 group">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => toggleTodo.mutate({ id: t.id, completed: false })}
                  />
                  <span className="flex-1 text-sm line-through text-muted-foreground">{t.title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteTodo.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
