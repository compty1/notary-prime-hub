import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, FileText, Users, AlertTriangle } from "lucide-react";

const DOCUMENT_MATRIX: Record<string, { docs: string[]; witnesses: number; notarization: boolean; notes: string }> = {
  "Last Will & Testament": { docs: ["Will document", "Self-proving affidavit"], witnesses: 2, notarization: true, notes: "Ohio ORC §2107.03 — Must be signed by testator in presence of 2 witnesses." },
  "Living Will": { docs: ["Living will declaration", "Witness attestation"], witnesses: 2, notarization: true, notes: "Ohio ORC §2133.02 — Advance directive for healthcare." },
  "Healthcare POA": { docs: ["Healthcare POA form", "HIPAA authorization"], witnesses: 0, notarization: true, notes: "Ohio ORC §1337.12 — Agent makes healthcare decisions." },
  "Financial POA": { docs: ["Durable POA document"], witnesses: 0, notarization: true, notes: "Ohio ORC §1337.60 — Durable power remains effective upon incapacity." },
  "Trust": { docs: ["Trust agreement", "Schedule of assets", "Certificate of trust"], witnesses: 0, notarization: true, notes: "Revocable or irrevocable. Pour-over will recommended." },
  "Beneficiary Designations": { docs: ["Beneficiary change forms"], witnesses: 0, notarization: false, notes: "Review for each account: 401k, IRA, life insurance." },
  "Transfer on Death Affidavit": { docs: ["TOD affidavit", "Property description"], witnesses: 0, notarization: true, notes: "Ohio ORC §5302.22 — Real property transfer on death." },
};

const CAPACITY_CHECKLIST = [
  "Signer understands the nature and extent of their property",
  "Signer knows the natural objects of their bounty (family members)",
  "Signer understands the nature of the testamentary act",
  "Signer can articulate a plan for distribution",
  "Signer is not acting under undue influence",
  "Signer appears coherent and oriented to time, place, and person",
  "No indication of fraud, duress, or coercion",
];

export function EstatePlanningTools() {
  const [docType, setDocType] = useState("");
  const [checkedCapacity, setCheckedCapacity] = useState<Set<number>>(new Set());

  const doc = docType ? DOCUMENT_MATRIX[docType] : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Estate Document Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
            <SelectContent>
              {Object.keys(DOCUMENT_MATRIX).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {doc && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Required Documents:</p>
                {doc.docs.map((d, i) => <p key={i} className="text-sm flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{d}</p>)}
              </div>
              <div className="flex gap-3">
                {doc.witnesses > 0 && <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{doc.witnesses} Witnesses Required</Badge>}
                {doc.notarization && <Badge className="bg-primary/10 text-primary">Notarization Required</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{doc.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Testamentary Capacity Assessment</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CAPACITY_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Checkbox checked={checkedCapacity.has(i)} onCheckedChange={() => {
                  setCheckedCapacity(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                }} />
                <span className={checkedCapacity.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">{checkedCapacity.size}/{CAPACITY_CHECKLIST.length} indicators confirmed</p>
            {checkedCapacity.size < CAPACITY_CHECKLIST.length && checkedCapacity.size > 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Incomplete — proceed with caution</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
