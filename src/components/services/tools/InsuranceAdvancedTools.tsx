import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, DollarSign, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const INSURANCE_TYPES = [
  { type: "Notary E&O Insurance", coverage: "$25,000-$100,000", premium: "$100-400/yr", required: "Required", desc: "Covers errors, omissions, negligence in notarial acts" },
  { type: "Notary Surety Bond", coverage: "$10,000 (Ohio min)", premium: "$50-100/yr", required: "Required", desc: "Protects the public from notary misconduct per ORC §147.01" },
  { type: "General Liability", coverage: "$1M-$2M", premium: "$300-800/yr", required: "Recommended", desc: "Bodily injury, property damage at client locations" },
  { type: "Professional Liability", coverage: "$1M-$5M", premium: "$500-1,500/yr", required: "Recommended", desc: "Broader coverage for all professional services rendered" },
  { type: "Cyber Liability", coverage: "$500K-$2M", premium: "$200-600/yr", required: "Recommended", desc: "Data breach, identity theft, digital document mishandling" },
  { type: "Commercial Auto", coverage: "State minimum+", premium: "$1,000-2,500/yr", required: "If mobile", desc: "Coverage for business use of vehicle for mobile notary" },
  { type: "Workers' Compensation", coverage: "Per state law", premium: "Varies", required: "If employees", desc: "Required in Ohio if you have employees (ORC §4123)" },
];

const CLAIM_PREVENTION = [
  "Always verify signer identity with acceptable ID per ORC §147.53",
  "Never notarize for signers who appear coerced or incompetent",
  "Complete journal entries contemporaneously — not after the fact",
  "Keep copies of all identification documents presented",
  "Use proper notarial certificates matching the act performed",
  "Refuse to notarize incomplete documents or blank forms",
  "Maintain E&O insurance with adequate coverage limits",
  "Document any unusual circumstances in journal notes",
  "Never provide legal advice or explain document contents",
  "Report any known fraud to authorities and insurance carrier",
];

const OHIO_BOND_REQUIREMENTS = [
  { req: "Minimum bond amount: $10,000", orc: "ORC §147.01" },
  { req: "Bond must be filed with Secretary of State", orc: "ORC §147.04" },
  { req: "Bond active for entire commission term (5 years)", orc: "ORC §147.03" },
  { req: "Surety must be authorized to do business in Ohio", orc: "ORC §147.01" },
  { req: "RON notaries: additional $25,000 bond may be required", orc: "ORC §147.63" },
];

export function InsuranceAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Insurance Coverage Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {INSURANCE_TYPES.map((ins) => (
              <div key={ins.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{ins.type}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={ins.required === "Required" ? "default" : "secondary"} className="text-xs">{ins.required}</Badge>
                    <Badge variant="outline" className="text-xs"><DollarSign className="h-3 w-3" />{ins.premium}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{ins.desc}</p>
                <p className="text-xs mt-1"><span className="font-medium">Coverage:</span> {ins.coverage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Claim Prevention Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CLAIM_PREVENTION.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ohio Surety Bond Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OHIO_BOND_REQUIREMENTS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                <span className="text-sm flex-1">{r.req}</span>
                <Badge variant="outline" className="text-xs shrink-0">{r.orc}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
