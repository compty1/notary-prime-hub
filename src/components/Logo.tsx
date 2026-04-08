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
  sm: { mark: "text-[32px]", text: "text-xl", gap: "gap-1.5" },
  md: { mark: "text-[40px]", text: "text-2xl", gap: "gap-2" },
  lg: { mark: "text-[48px]", text: "text-[32px]", gap: "gap-2" },
  xl: { mark: "text-[56px]", text: "text-4xl", gap: "gap-3" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = false, subtitle, theme, className }, ref) => {
    const s = sizeMap[size];

    const isDark = theme === "dark";
    const textColor = isDark ? "text-white" : "text-[#0a0a0a]";
    const shadowColor = isDark ? "#000000" : "#212529";

    return (
      <div
        ref={ref}
        className={cn("group flex items-end", s.gap, className)}
        aria-label="NotarDex logo"
      >
        {/* Stylized "n" lettermark */}
        <span
          className={cn(
            "font-black tracking-tighter leading-none transition-transform group-hover:-translate-y-1",
            s.mark
          )}
          style={{
            color: "#eab308",
            textShadow: `2.5px 1px 0px ${shadowColor}`,
          }}
          aria-hidden="true"
        >
          n
        </span>

        {showText && (
          <div className="flex flex-col">
            <span
              className={cn(
                "font-black tracking-tighter leading-none",
                s.text,
                textColor
              )}
            >
              notar<span className="text-[#eab308]">dex</span>
              <span className={textColor}>.</span>
            </span>
            {subtitle && (
              <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
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
