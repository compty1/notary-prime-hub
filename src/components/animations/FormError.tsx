import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  show?: boolean;
  className?: string;
}

export function FormError({ message, show = false, className }: FormErrorProps) {
  if (!show || !message) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm",
      "animate-[errorShake_0.5s_ease-in-out,fadeUp_0.3s_ease-out]",
      className
    )}>
      <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
