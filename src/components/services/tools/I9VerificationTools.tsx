import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, FileText, AlertTriangle, Clock } from "lucide-react";

const LIST_A_DOCUMENTS = [
  "U.S. Passport or U.S. Passport Card",
  "Permanent Resident Card (Form I-551)",
  "Foreign passport with Form I-94/I-94A (with I-551 stamp/MRIV)",
  "Employment Authorization Document (Form I-766)",
  "Foreign passport with Form I-94 (with arrival-departure record)",
];

const LIST_B_DOCUMENTS = [
  "Driver's license or state-issued ID card",
  "School ID card with photograph",
  "Voter registration card",
  "U.S. Military card or draft record",
  "Military dependent's ID card",
  "U.S. Coast Guard Merchant Mariner Document",
];

const LIST_C_DOCUMENTS = [
  "Social Security Account Number card (unrestricted)",
  "Certification of Birth Abroad (Form FS-545)",
  "Certification of Report of Birth (Form DS-1350)",
  "Original or certified copy of birth certificate",
  "Native American tribal document",
  "U.S. Citizen ID Card (Form I-197)",
];

const I9_STEPS = [
  { step: 1, title: "Employee completes Section 1", deadline: "First day of employment", details: "Employee provides name, address, DOB, citizenship status" },
  { step: 2, title: "Employer reviews documents", deadline: "Within 3 business days of hire", details: "Must be original, unexpired documents from Lists A, B+C" },
  { step: 3, title: "Authorized representative completes Section 2", deadline: "Within 3 business days of hire", details: "Notary acts as authorized representative, examines documents" },
  { step: 4, title: "Sign and date certification", deadline: "Same day as document review", details: "Rep certifies documents appear genuine and relate to employee" },
  { step: 5, title: "Retain completed I-9", deadline: "3 years after hire OR 1 year after termination", details: "Whichever is later — employer retains form" },
];

export function I9VerificationTools() {
  return (
    <div className="space-y-6">
      <Card className="border-warning/30 bg-warning/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-warning">
              <strong>Important:</strong> As an authorized representative completing I-9 Section 2, you are NOT acting as a notary. Do NOT affix your notary seal. You are verifying identity documents on behalf of the employer.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            I-9 Completion Steps & Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {I9_STEPS.map((s) => (
              <div key={s.step} className="flex gap-3 p-3 rounded-lg border">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.title}</span>
                    <Badge variant="outline" className="text-xs">{s.deadline}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> List A (Identity + Work Auth)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {LIST_A_DOCUMENTS.map((d) => (
                <p key={d} className="text-xs text-muted-foreground">• {d}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> List B (Identity Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {LIST_B_DOCUMENTS.map((d) => (
                <p key={d} className="text-xs text-muted-foreground">• {d}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> List C (Work Auth Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {LIST_C_DOCUMENTS.map((d) => (
                <p key={d} className="text-xs text-muted-foreground">• {d}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
