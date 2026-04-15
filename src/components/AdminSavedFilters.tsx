/**
 * Saved filters component for admin tables.
 * Item 678: Save and recall filter combinations.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bookmark, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminSavedFiltersProps {
  pageKey: string;
  currentFilters: Record<string, unknown>;
  onApplyFilter: (config: Record<string, unknown>) => void;
}

export function AdminSavedFilters({ pageKey, currentFilters, onApplyFilter }: AdminSavedFiltersProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("admin_saved_filters")
      .select("*")
      .eq("user_id", user.id)
      .eq("page_key", pageKey)
      .order("created_at")
      .then(({ data }) => {
        if (data) setFilters(data);
      });
  }, [user, pageKey]);

  const saveFilter = async () => {
    if (!newName.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("admin_saved_filters")
      .insert({
        user_id: user.id,
        page_key: pageKey,
        filter_name: newName.trim(),
        filter_config: JSON.parse(JSON.stringify(currentFilters)),
      })
      .select()
      .single();
    if (error) toast.error("Failed to save filter");
    else if (data) {
      setFilters(prev => [...prev, data]);
      setNewName("");
      toast.success("Filter saved");
    }
    setSaving(false);
  };

  const deleteFilter = async (id: string) => {
    await supabase.from("admin_saved_filters").delete().eq("id", id);
    setFilters(prev => prev.filter(f => f.id !== id));
    toast.success("Filter removed");
  };

  const applyFilter = (config: any) => {
    onApplyFilter(config);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-3.5 w-3.5 mr-1" /> Saved Filters {filters.length > 0 && `(${filters.length})`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Saved Filters</p>
          {filters.length === 0 && (
            <p className="text-xs text-muted-foreground">No saved filters yet.</p>
          )}
          {filters.map(f => (
            <div key={f.id} className="flex items-center justify-between text-sm">
              <button onClick={() => applyFilter(f.filter_config)} className="text-left hover:text-primary truncate flex-1">
                {f.filter_name}
              </button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteFilter(f.id)}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <div className="flex gap-1 pt-1 border-t border-border">
            <Input
              placeholder="Filter name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={e => e.key === "Enter" && saveFilter()}
            />
            <Button size="sm" className="h-7 px-2" onClick={saveFilter} disabled={saving || !newName.trim()}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
