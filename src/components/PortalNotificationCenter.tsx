/**
 * PT-004: In-portal notification center with read/unread state, grouped by type
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Check, CheckCheck, Calendar, FileText, AlertCircle, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "appointment" | "document" | "system" | "payment";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4 text-primary" />,
  document: <FileText className="h-4 w-4 text-blue-500" />,
  system: <Info className="h-4 w-4 text-muted-foreground" />,
  payment: <AlertCircle className="h-4 w-4 text-green-500" />,
};

export function PortalNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    // Build notifications from recent appointments, documents, and audit events
    const fetchNotifications = async () => {
      const built: Notification[] = [];

      // Recent appointment status changes
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, status, service_type, scheduled_date, updated_at")
        .eq("client_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      appts?.forEach((a) => {
        built.push({
          id: `appt-${a.id}`,
          type: "appointment",
          title: `Appointment ${a.status}`,
          message: `${a.service_type} on ${a.scheduled_date} is now ${a.status}.`,
          is_read: false,
          created_at: a.updated_at,
          link: `/portal?tab=appointments`,
        });
      });

      // Recent documents
      const { data: docs } = await supabase
        .from("documents")
        .select("id, file_name, status, updated_at")
        .eq("uploaded_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      docs?.forEach((d) => {
        built.push({
          id: `doc-${d.id}`,
          type: "document",
          title: `Document ${d.status}`,
          message: `${d.file_name} status: ${d.status}`,
          is_read: false,
          created_at: d.updated_at,
          link: `/portal?tab=documents`,
        });
      });

      // Sort by date descending
      built.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(built.slice(0, 30));
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="mb-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="appointment">Appointments</TabsTrigger>
            <TabsTrigger value="document">Documents</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      n.is_read ? "bg-background" : "bg-accent/30"
                    } hover:bg-accent/50`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="mt-0.5">{typeIcons[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.is_read ? "font-normal" : "font-semibold"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
