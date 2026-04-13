import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Calculator, FileText, CheckCircle } from "lucide-react";

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
];

export function RealEstateTools() {
  const [salePrice, setSalePrice] = useState("");
  const [loanAmount, setLoanAmount] = useState("");

  const price = parseFloat(salePrice) || 0;
  const loan = parseFloat(loanAmount) || 0;
  const transferTax = price * 0.004; // Ohio conveyance fee $4 per $1000
  const titleInsurance = price * 0.005;
  const recordingFees = 50;
  const notaryFee = 150;
  const totalClosing = transferTax + titleInsurance + recordingFees + notaryFee;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Signing Package Document Tracker</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {SIGNING_PACKAGE_DOCS.map((doc, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-3.5 w-3.5 ${doc.critical ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{doc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{doc.pages} pages</span>
                  {doc.critical && <Badge variant="destructive" className="text-[10px] px-1">Critical</Badge>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Total est. pages: 50-100+ depending on transaction</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Closing Cost Estimator (Ohio)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sale Price ($)</Label><Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="250000" /></div>
            <div><Label>Loan Amount ($)</Label><Input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="200000" /></div>
          </div>
          {price > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-sm"><span>Transfer Tax ($4/$1,000)</span><span className="font-mono">${transferTax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Title Insurance (est.)</span><span className="font-mono">${titleInsurance.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Recording Fees</span><span className="font-mono">${recordingFees.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Notary Signing Fee</span><span className="font-mono">${notaryFee.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>Estimated Total</span><span>${totalClosing.toFixed(2)}</span></div>
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
                  <Badge className={c.eRecording ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}>
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
