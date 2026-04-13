import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, FileText, DollarSign } from "lucide-react";

const COVERAGE_TYPES = [
  { type: "E&O (Errors & Omissions)", required: true, minCoverage: "$25,000", notes: "Required for Ohio notaries. Covers mistakes in notarial acts." },
  { type: "Surety Bond", required: true, minCoverage: "$10,000 (traditional) / $25,000 (RON)", notes: "Ohio ORC §147.01. Protects public from notary negligence." },
  { type: "General Liability", required: false, minCoverage: "$1,000,000", notes: "Recommended for mobile notaries visiting client locations." },
  { type: "Cyber Liability", required: false, minCoverage: "$100,000", notes: "Covers data breaches, especially important for RON notaries." },
  { type: "Professional Liability", required: false, minCoverage: "$500,000", notes: "Broader coverage for professional advice/services." },
  { type: "Workers Comp", required: false, minCoverage: "State minimum", notes: "Required if you have employees." },
];

const CLAIM_SCENARIOS = [
  { scenario: "Wrong document notarized — signer sues", coverage: "E&O", risk: "high" },
  { scenario: "Failed to verify identity — fraud occurs", coverage: "E&O + Surety Bond", risk: "high" },
  { scenario: "Trip and fall at client's office", coverage: "General Liability", risk: "medium" },
  { scenario: "Client data breach from laptop theft", coverage: "Cyber Liability", risk: "medium" },
  { scenario: "Missed notarization detail — document rejected", coverage: "E&O", risk: "low" },
  { scenario: "Employee injures themselves during mobile signing", coverage: "Workers Comp", risk: "medium" },
];

export function InsuranceTools() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Coverage Types & Requirements</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COVERAGE_TYPES.map(c => (
              <div key={c.type} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{c.type}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.minCoverage}</Badge>
                    {c.required && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{c.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Common Claim Scenarios</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CLAIM_SCENARIOS.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded border">
                <div className="flex-1">
                  <p>{s.scenario}</p>
                  <p className="text-xs text-muted-foreground">Coverage: {s.coverage}</p>
                </div>
                <Badge className={
                  s.risk === "high" ? "bg-red-100 text-red-800" :
                  s.risk === "medium" ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-800"
                }>{s.risk}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
