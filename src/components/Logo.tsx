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
          <rect x="9" y="8" width="13" height="48" rx="6.5" fill="hsl(var(--foreground))" />
          {/* Diagonal stroke — Teal (rotated rounded rect connecting stems) */}
          <rect x="25.5" y="4" width="13" height="56" rx="6.5" fill="hsl(var(--primary))" transform="rotate(28 32 32)" />
          {/* Right stem — Mint */}
          <rect x="42" y="8" width="13" height="48" rx="6.5" fill="hsl(var(--mint))" />
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
