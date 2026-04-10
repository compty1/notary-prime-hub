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
  sm: { icon: "h-8 w-8", text: "text-xl", gap: "gap-1.5" },
  md: { icon: "h-10 w-10", text: "text-2xl", gap: "gap-2" },
  lg: { icon: "h-14 w-14", text: "text-[32px]", gap: "gap-2.5" },
  xl: { icon: "h-16 w-16", text: "text-4xl", gap: "gap-3" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = false, subtitle, theme, className }, ref) => {
    const s = sizeMap[size];

    const isDark = theme === "dark";
    const textColor = isDark ? "text-white" : "text-foreground";

    return (
      <div
        ref={ref}
        className={cn("group flex items-center", s.gap, className)}
        aria-label="NotarDex logo"
      >
        <img
          src={logoIcon}
          alt="NotarDex"
          className={cn(s.icon, "object-contain transition-transform group-hover:-translate-y-0.5")}
        />

        {showText && (
          <div className="flex flex-col">
            <span
              className={cn(
                "font-black tracking-tight leading-none uppercase",
                s.text,
                textColor
              )}
            >
              notar<span className="text-primary">dex</span>
            </span>
            {subtitle && (
              <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
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
