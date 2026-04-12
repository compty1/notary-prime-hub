/**
 * B-051: Document checklist component for service pages.
 * Shows what clients need to prepare before booking.
 */
import { getDocumentChecklist, type DocumentRequirement } from "@/lib/serviceFlowConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, AlertCircle } from "lucide-react";

interface ServiceDocumentChecklistProps {
  serviceId: string;
  customChecklist?: DocumentRequirement[];
}

export function ServiceDocumentChecklist({ serviceId, customChecklist }: ServiceDocumentChecklistProps) {
  const checklist = customChecklist || getDocumentChecklist(serviceId);

  if (!checklist.length) return null;

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <FileText className="h-4 w-4 text-primary" />
          What You'll Need
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklist.map((doc, i) => (
          <div key={i} className="flex items-start gap-3">
            {doc.required ? (
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                {doc.required && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">Required</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{doc.description}</p>
              {doc.acceptedFormats && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Accepted: {doc.acceptedFormats.join(", ").toUpperCase()}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
