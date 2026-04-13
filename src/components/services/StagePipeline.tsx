/**
 * Sprint 10: Reusable stage pipeline component for service dashboards
 */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface StagePipelineProps {
  stages: string[];
  currentStage: string;
  onStageClick?: (stage: string) => void;
  className?: string;
}

export function StagePipeline({ stages, currentStage, onStageClick, className }: StagePipelineProps) {
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {stages.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isPending = i > currentIndex;

        return (
          <div key={stage} className="flex items-center gap-1">
            <button
              onClick={() => onStageClick?.(stage)}
              disabled={!onStageClick}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                isComplete && "bg-primary/10 text-primary",
                isCurrent && "bg-primary text-primary-foreground font-medium",
                isPending && "bg-muted text-muted-foreground",
                onStageClick && "cursor-pointer hover:opacity-80"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className={cn("h-3 w-3", isCurrent && "fill-current")} />
              )}
              {stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
            {i < stages.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Stage pipeline configs for different service types */
export const SERVICE_STAGES: Record<string, string[]> = {
  estate_planning: ["intake", "questionnaire", "drafting", "review", "signing", "notarized", "filed"],
  real_estate: ["docs_received", "reviewed", "scheduled", "signing", "signed", "returned", "recorded"],
  loan_signing: ["package_received", "docs_reviewed", "scheduled", "signing", "docs_signed", "returned_to_lender"],
  power_of_attorney: ["intake", "type_selection", "drafting", "review", "signing", "notarized", "delivered"],
  translation: ["intake", "assigned", "translating", "review", "qa", "certified", "delivered"],
  immigration: ["intake", "docs_collected", "forms_prep", "review", "filing", "tracking", "completed"],
  apostille: ["intake", "docs_received", "sos_filed", "authenticated", "legalized", "delivered"],
  process_serving: ["received", "attempt_1", "attempt_2", "attempt_3", "served", "affidavit_filed"],
  court_forms: ["intake", "form_selected", "drafted", "reviewed", "filed", "confirmed"],
  business_formation: ["intake", "entity_selection", "drafting", "sos_filed", "accepted", "ein_obtained", "delivered"],
  fingerprinting: ["scheduled", "checked_in", "prints_captured", "quality_check", "submitted", "results_received"],
  background_check: ["ordered", "processing", "received", "reviewed", "delivered"],
  courier: ["pickup_scheduled", "picked_up", "in_transit", "delivered", "confirmed"],
  content: ["brief", "draft", "edit", "review", "approved", "published"],
  default: ["intake", "in_progress", "review", "completed"],
};

export function getStagesForService(serviceType: string): string[] {
  const key = serviceType.toLowerCase().replace(/[\s-]+/g, "_");
  return SERVICE_STAGES[key] || SERVICE_STAGES.default;
}
