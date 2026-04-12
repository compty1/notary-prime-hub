/**
 * SVC-751: Per-service "What You Need" checklist
 * Shows requirements based on selected service type
 */
import { CheckCircle2, AlertCircle, FileText, CreditCard, Camera, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistItem {
  label: string;
  icon: React.ReactNode;
  required: boolean;
  description?: string;
}

const SERVICE_CHECKLISTS: Record<string, ChecklistItem[]> = {
  ron: [
    { label: "Valid government-issued photo ID", icon: <Camera className="h-4 w-4" />, required: true, description: "Driver's license, passport, or state ID" },
    { label: "Stable internet connection", icon: <AlertCircle className="h-4 w-4" />, required: true, description: "Minimum 5 Mbps recommended" },
    { label: "Working webcam and microphone", icon: <Camera className="h-4 w-4" />, required: true },
    { label: "Documents to be notarized (digital)", icon: <FileText className="h-4 w-4" />, required: true, description: "PDF format preferred" },
    { label: "Payment method", icon: <CreditCard className="h-4 w-4" />, required: true },
    { label: "Allow 30-45 minutes", icon: <Clock className="h-4 w-4" />, required: false },
  ],
  in_person: [
    { label: "Valid government-issued photo ID", icon: <Camera className="h-4 w-4" />, required: true },
    { label: "Original documents to be notarized", icon: <FileText className="h-4 w-4" />, required: true },
    { label: "All signers must be present", icon: <AlertCircle className="h-4 w-4" />, required: true },
    { label: "Payment method", icon: <CreditCard className="h-4 w-4" />, required: true },
  ],
  mobile: [
    { label: "Valid government-issued photo ID", icon: <Camera className="h-4 w-4" />, required: true },
    { label: "Original documents to be notarized", icon: <FileText className="h-4 w-4" />, required: true },
    { label: "Confirmed meeting address", icon: <AlertCircle className="h-4 w-4" />, required: true },
    { label: "All signers present at location", icon: <AlertCircle className="h-4 w-4" />, required: true },
    { label: "Payment method", icon: <CreditCard className="h-4 w-4" />, required: true },
  ],
  loan_signing: [
    { label: "Valid government-issued photo ID", icon: <Camera className="h-4 w-4" />, required: true },
    { label: "All borrowers must be present", icon: <AlertCircle className="h-4 w-4" />, required: true },
    { label: "Review loan documents in advance", icon: <FileText className="h-4 w-4" />, required: false, description: "Contact your lender for copies" },
    { label: "Allow 45-90 minutes", icon: <Clock className="h-4 w-4" />, required: false },
  ],
  i9: [
    { label: "Unexpired government-issued photo ID", icon: <Camera className="h-4 w-4" />, required: true },
    { label: "Employment authorization document", icon: <FileText className="h-4 w-4" />, required: true, description: "Per USCIS List A, B, or C" },
    { label: "Completed Section 1 of Form I-9", icon: <FileText className="h-4 w-4" />, required: true },
  ],
  apostille: [
    { label: "Original notarized document", icon: <FileText className="h-4 w-4" />, required: true },
    { label: "Destination country information", icon: <AlertCircle className="h-4 w-4" />, required: true },
    { label: "Payment for state filing fees", icon: <CreditCard className="h-4 w-4" />, required: true },
  ],
};

interface ServiceChecklistProps {
  serviceType: string;
  className?: string;
}

export function ServiceChecklist({ serviceType, className }: ServiceChecklistProps) {
  const key = serviceType.toLowerCase().replace(/[\s-]+/g, "_");
  const checklist = SERVICE_CHECKLISTS[key] || SERVICE_CHECKLISTS["in_person"];

  if (!checklist) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          What You'll Need
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {checklist.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={item.required ? "text-primary" : "text-muted-foreground"}>
                {item.icon}
              </span>
              <div>
                <span className={item.required ? "font-medium" : "text-muted-foreground"}>
                  {item.label}
                  {item.required && <span className="text-destructive ml-1">*</span>}
                </span>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
