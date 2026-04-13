/**
 * Sprint 1: Document Pipeline — Master stage UI
 * Displays the lifecycle of a document through Upload → Scan → Review → Sign → Deliver.
 */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ScanSearch, FileCheck, PenTool, Send, CheckCircle2 } from "lucide-react";

const STAGES = [
  { key: "uploaded", label: "Uploaded", icon: Upload },
  { key: "scanning", label: "Scanning", icon: ScanSearch },
  { key: "review", label: "Review", icon: FileCheck },
  { key: "signing", label: "Signing", icon: PenTool },
  { key: "delivered", label: "Delivered", icon: Send },
] as const;

type StageKey = typeof STAGES[number]["key"];

interface DocumentPipelineProps {
  currentStage: StageKey;
  documentName?: string;
  className?: string;
}

export function DocumentPipeline({ currentStage, documentName, className }: DocumentPipelineProps) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStage);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          Document Pipeline {documentName ? `— ${documentName}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => {
            const Icon = i < currentIndex ? CheckCircle2 : stage.icon;
            const isActive = i === currentIndex;
            const isDone = i < currentIndex;

            return (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center gap-1 ${isActive ? "scale-110" : ""}`}>
                  <div
                    className={`rounded-full p-2 transition-colors ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/20 text-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      i < currentIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
