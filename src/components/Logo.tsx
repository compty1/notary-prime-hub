import React from "react";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/logo-icon.png";

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
        <img
          src={logoIcon}
          alt="Notar logo"
          width={s.icon}
          height={s.icon}
          className="shrink-0 rounded-sm object-contain"
        />

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
