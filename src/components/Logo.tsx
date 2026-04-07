import React from "react";
import { cn } from "@/lib/utils";
import { FileCheck2 } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  theme?: "light" | "dark";
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, text: "text-lg", gap: "gap-2", pad: "p-1.5" },
  md: { icon: 24, text: "text-2xl", gap: "gap-3", pad: "p-2" },
  lg: { icon: 32, text: "text-4xl", gap: "gap-4", pad: "p-2.5" },
  xl: { icon: 40, text: "text-5xl", gap: "gap-5", pad: "p-3" },
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
        {/* Amber gradient icon badge */}
        <div
          className={cn(
            "rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0",
            s.pad
          )}
        >
          <FileCheck2
            style={{ width: s.icon, height: s.icon }}
            className="text-slate-900"
            strokeWidth={2.5}
          />
        </div>

        {showText && (
          <div>
            <span
              className={cn(
                "block font-heading font-bold tracking-tight",
                s.text,
                textColorClass
              )}
            >
              NotarDex
              <span className="text-primary">.com</span>
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