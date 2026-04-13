import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenLine, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";

const OHIO_SCRIVENER_RULES = [
  { rule: "Cannot provide legal advice or select documents", orc: "ORC §147.01" },
  { rule: "May prepare documents at the direction of the client", orc: "ORC §147.54" },
  { rule: "Must include UPL disclaimer on all prepared documents", orc: "Ohio UPL Rules" },
  { rule: "Cannot explain legal effects of documents to signers", orc: "Prof. Conduct 5.5" },
  { rule: "Must retain copies of prepared documents for 5 years", orc: "Best Practice" },
];

const COMMON_DOCUMENT_TYPES = [
  { type: "Affidavit", fields: ["Affiant name", "Statement of facts", "County", "Jurat block"], avgTime: "15 min" },
  { type: "Power of Attorney", fields: ["Principal", "Agent", "Powers granted", "Effective date", "Notary block"], avgTime: "25 min" },
  { type: "Bill of Sale", fields: ["Seller", "Buyer", "Item description", "Sale price", "Signatures"], avgTime: "10 min" },
  { type: "Promissory Note", fields: ["Lender", "Borrower", "Amount", "Interest rate", "Payment terms"], avgTime: "20 min" },
  { type: "Lease Agreement", fields: ["Landlord", "Tenant", "Property address", "Term", "Rent amount"], avgTime: "30 min" },
  { type: "Corporate Resolution", fields: ["Corporation name", "Resolution text", "Board members", "Date"], avgTime: "15 min" },
];

export function ScrivenerTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Ohio Scrivener Compliance Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {OHIO_SCRIVENER_RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.rule}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{r.orc}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Document Preparation Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {COMMON_DOCUMENT_TYPES.map((doc) => (
              <div key={doc.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{doc.type}</h4>
                  <Badge variant="secondary" className="text-xs">{doc.avgTime}</Badge>
                </div>
                <div className="space-y-1">
                  {doc.fields.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
