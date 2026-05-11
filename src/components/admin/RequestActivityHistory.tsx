/**
 * Activity history for a service_request — pulls audit_log entries for the entity.
 * Used inside the AdminServiceRequests detail dialog.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  user_id: string | null;
}

interface Props {
  entityType: string;
  entityId: string;
}

export function RequestActivityHistory({ entityType, entityId }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("audit_log")
        .select("id, action, details, created_at, user_id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) {
        setEntries((data as AuditEntry[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  return (
    <div className="rounded-lg border border-border/50 p-3">
      <Label className="text-sm font-medium flex items-center gap-1 mb-2">
        <History className="h-3 w-3" /> Activity History
      </Label>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-2 max-h-48 overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="text-xs border-l-2 border-border/60 pl-2">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{e.action.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              {e.details && Object.keys(e.details).length > 0 && (
                <p className="text-muted-foreground mt-0.5 break-all">
                  {Object.entries(e.details).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" • ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
