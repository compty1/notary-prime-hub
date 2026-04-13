import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fingerprint, AlertTriangle, Wrench, FileText } from "lucide-react";

const FD258_FIELDS = [
  { id: "name", label: "Subject's Name", block: "1", required: true },
  { id: "aliases", label: "Aliases (AKA)", block: "2", required: false },
  { id: "dob", label: "Date of Birth", block: "4", required: true },
  { id: "ssn", label: "Social Security No.", block: "5", required: false },
  { id: "sex", label: "Sex", block: "6", required: true },
  { id: "race", label: "Race", block: "7", required: true },
  { id: "height", label: "Height", block: "8", required: true },
  { id: "weight", label: "Weight", block: "9", required: true },
  { id: "eyes", label: "Eye Color", block: "10", required: true },
  { id: "hair", label: "Hair Color", block: "11", required: true },
  { id: "pob", label: "Place of Birth", block: "12", required: true },
  { id: "citizenship", label: "Citizenship", block: "14", required: true },
  { id: "reason", label: "Reason Fingerprinted", block: "ORI", required: true },
  { id: "residence", label: "Residence of Person", block: "13", required: true },
];

const INK_CHECKLIST = [
  { id: "ink_type", label: "Using FBI-approved ink pad (black ink only)" },
  { id: "ink_coverage", label: "Full ridge detail visible — no smudges" },
  { id: "pressure", label: "Even pressure applied — nail-to-nail roll" },
  { id: "sequence", label: "Correct finger sequence (R-thumb through L-little)" },
  { id: "plain", label: "Plain impressions taken (4-finger simultaneous)" },
  { id: "clean", label: "Fingers cleaned before printing" },
  { id: "dry", label: "Fingers completely dry" },
  { id: "card_flat", label: "Card secured flat on hard surface" },
];

const REJECTION_REASONS = [
  { reason: "Insufficient ridge detail", freq: "Very Common", fix: "Re-roll with more ink. Apply hand lotion 30 min before." },
  { reason: "Smudged impressions", freq: "Common", fix: "Clean fingers thoroughly. Use single smooth roll motion." },
  { reason: "Wrong finger sequence", freq: "Occasional", fix: "Double-check FBI sequence chart. Mark any amputations." },
  { reason: "Too light/too dark", freq: "Common", fix: "Adjust ink amount. Practice on blank cards first." },
  { reason: "Missing plain impressions", freq: "Occasional", fix: "Ensure all 4-finger simultaneous prints are captured." },
  { reason: "Card damaged or torn", freq: "Rare", fix: "Handle cards by edges. Use fresh card if damaged." },
];

export function FingerprintingAdvancedTools() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Tabs defaultValue="fd258">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="fd258"><FileText className="h-3 w-3 mr-1" /> FD-258 Mapper</TabsTrigger>
        <TabsTrigger value="ink"><Wrench className="h-3 w-3 mr-1" /> Ink Checklist</TabsTrigger>
        <TabsTrigger value="rejections"><AlertTriangle className="h-3 w-3 mr-1" /> Rejections</TabsTrigger>
      </TabsList>

      <TabsContent value="fd258">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Fingerprint className="h-4 w-4 text-primary" /> FD-258 Card Field Reference</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {FD258_FIELDS.map(f => (
                <div key={f.id} className="flex items-center justify-between text-xs border rounded p-2">
                  <div>
                    <span className="font-mono text-muted-foreground">Block {f.block}:</span>
                    <span className="ml-1 font-medium">{f.label}</span>
                  </div>
                  {f.required && <Badge variant="destructive" className="text-[9px] h-4">REQ</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ink">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ink Quality Checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {INK_CHECKLIST.map(item => (
                <li key={item.id} className="flex items-center gap-2">
                  <Checkbox checked={checkedItems.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                  <span className={`text-sm ${checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">{checkedItems.size}/{INK_CHECKLIST.length} items verified</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rejections">
        <Card>
          <CardHeader><CardTitle className="text-sm">Common FBI/BCI Rejection Reasons</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {REJECTION_REASONS.map((r, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.reason}</span>
                    <Badge variant="outline" className="text-xs">{r.freq}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground"><strong>Fix:</strong> {r.fix}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
