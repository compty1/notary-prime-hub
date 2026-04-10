/**
 * Network status and offline queue utilities (Items 580, 3430-3435)
 * Detect connectivity changes and queue operations for retry.
 */

type QueuedAction = {
  id: string;
  action: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
};

const QUEUE_KEY = "notardex_offline_queue";
const MAX_RETRIES = 3;

/** Check if browser is online */
export function isOnline(): boolean {
  return navigator.onLine;
}

/** Listen for online/offline events */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/** Queue an action for later execution when offline */
export function queueOfflineAction(action: string, payload: unknown) {
  try {
    const queue = getOfflineQueue();
    queue.push({
      id: crypto.randomUUID(),
      action,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.warn("Failed to queue offline action");
  }
}

/** Get queued offline actions */
export function getOfflineQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Remove a processed action from the queue */
export function removeFromQueue(id: string) {
  try {
    const queue = getOfflineQueue().filter(a => a.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.warn("Failed to update offline queue");
  }
}

/** Clear all queued actions */
export function clearOfflineQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    console.warn("Failed to clear offline queue");
  }
}

/** Process queued actions when back online */
export async function processOfflineQueue(
  handler: (action: string, payload: unknown) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  const queue = getOfflineQueue();
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.retryCount >= MAX_RETRIES) {
      removeFromQueue(item.id);
      failed++;
      continue;
    }

    try {
      const success = await handler(item.action, item.payload);
      if (success) {
        removeFromQueue(item.id);
        processed++;
      } else {
        item.retryCount++;
        failed++;
      }
    } catch {
      item.retryCount++;
      failed++;
    }
  }

  // Update remaining items with incremented retry counts
  const remaining = getOfflineQueue();
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

  return { processed, failed };
}
