/**
 * Sprint 6: Journal Compliance Checker
 * Validates journal entries against ORC §147.04 / §147.141 requirements.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, BookOpen } from "lucide-react";

interface JournalEntry {
  id: string;
  entry_date?: string;
  entry_time?: string;
  signer_name?: string;
  signer_address?: string;
  document_type_description?: string;
  notarial_act_type?: string;
  id_type?: string;
  communication_technology?: string;
  journal_number?: string;
}

interface CheckResult {
  field: string;
  label: string;
  passed: boolean;
  requirement: string;
}

function checkCompliance(entry: JournalEntry): CheckResult[] {
  return [
    {
      field: "entry_date",
      label: "Date of Act",
      passed: !!entry.entry_date,
      requirement: "ORC §147.04(A)(1): Date of notarial act",
    },
    {
      field: "entry_time",
      label: "Time of Act",
      passed: !!entry.entry_time,
      requirement: "ORC §147.04(A)(2): Time of notarial act",
    },
    {
      field: "document_type_description",
      label: "Document Description",
      passed: !!entry.document_type_description,
      requirement: "ORC §147.04(A)(3): Type/description of document",
    },
    {
      field: "notarial_act_type",
      label: "Act Type",
      passed: !!entry.notarial_act_type,
      requirement: "ORC §147.04(A)(4): Type of notarial act performed",
    },
    {
      field: "signer_name",
      label: "Signer Name",
      passed: !!entry.signer_name,
      requirement: "ORC §147.04(A)(5): Name of signer",
    },
    {
      field: "signer_address",
      label: "Signer Address",
      passed: !!entry.signer_address,
      requirement: "ORC §147.04(A)(6): Address of signer",
    },
    {
      field: "id_type",
      label: "ID Verification",
      passed: !!entry.id_type,
      requirement: "ORC §147.04(A)(7): Method of identification",
    },
    {
      field: "journal_number",
      label: "Sequential Number",
      passed: !!entry.journal_number,
      requirement: "ORC §147.141: Sequential journal entry number",
    },
  ];
}

interface JournalComplianceCheckerProps {
  entry: JournalEntry;
  className?: string;
}

export function JournalComplianceChecker({ entry, className }: JournalComplianceCheckerProps) {
  const checks = checkCompliance(entry);
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  const allPassed = passed === total;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Journal Compliance
          <Badge variant={allPassed ? "default" : "destructive"} className="ml-auto">
            {passed}/{total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {checks.map((check) => (
          <div key={check.field} className="flex items-center gap-2 text-sm">
            {check.passed ? (
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span className={check.passed ? "text-muted-foreground" : "text-foreground font-medium"}>
              {check.label}
            </span>
          </div>
        ))}
        {!allPassed && (
          <div className="flex items-start gap-2 mt-3 rounded-lg bg-destructive/10 p-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              Missing required fields per Ohio Revised Code. Complete all fields before finalizing.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
