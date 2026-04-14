import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Home, Calculator, FileText, CheckCircle, ClipboardCheck } from "lucide-react";

const SIGNING_PACKAGE_DOCS = [
  { name: "Promissory Note", pages: "2-4", critical: true },
  { name: "Deed of Trust / Mortgage", pages: "15-30", critical: true },
  { name: "Closing Disclosure", pages: "5", critical: true },
  { name: "Right to Cancel (Rescission)", pages: "2", critical: true },
  { name: "HUD-1 / Settlement Statement", pages: "3-5", critical: false },
  { name: "Title Insurance Commitment", pages: "10-20", critical: false },
  { name: "Tax Information Sheet", pages: "1", critical: false },
  { name: "Compliance Agreement", pages: "1-2", critical: false },
  { name: "Signature/Notary Affidavit", pages: "1", critical: true },
  { name: "Name Affidavit", pages: "1", critical: false },
  { name: "Occupancy Affidavit", pages: "1", critical: false },
  { name: "Anti-Coercion Statement", pages: "1", critical: false },
  { name: "W-9", pages: "1", critical: false },
  { name: "1099-S", pages: "1", critical: false },
  { name: "Errors & Omissions Agreement", pages: "1-2", critical: false },
];

const E_RECORDING_STATUS = [
  { county: "Franklin", eRecording: true, vendor: "Simplifile" },
  { county: "Cuyahoga", eRecording: true, vendor: "CSC" },
  { county: "Hamilton", eRecording: true, vendor: "Simplifile" },
  { county: "Summit", eRecording: true, vendor: "Simplifile" },
  { county: "Montgomery", eRecording: true, vendor: "CSC" },
  { county: "Lucas", eRecording: true, vendor: "Simplifile" },
  { county: "Butler", eRecording: false, vendor: "—" },
  { county: "Stark", eRecording: true, vendor: "CSC" },
  { county: "Delaware", eRecording: true, vendor: "Simplifile" },
  { county: "Licking", eRecording: true, vendor: "CSC" },
  { county: "Fairfield", eRecording: true, vendor: "Simplifile" },
  { county: "Madison", eRecording: false, vendor: "—" },
];

const CLOSING_CHECKLIST = [
  { step: "Pre-Closing", items: [
    "Confirm signing date, time, and location with all parties",
    "Verify signer identities match loan documents",
    "Review closing package for completeness",
    "Confirm notary stamp and journal are available",
    "Check for Power of Attorney documents (if applicable)",
  ]},
  { step: "At Signing", items: [
    "Verify government-issued photo ID for all signers",
    "Walk borrowers through Closing Disclosure",
    "Ensure all signature/initial blocks are completed",
    "Apply notary seal to all required documents",
    "Complete journal entry with full signer details",
  ]},
  { step: "Post-Closing", items: [
    "Scan and upload completed package",
    "Return docs to title company/lender via secure courier",
    "Confirm receipt with title company",
    "Send invoice for signing agent fee",
    "File journal entry for record retention",
  ]},
];

export function RealEstateTools() {
  const [salePrice, setSalePrice] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});
  const [checkedClosing, setCheckedClosing] = useState<Record<string, boolean>>({});

  const price = parseFloat(salePrice) || 0;
  const loan = parseFloat(loanAmount) || 0;
  const transferTax = price * 0.004;
  const titleInsurance = price * 0.005;
  const recordingFees = 50;
  const notaryFee = 150;
  const totalClosing = transferTax + titleInsurance + recordingFees + notaryFee;

  const totalChecklistItems = CLOSING_CHECKLIST.reduce((acc, s) => acc + s.items.length, 0);
  const completedChecklistItems = Object.values(checkedClosing).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Interactive Closing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Closing Checklist
            <Badge variant="secondary" className="ml-auto">{completedChecklistItems}/{totalChecklistItems}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CLOSING_CHECKLIST.map((section) => (
            <div key={section.step}>
              <p className="text-sm font-semibold mb-2">{section.step}</p>
              <div className="space-y-1.5 ml-2">
                {section.items.map((item, i) => {
                  const key = `${section.step}-${i}`;
                  return (
                    <label key={key} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors">
                      <input type="checkbox" checked={!!checkedClosing[key]} onChange={() => setCheckedClosing(prev => ({ ...prev, [key]: !prev[key] }))} className="rounded mt-0.5" />
                      <span className={checkedClosing[key] ? "line-through text-muted-foreground" : ""}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Signing Package Tracker</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {SIGNING_PACKAGE_DOCS.map((doc, i) => (
              <label key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!checkedDocs[i]} onChange={() => setCheckedDocs(prev => ({ ...prev, [i]: !prev[i] }))} className="rounded" />
                  <span className={checkedDocs[i] ? "line-through text-muted-foreground" : ""}>{doc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{doc.pages} pages</span>
                  {doc.critical && <Badge variant="destructive" className="text-[10px] px-1">Critical</Badge>}
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {Object.values(checkedDocs).filter(Boolean).length}/{SIGNING_PACKAGE_DOCS.length} verified • Total est. pages: 50-100+
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Ohio Closing Cost Estimator</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sale Price ($)</Label><Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="250000" /></div>
            <div><Label>Loan Amount ($)</Label><Input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="200000" /></div>
          </div>
          {price > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-sm"><span>Conveyance Fee ($4/$1,000)</span><span className="font-mono">${transferTax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Title Insurance (est.)</span><span className="font-mono">${titleInsurance.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Recording Fees</span><span className="font-mono">${recordingFees.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Notary Signing Agent Fee</span><span className="font-mono">${notaryFee.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>Estimated Total</span><span>${totalClosing.toFixed(2)}</span></div>
              <p className="text-xs text-muted-foreground">Ohio conveyance fee per ORC §322.02. Estimates only.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Home className="h-5 w-5 text-primary" /> Ohio E-Recording Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {E_RECORDING_STATUS.map(c => (
              <div key={c.county} className="flex items-center justify-between text-sm p-2 rounded border">
                <span>{c.county}</span>
                <div className="flex items-center gap-1.5">
                  <Badge className={c.eRecording ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-muted text-muted-foreground"}>
                    {c.eRecording ? "Available" : "Manual"}
                  </Badge>
                  {c.eRecording && <span className="text-xs text-muted-foreground">{c.vendor}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
