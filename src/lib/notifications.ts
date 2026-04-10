/**
 * Notification permission and push notification utilities (Items 3440-3450)
 */

/** Request notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Show a browser notification */
export function showNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body: options?.body,
    icon: options?.icon || "/favicon.svg",
    tag: options?.tag,
    badge: "/favicon.svg",
  });

  if (options?.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}

/** Check if notifications are supported and permitted */
export function canShowNotifications(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}
