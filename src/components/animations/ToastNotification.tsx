import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToastNotificationProps {
  type?: "success" | "error" | "info" | "warning";
  message: string;
  show?: boolean;
  duration?: number;
  onDismiss?: () => void;
  className?: string;
}

export function ToastNotification({ type = "info", message, show = false, duration = 4000, onDismiss, className }: ToastNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => { setVisible(false); onDismiss?.(); }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDismiss]);

  if (!visible) return null;

  const colors = {
    success: "bg-success/10 border-success/30 text-success",
    error: "bg-destructive/10 border-destructive/30 text-destructive",
    info: "bg-info/10 border-info/30 text-info",
    warning: "bg-warning/10 border-warning/30 text-warning",
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-card flex items-center gap-2",
      colors[type],
      exiting ? "animate-[toastSlideOut_0.3s_ease-in_forwards]" : "animate-[toastSlideIn_0.3s_var(--bounce-easing)_forwards]",
      className
    )}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setExiting(true); setTimeout(() => { setVisible(false); onDismiss?.(); }, 300); }} className="ml-2 opacity-60 hover:opacity-100">
        <svg viewBox="0 0 16 16" className="w-4 h-4"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}
