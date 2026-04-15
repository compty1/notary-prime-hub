import { cn } from "@/lib/utils";

interface ButtonLoadingStateProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ButtonLoadingState({ loading = false, children, className, onClick, disabled }: ButtonLoadingStateProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        loading && "animate-[widthRetract_0.2s_ease-out]",
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-[ellipsisAnim_1.5s_steps(4)_infinite] inline-block w-4">
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-bounce" style={{ animationDelay: "0s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-bounce ml-0.5" style={{ animationDelay: "0.15s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-bounce ml-0.5" style={{ animationDelay: "0.3s" }} />
          </span>
        </span>
      ) : children}
    </button>
  );
}
