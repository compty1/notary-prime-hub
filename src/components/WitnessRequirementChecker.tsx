import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface WitnessRule {
  required: boolean;
  count: number;
  notes: string;
  orcReference?: string;
}

const WITNESS_RULES: Record<string, WitnessRule> = {
  "General Notarization": { required: false, count: 0, notes: "Witnesses not required for standard acknowledgments or jurats in Ohio.", orcReference: "ORC §147.53" },
  "Real Estate Closing": { required: false, count: 0, notes: "Ohio does not require witnesses for real estate deed notarization, but lenders may require them." },
  "Power of Attorney": { required: false, count: 0, notes: "Ohio does not require witnesses for POA. However, it's recommended for medical POA." },
  "Healthcare Directive / Living Will": { required: true, count: 2, notes: "Ohio requires 2 witnesses for living wills per ORC §1337.12. Witnesses must be age 18+ and cannot be the agent or healthcare provider.", orcReference: "ORC §1337.12" },
  "Last Will & Testament": { required: true, count: 2, notes: "Ohio requires 2 competent witnesses per ORC §2107.03. Witnesses should be disinterested (not beneficiaries).", orcReference: "ORC §2107.03" },
  "Self-Proving Affidavit": { required: true, count: 2, notes: "Same witnesses who witnessed the will must sign the self-proving affidavit before a notary.", orcReference: "ORC §2107.081" },
  "Oath of Office": { required: false, count: 0, notes: "No witness requirement, but ceremony may include witnesses by tradition." },
  "I-9 Employment Verification": { required: false, count: 0, notes: "No witnesses needed. Employer representative or authorized notary reviews documents." },
  "Vehicle Title Transfer": { required: false, count: 0, notes: "No witnesses required for Ohio vehicle title notarization." },
  "Affidavit (General)": { required: false, count: 0, notes: "Standard affidavits require only notarization (jurat), no witnesses." },
  "Travel Consent Form": { required: false, count: 0, notes: "No legal witness requirement, but an additional witness is recommended for international travel." },
  "Adoption Consent": { required: true, count: 1, notes: "Ohio adoption consent requires at least 1 witness plus notarization per ORC §3107.081.", orcReference: "ORC §3107.081" },
};

export function WitnessRequirementChecker() {
  const [selected, setSelected] = useState<string>("");
  const rule = selected ? WITNESS_RULES[selected] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Witness Requirement Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger><SelectValue placeholder="Select document type..." /></SelectTrigger>
          <SelectContent>
            {Object.keys(WITNESS_RULES).map(k => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {rule && (
          <div className={`rounded-lg border p-4 ${rule.required ? "border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700" : "border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-700"}`}>
            <div className="flex items-center gap-2 mb-2">
              {rule.required ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <span className="font-semibold text-sm">
                {rule.required ? `${rule.count} Witness${rule.count > 1 ? "es" : ""} Required` : "No Witnesses Required"}
              </span>
              {rule.orcReference && (
                <Badge variant="outline" className="text-xs">
                  <a href={`https://codes.ohio.gov/ohio-revised-code/section-${rule.orcReference.replace("ORC §", "").replace(".", "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {rule.orcReference}
                  </a>
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{rule.notes}</p>
          </div>
        )}

        {!selected && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Select a document type above to check Ohio witness requirements. Requirements vary by document type per the Ohio Revised Code.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
