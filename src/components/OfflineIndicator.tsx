import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { processOfflineQueue } from "@/lib/offlineQueue";
import { supabase } from "@/integrations/supabase/client";

/** Default handler for replaying queued offline actions */
async function defaultHandler(action: string, payload: unknown): Promise<boolean> {
  try {
    const p = payload as Record<string, unknown>;
    const table = p.table as string;
    if (!table) return false;
    // Use supabase.from with explicit cast for dynamic table names
    const client = supabase as unknown as { from: (table: string) => { insert: (data: unknown) => Promise<{ error: unknown }>; update: (data: unknown) => { eq: (col: string, val: unknown) => Promise<{ error: unknown }> } } };
    switch (action) {
      case "insert": {
        const { error } = await client.from(table).insert(p.data);
        return !error;
      }
      case "update": {
        const { error } = await client.from(table).update(p.data).eq("id", p.id);
        return !error;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      // Replay queued actions when coming back online (GAP-0003)
      processOfflineQueue(defaultHandler).catch(() => {});
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive shadow-lg backdrop-blur-sm" role="alert" aria-live="assertive">
      <WifiOff className="h-4 w-4" />
      You're offline — changes may not save
    </div>
  );
}
