import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, CreditCard, Calendar, MessageSquare, Clock, Loader2 } from "lucide-react";

const ACTIVITY_ICONS: Record<string, any> = {
  email: Mail, call: Phone, payment: CreditCard,
  status_change: Calendar, note: MessageSquare, default: Clock,
};

interface Props {
  contactId: string;
  contactType?: string;
}

export function CRMActivityTimeline({ contactId, contactType = "client" }: Props) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("crm_activities")
      .select("*")
      .eq("contact_id", contactId)
      .eq("contact_type", contactType)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setActivities(data || []); setLoading(false); });
  }, [contactId, contactType]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Activity Timeline</CardTitle></CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
        ) : (
          <div className="relative space-y-3 pl-6 before:absolute before:left-2.5 before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-border">
            {activities.map(a => {
              const Icon = ACTIVITY_ICONS[a.activity_type] || ACTIVITY_ICONS.default;
              return (
                <div key={a.id} className="relative">
                  <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.subject}</p>
                    {a.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[10px] mr-1">{a.activity_type}</Badge>
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
