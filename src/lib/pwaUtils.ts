/**
 * PWA install prompt utilities.
 * Enhancement #47 (Progressive Web App), #20 (mobile app banner)
 */

let deferredPrompt: any = null;

/** Listen for the beforeinstallprompt event */
export function initPWAPrompt() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

/** Check if PWA install is available */
export function canInstallPWA(): boolean {
  return deferredPrompt !== null;
}

/** Trigger the PWA install prompt */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return result.outcome === "accepted";
}

/** Check if app is running as installed PWA */
export function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}
