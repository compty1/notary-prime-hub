import { useState } from "react";
import { X, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgencyBannerProps {
  message?: string;
  variant?: "slots" | "offer" | "deadline";
  className?: string;
  dismissible?: boolean;
}

const variants = {
  slots: { icon: Clock, defaultMsg: "Limited slots available this week — book now to secure your time" },
  offer: { icon: Sparkles, defaultMsg: "Introductory pricing available — save on your first notarization" },
  deadline: { icon: Clock, defaultMsg: "Same-day appointments still available — don't miss out" },
};

export function UrgencyBanner({ message, variant = "slots", className, dismissible = true }: UrgencyBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { icon: Icon, defaultMsg } = variants[variant];

  return (
    <div className={cn(
      "relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium",
      "bg-accent-warm text-accent-warm-foreground",
      "animate-fade-in",
      className
    )}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message || defaultMsg}</span>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-black/10 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
