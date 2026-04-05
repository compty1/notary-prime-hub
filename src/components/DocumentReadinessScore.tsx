import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";

interface DocumentReadinessProps {
  serviceType: string;
  uploadedDocuments: Array<{ file_name: string; status: string }>;
}

const SERVICE_REQUIREMENTS: Record<string, string[]> = {
  "General Notarization": ["Valid government-issued photo ID", "Document to be notarized"],
  "Remote Online Notarization": ["Valid government-issued photo ID", "Document to be notarized", "Stable internet connection", "Webcam and microphone"],
  "Loan Signing": ["Valid government-issued photo ID", "Loan documents package", "Secondary ID (if required)"],
  "Power of Attorney": ["Valid government-issued photo ID", "Power of Attorney document", "Witness identification (if required)"],
  "Real Estate": ["Valid government-issued photo ID", "Property deed or closing documents", "Title documents"],
  "Apostille": ["Valid government-issued photo ID", "Document requiring apostille", "Destination country information"],
};

export function DocumentReadinessScore({ serviceType, uploadedDocuments }: DocumentReadinessProps) {
  const requirements = SERVICE_REQUIREMENTS[serviceType] || SERVICE_REQUIREMENTS["General Notarization"];
  
  const { score, metItems, missingItems } = useMemo(() => {
    const docNames = uploadedDocuments.map((d) => d.file_name.toLowerCase());
    const met: string[] = [];
    const missing: string[] = [];

    requirements.forEach((req) => {
      const reqLower = req.toLowerCase();
      const hasMatch = docNames.some(
        (name) => name.includes("id") || name.includes("license") || name.includes("passport")
          ? reqLower.includes("id") || reqLower.includes("photo")
          : name.includes(reqLower.split(" ")[0])
      );
      
      if (hasMatch || uploadedDocuments.length > 0) {
        met.push(req);
      } else {
        missing.push(req);
      }
    });

    // Always count at least uploaded docs as progress
    const uploadProgress = Math.min(uploadedDocuments.length / Math.max(requirements.length, 1), 1);
    const calculatedScore = Math.round(uploadProgress * 100);

    return { score: calculatedScore, metItems: met, missingItems: missing };
  }, [requirements, uploadedDocuments]);

  const color = score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Document Readiness</h3>
          </div>
          <span className={`text-2xl font-bold ${color}`}>{score}%</span>
        </div>

        <Progress value={score} className="h-2" />

        <div className="space-y-2">
          {uploadedDocuments.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{uploadedDocuments.length} document(s) uploaded</span>
            </div>
          )}
          {missingItems.map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {score < 100 && (
          <Badge variant="outline" className="text-xs">
            Upload remaining documents to improve readiness
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
