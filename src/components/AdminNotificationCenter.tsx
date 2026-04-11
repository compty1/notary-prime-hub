import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, MessageSquare, FileText, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "appointment" | "message" | "document";
  title: string;
  description: string;
  time: string;
  link: string;
  read: boolean;
}

export function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const now = new Date();
    const items: Notification[] = [];

    // Fetch upcoming appointments (next 24h)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_date, scheduled_time, service_type, status")
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_date", now.toISOString().split("T")[0])
      .lte("scheduled_date", tomorrow.toISOString().split("T")[0])
      .order("scheduled_date")
      .limit(5);

    appts?.forEach((a) => {
      items.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: `Upcoming: ${a.service_type}`,
        description: `${a.scheduled_date} at ${a.scheduled_time}`,
        time: a.scheduled_date,
        link: "/admin/appointments",
        read: false,
      });
    });

    // Fetch unread messages
    const { data: msgs, count: msgCount } = await supabase
      .from("chat_messages")
      .select("id, message, sender_id, created_at", { count: "exact" })
      .eq("is_admin", false)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (msgCount && msgCount > 0) {
      items.push({
        id: "unread-msgs",
        type: "message",
        title: `${msgCount} unread message${msgCount > 1 ? "s" : ""}`,
        description: msgs?.[0]?.message?.slice(0, 60) || "New message",
        time: msgs?.[0]?.created_at || now.toISOString(),
        link: "/admin/chat",
        read: false,
      });
    }

    // Fetch pending documents
    const { count: pendingDocs } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");

    if (pendingDocs && pendingDocs > 0) {
      items.push({
        id: "pending-docs",
        type: "document",
        title: `${pendingDocs} document${pendingDocs > 1 ? "s" : ""} pending review`,
        description: "Documents awaiting your approval",
        time: now.toISOString(),
        link: "/admin/documents",
        read: false,
      });
    }

    setNotifications(items);
  }, []);

  // Browser notification permission
  const [browserNotifs, setBrowserNotifs] = useState(false);
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setBrowserNotifs(true);
  }, []);

  const requestBrowserNotifs = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setBrowserNotifs(perm === "granted");
  };

  // Send browser notification for new unread items
  const prevCountRef = useCallback(() => { /* tracked via effect */ }, []);

  useEffect(() => {
    fetchNotifications();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, 30000);

    // FC-5: Realtime subscription for instant notifications
    const channel = supabase.channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments" }, () => fetchNotifications())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => fetchNotifications())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "documents" }, () => fetchNotifications())
      .subscribe();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fire browser notification when new items arrive
  useEffect(() => {
    if (browserNotifs && unreadCount > 0 && document.visibilityState === "hidden") {
      try {
        new Notification("Notar — New Notification", {
          body: notifications.find(n => !n.read)?.title || "You have new notifications",
          icon: "/favicon.svg",
        });
      } catch (e) { console.error("Browser notification error:", e); }
    }
  }, [unreadCount, browserNotifs, notifications]);

  const iconMap = {
    appointment: Calendar,
    message: MessageSquare,
    document: FileText,
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <h3 className="font-sans text-sm font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {!browserNotifs && "Notification" in window && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={requestBrowserNotifs}>
                🔔 Enable
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={markAllRead}>
                <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              All caught up! No new notifications.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n) => {
                const Icon = iconMap[n.type];
                return (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => {
                      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                    </div>
                    {!n.read && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
