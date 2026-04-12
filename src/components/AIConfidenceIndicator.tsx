/**
 * SVC-206/208: AI confidence display and human-in-the-loop
 * Shows confidence scores for AI-populated fields.
 */
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AIConfidenceIndicatorProps {
  confidence: number; // 0-1
  fieldName: string;
  className?: string;
}

export function AIConfidenceIndicator({ confidence, fieldName, className }: AIConfidenceIndicatorProps) {
  const pct = Math.round(confidence * 100);
  const isHigh = confidence >= 0.85;
  const isMedium = confidence >= 0.6 && confidence < 0.85;
  const isLow = confidence < 0.6;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] gap-1 cursor-help",
            isHigh && "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400",
            isMedium && "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400",
            isLow && "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
            className
          )}
        >
          {isHigh && <CheckCircle className="h-2.5 w-2.5" />}
          {isMedium && <HelpCircle className="h-2.5 w-2.5" />}
          {isLow && <AlertTriangle className="h-2.5 w-2.5" />}
          AI {pct}%
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-medium">{fieldName}</p>
        <p className="text-xs text-muted-foreground">
          AI confidence: {pct}%
          {isLow && " — Please verify this field manually"}
          {isMedium && " — Review recommended"}
          {isHigh && " — High confidence"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Minimum confidence threshold for auto-acceptance */
export const AI_CONFIDENCE_THRESHOLD = 0.85;

/** Check if all AI fields meet the confidence threshold */
export function allFieldsAboveThreshold(
  fields: { name: string; confidence: number }[]
): boolean {
  return fields.every(f => f.confidence >= AI_CONFIDENCE_THRESHOLD);
}
