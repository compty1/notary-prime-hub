import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Calendar, FileText, AlertTriangle } from "lucide-react";

const TAX_DEADLINES = [
  { deadline: "January 31", desc: "W-2 and 1099-NEC forms due to recipients", category: "Filing" },
  { deadline: "March 15", desc: "S-Corp (1120S) and Partnership (1065) returns due", category: "Business" },
  { deadline: "April 15", desc: "Individual (1040) and C-Corp (1120) returns due", category: "Individual" },
  { deadline: "June 15", desc: "Extended partnership/S-Corp and Q2 estimated tax", category: "Estimated" },
  { deadline: "September 15", desc: "Extended individual returns and Q3 estimated tax", category: "Extension" },
  { deadline: "October 15", desc: "Extended C-Corp returns due", category: "Business" },
];

const NOTARIZED_TAX_DOCUMENTS = [
  { doc: "IRS Form 2848 (Power of Attorney)", needsNotary: "Sometimes", notes: "When filed with certain state agencies" },
  { doc: "Form 8821 (Tax Information Authorization)", needsNotary: "Rare", notes: "May require for international filings" },
  { doc: "Installment Agreement Requests", needsNotary: "Sometimes", notes: "For IRS payment plans over $50k" },
  { doc: "Offer in Compromise (Form 656)", needsNotary: "Yes", notes: "Requires notarized financial statements" },
  { doc: "Innocent Spouse Relief (Form 8857)", needsNotary: "Sometimes", notes: "Supporting affidavits often notarized" },
  { doc: "Business Entity Formation", needsNotary: "Yes", notes: "Articles of incorporation/organization" },
];

const REFERRAL_PARTNERS = [
  { type: "CPA / EA", services: "Full tax preparation, audit representation, tax planning", commission: "10-15%" },
  { type: "Tax Attorney", services: "Tax disputes, IRS litigation, criminal tax defense", commission: "Referral fee varies" },
  { type: "Bookkeeper", services: "Monthly reconciliation, payroll, QuickBooks setup", commission: "10-20%" },
  { type: "Financial Advisor", services: "Retirement planning, investment tax strategy", commission: "Referral only" },
];

export function TaxReferralTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Key Tax Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {TAX_DEADLINES.map((d) => (
              <div key={d.deadline} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{d.deadline}</span>
                    <Badge variant="outline" className="text-xs">{d.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Documents Requiring Notarization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {NOTARIZED_TAX_DOCUMENTS.map((doc) => (
              <div key={doc.doc} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.doc}</p>
                  <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
                </div>
                <Badge variant={doc.needsNotary === "Yes" ? "default" : "secondary"} className="text-xs shrink-0">
                  {doc.needsNotary}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Referral Partner Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {REFERRAL_PARTNERS.map((p) => (
              <div key={p.type} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{p.type}</span>
                  <Badge variant="outline" className="text-xs">{p.commission}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.services}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
