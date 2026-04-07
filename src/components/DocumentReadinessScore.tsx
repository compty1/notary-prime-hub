import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";

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

    const idKeywords = ["id", "license", "passport", "identification", "driver"];
    const docKeywords: Record<string, string[]> = {
      "valid government-issued photo id": idKeywords,
      "document to be notarized": ["document", "doc", "pdf", "contract", "agreement", "deed", "affidavit"],
      "stable internet connection": [],
      "webcam and microphone": [],
      "loan documents package": ["loan", "closing", "mortgage"],
      "secondary id (if required)": idKeywords,
      "power of attorney document": ["poa", "power", "attorney"],
      "witness identification (if required)": idKeywords,
      "property deed or closing documents": ["deed", "title", "closing", "property"],
      "title documents": ["title"],
      "document requiring apostille": ["apostille", "document", "certificate"],
      "destination country information": [],
    };

    requirements.forEach((req) => {
      const reqLower = req.toLowerCase();
      const keywords = docKeywords[reqLower] || [reqLower.split(" ")[0]];
      if (keywords.length === 0) { met.push(req); return; }
      const hasMatch = docNames.some((name) => keywords.some((kw) => name.includes(kw)));
      if (hasMatch) met.push(req);
      else missing.push(req);
    });

    const calculatedScore = requirements.length > 0 ? Math.round((met.length / requirements.length) * 100) : 0;
    return { score: calculatedScore, metItems: met, missingItems: missing };
  }, [requirements, uploadedDocuments]);

  const color = score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 50 ? "text-primary" : "text-destructive";

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-sm text-foreground">Document Readiness</h3>
            <p className="text-xs text-muted-foreground">Requirements for notarization</p>
          </div>
          <div className={`text-2xl font-bold ${color}`}>{score}%</div>
        </div>

        <div className="relative pt-1">
          <div className="overflow-hidden h-3 text-xs flex rounded-full bg-muted">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-primary-foreground justify-center bg-primary transition-all duration-700 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <ul className="space-y-3">
          {uploadedDocuments.length > 0 && (
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-foreground font-medium">{uploadedDocuments.length} document(s) uploaded</span>
            </li>
          )}
          {missingItems.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>

        {score < 100 && (
          <Link to="/mobile-upload">
            <Button variant="secondary" className="w-full rounded-xl text-sm font-bold">
              Upload Remaining Docs
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
