import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function Logo({ size = "md", showText = false, subtitle, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/logo-icon.png"
        alt="Notar"
        className={cn(sizeMap[size], "rounded-lg object-contain")}
      />
      {showText && (
        <div>
          <span className="block font-display text-lg font-bold text-foreground">Notar</span>
          {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
