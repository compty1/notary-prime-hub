import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TrackerItem, TrackerPlan, PlanItem } from "./constants";

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
      if (fields.status === "resolved" && !fields.resolved_at) fields.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("build_tracker_items").update(fields as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["build-tracker-items"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { ids: string[]; fields: Partial<TrackerItem> }) => {
      const fields = { ...updates.fields };
      if (fields.status === "resolved" && !fields.resolved_at) fields.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("build_tracker_items").update(fields as any).in("id", updates.ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Bulk update applied"); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Deleted"); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Item added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkInsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Partial<TrackerItem>[]) => {
      const { error } = await supabase.from("build_tracker_items").insert(items as any[]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Bulk import complete"); },
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
      return (data ?? []).map((d: any) => ({
        ...d,
        plan_items: (d.plan_items ?? []) as PlanItem[],
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-plans"] }); toast.success("Plan saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: { id: string; plan_items: PlanItem[] }) => {
      const { error } = await supabase.from("build_tracker_plans").update({ plan_items: update.plan_items as any }).eq("id", update.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-plans"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
