import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Fingerprint, AlertTriangle, CheckCircle, FileText } from "lucide-react";

const FD258_FIELDS = [
  { field: "Last Name", block: "1", required: true },
  { field: "First Name", block: "2", required: true },
  { field: "Middle Name", block: "3", required: false },
  { field: "Aliases", block: "4", required: false },
  { field: "Date of Birth", block: "5", required: true },
  { field: "Place of Birth", block: "6", required: true },
  { field: "SSN", block: "7", required: false },
  { field: "Sex", block: "8", required: true },
  { field: "Race", block: "9", required: true },
  { field: "Height", block: "10", required: true },
  { field: "Weight", block: "11", required: true },
  { field: "Eyes", block: "12", required: true },
  { field: "Hair", block: "13", required: true },
  { field: "Reason Fingerprinted", block: "14", required: true },
  { field: "Residence", block: "15", required: true },
  { field: "Employer", block: "16", required: false },
  { field: "ORI", block: "17", required: true },
];

const INK_QUALITY_CHECKLIST = [
  "Ink pad is properly inked (not dry or oversaturated)",
  "Fingerprints rolled nail-to-nail completely",
  "No smudging or double impressions",
  "All 10 prints clearly captured",
  "Plain impressions match rolled impressions",
  "Card is clean — no stray marks",
  "Correct finger in each box",
  "Amputations/bandaged fingers noted properly",
];

const COMMON_REJECTIONS = [
  { reason: "Smudged or unclear prints", frequency: "Very Common", fix: "Re-roll slowly, ensure clean fingers" },
  { reason: "Missing fingerprints", frequency: "Common", fix: "Verify all 10 boxes filled" },
  { reason: "Incorrect ORI number", frequency: "Common", fix: "Verify with requesting agency" },
  { reason: "Wrong finger in box", frequency: "Occasional", fix: "Follow standard finger numbering" },
  { reason: "Ink too light or heavy", frequency: "Common", fix: "Test ink on scratch paper first" },
  { reason: "Card damaged or stained", frequency: "Occasional", fix: "Use fresh card, clean workspace" },
];

export function FingerprintingTools() {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /> FD-258 Card Field Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {FD258_FIELDS.map(f => (
              <div key={f.block} className="flex items-center gap-2 text-sm p-2 rounded border">
                <span className="font-mono text-xs text-muted-foreground w-6">#{f.block}</span>
                <span className="flex-1">{f.field}</span>
                {f.required && <Badge variant="destructive" className="text-[10px] px-1">Req</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Ink Quality Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {INK_QUALITY_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Checkbox checked={checkedItems.has(i)} onCheckedChange={() => toggleCheck(i)} />
                <span className={checkedItems.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{checkedItems.size}/{INK_QUALITY_CHECKLIST.length} checks passed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Common FBI/BCI Rejection Reasons</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COMMON_REJECTIONS.map((r, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{r.reason}</p>
                  <Badge variant="outline">{r.frequency}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Fix: {r.fix}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
