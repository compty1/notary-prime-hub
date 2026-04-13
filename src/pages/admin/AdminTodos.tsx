import { usePageMeta } from "@/hooks/usePageMeta";
import TodoPanel from "@/components/TodoPanel";

export default function AdminTodos() {
  usePageMeta({ title: "To-Do List", noIndex: true });
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">To-Do List</h1>
        <p className="text-muted-foreground text-sm">Manage your personal tasks. Press Enter to add, or paste multiple lines for bulk import.</p>
      </div>
      <TodoPanel />
    </div>
  );
}
