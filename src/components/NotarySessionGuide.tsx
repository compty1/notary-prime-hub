import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, Circle, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Info } from "lucide-react";
import { getSessionGuide } from "@/lib/ohioDocumentEligibility";
import { cn } from "@/lib/utils";

interface NotarySessionGuideProps {
  documentType: string;
  notarizationType: "ron" | "in_person";
  signerCount: number;
  signingCapacity?: string;
  hasWitnesses: boolean;
  witnessCount: number;
  completedSteps?: Set<number>;
  onToggleStep?: (index: number) => void;
}

export function NotarySessionGuide({
  documentType,
  notarizationType,
  signerCount,
  signingCapacity,
  hasWitnesses,
  witnessCount,
  completedSteps = new Set(),
  onToggleStep,
}: NotarySessionGuideProps) {
  const [isOpen, setIsOpen] = useState(true);

  const guide = getSessionGuide({
    documentType,
    notarizationType,
    signerCount,
    signingCapacity,
    hasWitnesses,
    witnessCount,
  });

  const completionPct = Math.round((completedSteps.size / guide.steps.length) * 100);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-sans text-sm font-semibold text-foreground">Notary Guide</h3>
              <Badge variant="secondary" className="text-[10px]">
                {completedSteps.size}/{guide.steps.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4 space-y-2">
            {guide.warnings.length > 0 && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 space-y-1">
                {guide.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {w}
                  </p>
                ))}
              </div>
            )}

            <div className="rounded-md bg-muted/50 border border-border p-2 flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                Notarial act: <span className="font-medium text-foreground capitalize">{guide.oathType}</span>
                {signerCount > 1 && <> · {signerCount} signers</>}
                {signingCapacity && signingCapacity !== "individual" && <> · {signingCapacity.replace(/_/g, " ")}</>}
              </p>
            </div>

            {guide.steps.map((step, i) => {
              const done = completedSteps.has(i);
              return (
                <button
                  key={i}
                  onClick={() => onToggleStep?.(i)}
                  className={cn(
                    "w-full text-left rounded-md border p-2.5 transition-all",
                    done ? "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30" : "border-border hover:border-primary/20",
                    step.critical && !done && "border-amber-300 dark:border-amber-700"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {done ? (
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-xs font-medium", done && "line-through text-muted-foreground")}>
                          {i + 1}. {step.label}
                        </p>
                        {step.critical && !done && (
                          <Badge variant="destructive" className="text-[8px] px-1 py-0">Required</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{step.instruction}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
