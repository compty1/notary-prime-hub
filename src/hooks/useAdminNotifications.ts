/**
 * F-061+: Admin notification hooks.
 * In-app notifications for admin events (new signups, cancellations, etc.)
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Hook to listen for real-time admin notifications.
 */
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load recent audit log entries as notifications
  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("audit_log")
      .select("*")
      .in("action", [
        "user_signup",
        "appointment_cancelled",
        "payment_failed",
        "document_uploaded",
        "notary_page_pending_review",
        "client_error",
        "review_submitted",
      ])
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const mapped: AdminNotification[] = data.map(entry => ({
        id: entry.id,
        type: entry.action,
        title: formatNotificationTitle(entry.action),
        message: formatNotificationMessage(entry.action, entry.details as any),
        entityId: entry.entity_id || undefined,
        entityType: entry.entity_type || undefined,
        read: false,
        createdAt: entry.created_at,
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.length);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time audit log changes
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        (payload) => {
          const entry = payload.new as any;
          const notification: AdminNotification = {
            id: entry.id,
            type: entry.action,
            title: formatNotificationTitle(entry.action),
            message: formatNotificationMessage(entry.action, entry.details),
            entityId: entry.entity_id,
            entityType: entry.entity_type,
            read: false,
            createdAt: entry.created_at,
          };
          setNotifications(prev => [notification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllRead, refresh: loadNotifications };
}

function formatNotificationTitle(action: string): string {
  const titles: Record<string, string> = {
    user_signup: "New User Signup",
    appointment_cancelled: "Appointment Cancelled",
    payment_failed: "Payment Failed",
    document_uploaded: "Document Uploaded",
    notary_page_pending_review: "Notary Page Review Needed",
    client_error: "Client Error Reported",
    review_submitted: "New Review Submitted",
  };
  return titles[action] || action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatNotificationMessage(action: string, details: any): string {
  if (!details) return "No additional details.";

  switch (action) {
    case "user_signup":
      return `New user: ${details.email || "Unknown"}`;
    case "appointment_cancelled":
      return `Appointment ${details.confirmationNumber || ""} was cancelled. ${details.reason || ""}`;
    case "payment_failed":
      return `Payment of $${details.amount || "?"} failed for ${details.clientEmail || "unknown client"}.`;
    case "document_uploaded":
      return `Document "${details.fileName || "file"}" uploaded.`;
    case "notary_page_pending_review":
      return `Notary page submitted for review.`;
    default:
      return JSON.stringify(details).slice(0, 100);
  }
}
