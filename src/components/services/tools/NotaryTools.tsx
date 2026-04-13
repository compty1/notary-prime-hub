import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Calculator, Shield, Copy, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const OHIO_FEE_SCHEDULE = [
  { act: "Acknowledgment", maxFee: 5, orc: "§147.08" },
  { act: "Jurat (oath/affirmation)", maxFee: 5, orc: "§147.08" },
  { act: "Copy Certification", maxFee: 5, orc: "§147.08" },
  { act: "Signature by Mark", maxFee: 5, orc: "§147.08" },
  { act: "Protest (commercial paper)", maxFee: 5, orc: "§147.08" },
  { act: "RON Session Fee", maxFee: 25, orc: "§147.63" },
  { act: "Travel Fee", maxFee: null, orc: "Not capped" },
];

const OATH_SCRIPTS = {
  oath: "Do you solemnly swear that the statements contained in this document are the truth, the whole truth, and nothing but the truth, so help you God?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements contained in this document are the truth, the whole truth, and nothing but the truth?",
};

const JOURNAL_CHECKLIST = [
  "Date and time of notarization",
  "Type of notarial act performed",
  "Type, title, or description of document",
  "Signer's printed name and signature",
  "Signer's address",
  "Method of identity verification (ID type, number, expiration)",
  "Fee charged",
  "Thumbprint (if applicable for RON)",
  "Communication technology used (for RON)",
  "Additional signers/witnesses noted",
];

const NOTARIAL_ACTS = [
  { act: "Acknowledgment", when: "Signer acknowledges they signed willingly", venue: true, oath: false },
  { act: "Jurat", when: "Signer swears/affirms content is true", venue: true, oath: true },
  { act: "Copy Certification", when: "Certifying a copy is a true reproduction", venue: true, oath: false },
  { act: "Oath/Affirmation", when: "Administering sworn statement", venue: false, oath: true },
  { act: "Signature by Mark", when: "Signer cannot write — uses X", venue: true, oath: false },
  { act: "Protest", when: "Protesting dishonored commercial paper", venue: true, oath: false },
];

export function NotaryTools() {
  const [selectedAct, setSelectedAct] = useState("oath");
  const [numActs, setNumActs] = useState("1");
  const [checkedJournal, setCheckedJournal] = useState<Set<number>>(new Set());

  const maxTotal = parseInt(numActs) * 5;

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Ohio Fee Calculator (ORC §147.08)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            {OHIO_FEE_SCHEDULE.map(f => (
              <div key={f.act} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span>{f.act}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{f.maxFee !== null ? `$${f.maxFee} max` : "No cap"}</span>
                  <Badge variant="outline" className="text-[10px]">{f.orc}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <Label>Number of Notarial Acts</Label>
            <Input type="number" min="1" value={numActs} onChange={e => setNumActs(e.target.value)} className="w-32" />
            <p className="text-sm">Maximum allowable fee: <span className="font-bold text-primary">${maxTotal}.00</span></p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Oath/Affirmation Scripts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(OATH_SCRIPTS).map(([key, script]) => (
            <div key={key} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={key === "oath" ? "default" : "secondary"}>{key === "oath" ? "Oath (Religious)" : "Affirmation (Secular)"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => copyScript(script)}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
              </div>
              <p className="text-sm italic">{script}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Notarial Act Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {NOTARIAL_ACTS.map(a => (
              <div key={a.act} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{a.act}</p>
                  <div className="flex gap-1">
                    {a.venue && <Badge variant="outline" className="text-[10px]">Venue Req.</Badge>}
                    {a.oath && <Badge variant="outline" className="text-[10px]">Oath Req.</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{a.when}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Journal Entry Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {JOURNAL_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Checkbox checked={checkedJournal.has(i)} onCheckedChange={() => {
                  setCheckedJournal(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                }} />
                <span className={checkedJournal.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{checkedJournal.size}/{JOURNAL_CHECKLIST.length} items checked</p>
        </CardContent>
      </Card>
    </div>
  );
}
