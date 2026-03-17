import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100);
      if (data) setLogs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Audit Log</h1>
      <p className="mb-4 text-sm text-muted-foreground">Ohio RON compliance — all digital transactions are logged with timestamps.</p>

      {logs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ScrollText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No audit log entries yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3">{log.entity_type || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.details ? JSON.stringify(log.details) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
