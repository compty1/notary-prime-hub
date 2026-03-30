import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: "h-8 w-8", text: "text-[10px]", letter: "text-sm" },
  md: { box: "h-10 w-10", text: "text-xs", letter: "text-base" },
  lg: { box: "h-12 w-12", text: "text-sm", letter: "text-lg" },
  xl: { box: "h-16 w-16", text: "text-base", letter: "text-2xl" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = false, subtitle, className }, ref) => {
    const s = sizeMap[size];
    return (
      <div ref={ref} className={cn("flex items-center gap-2.5", className)}>
        <div
          className={cn(
            s.box,
            "relative flex items-center justify-center rounded-lg bg-primary overflow-hidden"
          )}
        >
          <span className={cn(s.letter, "font-bold text-primary-foreground select-none")}>
            N
          </span>
        </div>
        {showText && (
          <div>
            <span className="block text-lg font-extrabold tracking-tight text-foreground">
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
