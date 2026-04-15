import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  progress?: number; // 0-100
  status?: "idle" | "uploading" | "processing" | "complete" | "error";
  className?: string;
}

export function DocumentUpload({ progress = 0, status = "idle", className }: DocumentUploadProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 p-6", className)}>
      <div className={cn(
        "relative w-16 h-20 rounded-lg border-2 border-dashed transition-all duration-300",
        status === "idle" && "border-muted-foreground/30",
        status === "uploading" && "border-primary animate-[subtlePulse_2s_ease-in-out_infinite]",
        status === "processing" && "border-primary bg-primary/5",
        status === "complete" && "border-success bg-success/5 animate-[docSlide_0.4s_ease-out]",
        status === "error" && "border-destructive animate-[errorShake_0.5s_ease-in-out]"
      )}>
        {/* Document icon */}
        <svg viewBox="0 0 64 80" className="w-10 h-12 mx-auto mt-2 text-muted-foreground">
          <rect x="4" y="4" width="48" height="64" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="14" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="14" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="14" y1="44" x2="32" y2="44" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        </svg>
        {status === "uploading" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <span className={cn(
        "text-sm font-medium transition-colors",
        status === "complete" && "text-success",
        status === "error" && "text-destructive",
        (status === "idle" || status === "uploading") && "text-muted-foreground"
      )}>
        {status === "idle" && "Drop files here"}
        {status === "uploading" && `Uploading ${progress}%`}
        {status === "processing" && "Processing..."}
        {status === "complete" && "Upload complete!"}
        {status === "error" && "Upload failed"}
      </span>
    </div>
  );
}
