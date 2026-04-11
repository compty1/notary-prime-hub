import React from "react";
import { cn } from "@/lib/utils";
import notarLogo from "@/assets/notar-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  theme?: "light" | "dark";
  className?: string;
}

const sizeMap = {
  sm: { icon: "h-[74px] w-[74px]", text: "text-2xl", gap: "gap-3" },
  md: { icon: "h-[92px] w-[92px]", text: "text-3xl", gap: "gap-3" },
  lg: { icon: "h-[129px] w-[129px]", text: "text-4xl", gap: "gap-4" },
  xl: { icon: "h-[148px] w-[148px]", text: "text-5xl", gap: "gap-4" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = false, subtitle, theme, className }, ref) => {
    const s = sizeMap[size];
    const textColor = theme === "dark" ? "text-white" : "text-foreground";

    return (
      <div
        ref={ref}
        className={cn("group flex items-center", s.gap, className)}
        aria-label="Notar logo"
      >
        <img
          src={notarLogo}
          alt="Notar"
          className={cn(s.icon, "object-contain transition-transform group-hover:-translate-y-0.5")}
        />
        {showText && (
          <span
            className={cn(
              "font-bold tracking-tight leading-none",
              s.text,
              textColor
            )}
          >
            Notar
          </span>
        )}
        {subtitle && (
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";
