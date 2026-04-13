import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Clock, FileText, DollarSign } from "lucide-react";

const COUNTY_FEES: Record<string, Record<string, number>> = {
  "Franklin": { "Civil": 300, "Domestic": 350, "Probate": 200, "Small Claims": 75 },
  "Cuyahoga": { "Civil": 310, "Domestic": 360, "Probate": 225, "Small Claims": 80 },
  "Hamilton": { "Civil": 290, "Domestic": 340, "Probate": 210, "Small Claims": 70 },
  "Summit": { "Civil": 295, "Domestic": 345, "Probate": 200, "Small Claims": 75 },
  "Montgomery": { "Civil": 285, "Domestic": 335, "Probate": 195, "Small Claims": 65 },
};

const RESPONSE_DEADLINES: Record<string, { days: number; notes: string }> = {
  "Answer to Complaint": { days: 28, notes: "Ohio Civ.R. 12(A)(1) — 28 days from service" },
  "Motion to Dismiss": { days: 28, notes: "Must be filed before Answer" },
  "Discovery Response": { days: 28, notes: "Ohio Civ.R. 33-36" },
  "Appeal (Final Order)": { days: 30, notes: "App.R. 4(A) — 30 days from judgment entry" },
  "Small Claims Answer": { days: 28, notes: "From date of service" },
  "Domestic Relations Answer": { days: 28, notes: "Ohio Civ.R. 12(A)" },
  "Motion for Summary Judgment": { days: 14, notes: "Response due 14 days before hearing" },
};

const COMMON_FORMS = [
  { form: "Complaint (Civil)", court: "Common Pleas", attachments: ["Summons", "Civil Cover Sheet", "Praecipe"] },
  { form: "Dissolution Petition", court: "Domestic Relations", attachments: ["Separation Agreement", "Parenting Plan", "Financial Disclosure"] },
  { form: "Small Claims Complaint", court: "Municipal", attachments: ["Statement of Claim"] },
  { form: "Probate Application", court: "Probate", attachments: ["Death Certificate", "Will (if exists)", "Fiduciary's Acceptance"] },
  { form: "Protection Order", court: "Domestic Relations", attachments: ["Petition", "Affidavit"] },
];

export function CourtFormsTools() {
  const [county, setCounty] = useState("");
  const [caseType, setCaseType] = useState("");

  const fees = county && caseType ? COUNTY_FEES[county]?.[caseType] : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Filing Fee Lookup</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>County</Label>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                <SelectContent>{Object.keys(COUNTY_FEES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Case Type</Label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["Civil", "Domestic", "Probate", "Small Claims"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {fees !== null && fees !== undefined && (
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Estimated Filing Fee</p>
              <p className="text-3xl font-bold text-primary">${fees}</p>
              <p className="text-xs text-muted-foreground mt-1">{county} County — {caseType}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Response Deadline Calculator</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(RESPONSE_DEADLINES).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between text-sm p-2 rounded border">
                <span className="font-medium">{name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{info.days} days</Badge>
                  <span className="text-xs text-muted-foreground max-w-[200px] truncate">{info.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Common Forms & Required Attachments</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COMMON_FORMS.map((f, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{f.form}</p>
                  <Badge variant="outline">{f.court}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {f.attachments.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
