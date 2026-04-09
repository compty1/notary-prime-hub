import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";
import { ensureSkipLink, initHighContrast } from "@/lib/a11yUtils";
import { injectFrameProtection } from "@/lib/securityHelpers";

// Initialize accessibility features
ensureSkipLink();
initHighContrast();

// #3879: Clickjacking protection
injectFrameProtection();

// Global unhandled error handler (Gap: missing global error handler)
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
  try {
    supabase.from("audit_log").insert({
      action: "unhandled_error",
      entity_type: "window",
      details: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack?.slice(0, 500),
      },
    }).then(() => {}, () => {});
  } catch { /* never throw from error reporting */ }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  try {
    const reason = event.reason;
    supabase.from("audit_log").insert({
      action: "unhandled_rejection",
      entity_type: "window",
      details: {
        message: typeof reason === "string" ? reason : reason?.message || String(reason),
        stack: reason?.stack?.slice(0, 500),
      },
    }).then(() => {}, () => {});
  } catch { /* never throw from error reporting */ }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
