/**
 * P4-008: Document approval workflows (Draft → Review → Approved → Signed)
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FileCheck, Send, CheckCircle, PenTool, Clock, AlertCircle } from "lucide-react";

export type ApprovalStatus = "draft" | "review" | "approved" | "signed" | "rejected";

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Draft", icon: <Clock className="w-3.5 h-3.5" />, color: "bg-muted text-muted-foreground" },
  review: { label: "In Review", icon: <Send className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  approved: { label: "Approved", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  signed: { label: "Signed", icon: <PenTool className="w-3.5 h-3.5" />, color: "bg-primary/10 text-primary" },
  rejected: { label: "Rejected", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "bg-destructive/10 text-destructive" },
};

const VALID_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  draft: ["review"],
  review: ["approved", "rejected", "draft"],
  approved: ["signed", "review"],
  signed: [],
  rejected: ["draft"],
};

interface ApprovalWorkflowProps {
  status: ApprovalStatus;
  onStatusChange: (newStatus: ApprovalStatus) => void;
  isOwner?: boolean;
  className?: string;
}

export function ApprovalWorkflow({ status, onStatusChange, isOwner = false, className }: ApprovalWorkflowProps) {
  const config = STATUS_CONFIG[status];
  const validNext = VALID_TRANSITIONS[status];
  const steps: ApprovalStatus[] = ["draft", "review", "approved", "signed"];
  const currentStep = steps.indexOf(status);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const sc = STATUS_CONFIG[step];
          const isActive = step === status;
          const isPast = i < currentStep && status !== "rejected";
          return (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all",
                isActive ? sc.color : isPast ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted/50 text-muted-foreground"
              )}>
                {sc.icon}
                <span className="hidden sm:inline">{sc.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px flex-1", isPast ? "bg-green-400" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Status badge + actions */}
      <div className="flex items-center justify-between">
        <Badge className={cn("gap-1", config.color)}>
          {config.icon} {config.label}
        </Badge>

        {validNext.length > 0 && isOwner && (
          <div className="flex gap-1.5">
            {validNext.map(next => {
              const nc = STATUS_CONFIG[next];
              return (
                <Button
                  key={next}
                  size="sm"
                  variant={next === "rejected" ? "destructive" : "outline"}
                  className="h-7 text-xs gap-1"
                  onClick={() => onStatusChange(next)}
                >
                  {nc.icon} {nc.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
