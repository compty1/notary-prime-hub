import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TrackerItem, TrackerPlan, PlanItem } from "./constants";
import { autoCategorize, STATUS } from "./constants";

const ALL_KEYS = ["build-tracker-items", "build-tracker-plans"];

export function useTrackerItems() {
  return useQuery({
    queryKey: ["build-tracker-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_tracker_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TrackerItem[];
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: { id: string } & Partial<TrackerItem>) => {
      const { id, ...fields } = update;
      if (fields.status === STATUS.RESOLVED && !fields.resolved_at) fields.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("build_tracker_items").update(fields as Record<string, unknown>).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { ids: string[]; fields: Partial<TrackerItem> }) => {
      const fields = { ...updates.fields };
      if (fields.status === STATUS.RESOLVED && !fields.resolved_at) fields.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("build_tracker_items").update(fields as Record<string, unknown>).in("id", updates.ids);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); toast.success("Bulk update applied"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("build_tracker_items").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInsertItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<TrackerItem>) => {
      const { error } = await supabase.from("build_tracker_items").insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); toast.success("Item added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkInsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Partial<TrackerItem>[]) => {
      if (items.length > 100) throw new Error("Bulk import limited to 100 items at a time");
      const { error } = await supabase.from("build_tracker_items").insert(items as any[]);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); toast.success("Bulk import complete"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ─── Plan hooks ─── */
export function usePlans() {
  return useQuery({
    queryKey: ["build-tracker-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_tracker_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d: Record<string, unknown>) => ({
        ...d,
        plan_items: ((d.plan_items as PlanItem[]) ?? []),
      })) as TrackerPlan[];
    },
  });
}

export function useInsertPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: { plan_title: string; plan_summary?: string; plan_items: PlanItem[]; source: string; chat_context?: string }) => {
      const { error } = await supabase.from("build_tracker_plans").insert(plan as any);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); toast.success("Plan saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: { id: string; plan_items: PlanItem[] }) => {
      const { error } = await supabase.from("build_tracker_plans").update({ plan_items: update.plan_items as unknown } as Record<string, unknown>).eq("id", update.id);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("build_tracker_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] })); toast.success("Plan deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ─── Refresh all build tracker data ─── */
export function useRefreshAll() {
  const qc = useQueryClient();
  return () => ALL_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] }));
}

/* ─── Deep re-analysis ─── */
export function useReanalyze(items: TrackerItem[]) {
  const bulkUpdate = useBulkUpdate();

  return async () => {
    const findings: string[] = [];

    // 1. Flag stale resolved items (resolved without timestamp)
    const staleResolved = items.filter(i => i.status === STATUS.RESOLVED && !i.resolved_at);
    if (staleResolved.length > 0) {
      await bulkUpdate.mutateAsync({ ids: staleResolved.map(i => i.id), fields: { status: STATUS.OPEN } });
      findings.push(`Re-opened ${staleResolved.length} stale resolved items`);
    }

    // 2. Auto-categorize items missing category or impact_area
    const uncategorized = items.filter(i => i.category === "gap" && !i.impact_area);
    const toAutoUpdate: { id: string; fields: Partial<TrackerItem> }[] = [];
    if (uncategorized.length > 0) {
      for (const item of uncategorized.slice(0, 50)) {
        const auto = autoCategorize(item.title);
        if (auto.category !== "gap" || auto.impact_area) {
          toAutoUpdate.push({ id: item.id, fields: { category: auto.category, impact_area: auto.impact_area } });
        }
      }
      if (toAutoUpdate.length > 0) {
        const byFields = new Map<string, string[]>();
        for (const u of toAutoUpdate) {
          const key = JSON.stringify(u.fields);
          byFields.set(key, [...(byFields.get(key) || []), u.id]);
        }
        for (const [fieldsJson, ids] of byFields) {
          await bulkUpdate.mutateAsync({ ids, fields: JSON.parse(fieldsJson) });
        }
        findings.push(`Auto-categorized ${toAutoUpdate.length} items`);
      }
    }

    // 3. Check for potential duplicate titles
    const titleMap = new Map<string, TrackerItem[]>();
    items.forEach(i => {
      const key = i.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
      if (key.length >= 5) {
        titleMap.set(key, [...(titleMap.get(key) || []), i]);
      }
    });
    const dupes = Array.from(titleMap.values()).filter(v => v.length > 1);
    if (dupes.length > 0) findings.push(`Found ${dupes.length} potential duplicate groups`);

    // 4. Flag old open items (>30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const staleOpen = items.filter(i => i.status === STATUS.OPEN && i.created_at && i.created_at < thirtyDaysAgo);
    if (staleOpen.length > 0) findings.push(`${staleOpen.length} open items older than 30 days`);

    // 5. Items with no description or suggested_fix
    const incomplete = items.filter(i => i.status !== STATUS.RESOLVED && i.status !== STATUS.WONT_FIX && !i.description && !i.suggested_fix);
    if (incomplete.length > 0) findings.push(`${incomplete.length} items missing description & suggested fix`);

    if (findings.length === 0) {
      toast.info("Analysis complete — no issues found");
    } else {
      toast.success(`Analysis complete: ${findings.join("; ")}`);
    }

    return findings;
  };
}
