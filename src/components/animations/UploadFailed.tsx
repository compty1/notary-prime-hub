import { cn } from "@/lib/utils";

interface UploadFailedProps {
  trigger?: boolean;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function UploadFailed({ trigger = false, message, onRetry, className }: UploadFailedProps) {
  if (!trigger) return null;
  return (
    <div className={cn("flex flex-col items-center gap-3 p-4 animate-[errorShake_0.5s_ease-in-out]", className)}>
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-destructive">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-destructive">{message || "Upload failed"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-primary hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
