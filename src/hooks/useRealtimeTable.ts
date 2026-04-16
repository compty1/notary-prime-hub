/**
 * Sprint K — Reusable Supabase realtime subscription hook for any table.
 * Auto-invalidates a react-query key when changes occur, with cleanup.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RealtimeTableOptions {
  table: string;
  /** Filter expression like 'user_id=eq.<uuid>' */
  filter?: string;
  /** Query key(s) to invalidate on change */
  invalidateKeys: ReadonlyArray<readonly unknown[]>;
  /** Disable subscription */
  enabled?: boolean;
  /** Channel suffix to avoid collisions */
  channelSuffix?: string;
}

export function useRealtimeTable({
  table,
  filter,
  invalidateKeys,
  enabled = true,
  channelSuffix = "",
}: RealtimeTableOptions) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const channelName = `rt:${table}:${channelSuffix || filter || "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => {
          invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key as unknown[] }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, enabled, channelSuffix, qc, invalidateKeys]);
}
