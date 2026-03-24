import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: "h-8 w-8", text: "text-[10px]" },
  md: { box: "h-10 w-10", text: "text-xs" },
  lg: { box: "h-12 w-12", text: "text-sm" },
  xl: { box: "h-16 w-16", text: "text-base" },
};

export function Logo({ size = "md", showText = false, subtitle, className }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(s.box, "relative flex items-center justify-center rounded-xl bg-gradient-primary overflow-hidden")}>
        {/* Geometric "N" mark */}
        <svg viewBox="0 0 40 40" fill="none" className="h-full w-full p-1.5">
          <path
            d="M10 32V8L22 24V8"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 24L30 32V8"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      </div>
      {showText && (
        <div>
          <span className="block font-display text-lg font-bold tracking-tight text-foreground">Notar</span>
          {subtitle && <span className={cn("block text-muted-foreground", s.text)}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
