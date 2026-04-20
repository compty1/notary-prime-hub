import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, CreditCard, MessageSquare, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, parseISO } from "date-fns";

type ActivityItem = {
  id: string;
  type: "appointment" | "document" | "payment" | "message" | "login";
  title: string;
  timestamp: string;
  detail?: string;
};

const ICONS: Record<string, React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4 text-info" />,
  document: <FileText className="h-4 w-4 text-success" />,
  payment: <CreditCard className="h-4 w-4 text-purple-500" />,
  message: <MessageSquare className="h-4 w-4 text-warning" />,
  login: <UserCheck className="h-4 w-4 text-muted-foreground" />,
};

interface ClientActivityFeedProps {
  clientId: string;
}

export function ClientActivityFeed({ clientId }: ClientActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const items: ActivityItem[] = [];

      // Fetch appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, service_type, status, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);

      appts?.forEach(a => items.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: `${a.service_type} — ${a.status}`,
        timestamp: a.created_at,
      }));

      // Fetch documents
      const { data: docs } = await supabase
        .from("documents")
        .select("id, file_name, status, created_at")
        .eq("uploaded_by", clientId)
        .order("created_at", { ascending: false })
        .limit(10);

      docs?.forEach(d => items.push({
        id: `doc-${d.id}`,
        type: "document",
        title: `Uploaded: ${d.file_name}`,
        timestamp: d.created_at,
        detail: d.status,
      }));

      // Fetch audit entries
      const { data: audits } = await supabase
        .from("audit_log")
        .select("id, action, created_at")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5);

      audits?.forEach(a => items.push({
        id: `audit-${a.id}`,
        type: "login",
        title: a.action.replace(/_/g, " "),
        timestamp: a.created_at,
      }));

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 20));
      setLoading(false);
    };

    if (clientId) load();
  }, [clientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity found</p>
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="mt-0.5">{ICONS[act.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(act.timestamp), { addSuffix: true })}
                      </span>
                      {act.detail && <Badge variant="outline" className="text-[10px]">{act.detail}</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
