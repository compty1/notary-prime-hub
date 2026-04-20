import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, AlertTriangle, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, format } from "date-fns";

type ExpiringDoc = {
  id: string;
  documentId: string;
  expiryDate: string;
  daysLeft: number;
  notified: boolean;
};

export function DocumentExpiryTracker() {
  const [expiring, setExpiring] = useState<ExpiringDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("document_reminders")
        .select("id, document_id, expiry_date, notified")
        .gte("expiry_date", new Date().toISOString().split("T")[0])
        .order("expiry_date", { ascending: true })
        .limit(20);

      if (data) {
        setExpiring(data.map(d => ({
          id: d.id,
          documentId: d.document_id,
          expiryDate: d.expiry_date,
          daysLeft: differenceInDays(parseISO(d.expiry_date), new Date()),
          notified: d.notified,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const urgencyBadge = (days: number) => {
    if (days <= 7) return <Badge variant="destructive" className="text-[10px]">Urgent</Badge>;
    if (days <= 30) return <Badge className="text-[10px] bg-warning/10 text-warning border-warning/30">Soon</Badge>;
    return <Badge variant="outline" className="text-[10px]">OK</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Expiring Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : expiring.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming expirations</p>
          ) : (
            <div className="space-y-2">
              {expiring.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-sm p-2 rounded border">
                  {doc.daysLeft <= 7 ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{doc.documentId.slice(0, 8)}...</p>
                    <p className="text-[10px] text-muted-foreground">Expires {format(parseISO(doc.expiryDate), "MMM d, yyyy")}</p>
                  </div>
                  {urgencyBadge(doc.daysLeft)}
                  <span className="text-xs font-semibold">{doc.daysLeft}d</span>
                  {doc.notified && <Bell className="h-3 w-3 text-success" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
