import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: 32, text: "text-[10px]", nameText: "text-lg" },
  md: { box: 40, text: "text-xs", nameText: "text-xl" },
  lg: { box: 48, text: "text-sm", nameText: "text-2xl" },
  xl: { box: 64, text: "text-base", nameText: "text-3xl" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = false, subtitle, className }, ref) => {
    const s = sizeMap[size];
    return (
      <div ref={ref} className={cn("flex items-center gap-2.5", className)}>
        <svg
          width={s.box}
          height={s.box}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <defs>
            <linearGradient id="logo-teal" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(168 72% 35%)" />
              <stop offset="1" stopColor="hsl(174 63% 45%)" />
            </linearGradient>
          </defs>
          {/* Rounded square background */}
          <rect x="2" y="2" width="60" height="60" rx="14" fill="hsl(224 63% 11%)" />
          {/* Geometric N mark */}
          <path
            d="M18 48V16h5.5l16.5 22.5V16H45v32h-5.5L23 25.5V48H18Z"
            fill="url(#logo-teal)"
          />
          {/* Accent diagonal stroke */}
          <path
            d="M38 14L50 50"
            stroke="hsl(174 63% 45%)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
        {showText && (
          <div>
            <span className={cn("block font-heading font-bold tracking-tight text-foreground", s.nameText)}>
              Notar
            </span>
            {subtitle && (
              <span className={cn("block text-muted-foreground", s.text)}>
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
