import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  theme?: "light" | "dark";
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, text: "text-lg", gap: "gap-2" },
  md: { icon: 32, text: "text-2xl", gap: "gap-3" },
  lg: { icon: 48, text: "text-4xl", gap: "gap-4" },
  xl: { icon: 64, text: "text-5xl", gap: "gap-5" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = false, subtitle, theme, className }, ref) => {
    const s = sizeMap[size];

    const textColorClass =
      theme === "dark"
        ? "text-white"
        : theme === "light"
        ? "text-foreground"
        : "text-foreground";

    return (
      <div ref={ref} className={cn("flex items-center", s.gap, className)}>
        {/* Architectural N mark */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Left stem — Dark Blue */}
          <rect x="8" y="8" width="14" height="48" rx="7" fill="hsl(var(--foreground))" />
          {/* Right stem — Mint */}
          <rect x="42" y="8" width="14" height="48" rx="7" fill="hsl(var(--mint))" />
          {/* Diagonal stroke — Teal (drawn on top, connecting bottom-left to top-right) */}
          <path
            d="M8 49 C8 53, 11 56, 15 56 C19 56, 20 54, 49 12 C52 7, 53 8, 56 8 C53 8, 56 8, 56 15 L56 8 C56 8, 53 8, 49 15 L15 56 C11 56, 8 53, 8 49 Z"
            fill="hsl(var(--primary))"
          />
          <rect x="6" y="28" width="16" height="28" rx="7" fill="hsl(var(--primary))" transform="rotate(-33 14 52)" />
        </svg>

        {showText && (
          <div>
            <span
              className={cn(
                "block font-heading font-bold tracking-tight",
                s.text,
                textColorClass
              )}
            >
              Notar
              <span className="text-accent">.</span>
            </span>
            {subtitle && (
              <span className="block text-xs text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";
