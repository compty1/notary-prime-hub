/**
 * Batch 13: Email & notification helpers
 * Client-side notification utilities for admin and portal views.
 */
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPayload {
  type: "appointment_reminder" | "document_ready" | "payment_received" | "status_update";
  title: string;
  body: string;
  recipientId: string;
  metadata?: Record<string, unknown>;
}

/** Check if browser supports notifications and permission is granted */
export function canShowBrowserNotification(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

/** Request browser notification permission */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Show a browser notification */
export function showBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!canShowBrowserNotification()) return;
  const notification = new Notification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
  });
  if (onClick) notification.onclick = onClick;
}

/** Format a relative time string (e.g., "2 hours ago") */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Fetch unread chat message count for a user */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("read", false);
  return count ?? 0;
}
