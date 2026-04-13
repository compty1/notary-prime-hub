/**
 * Sprint 9: Legal Tools Panel
 * ORC reference lookup, compliance checklist, UPL guard, document structure validator
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Scale, Search, ShieldAlert, CheckSquare, FileText } from "lucide-react";

const ORC_SECTIONS = [
  { section: "§147.01", title: "Definitions", summary: "Definitions of notary, notarial act, etc." },
  { section: "§147.03", title: "Appointment & Commission", summary: "Requirements for notary commission in Ohio" },
  { section: "§147.04", title: "Powers of Notary", summary: "Authorized notarial acts including oaths, acknowledgments" },
  { section: "§147.08", title: "Fees", summary: "Maximum fee of $5 per notarial act" },
  { section: "§147.53", title: "Oaths & Affirmations", summary: "Administration of oaths and affirmations" },
  { section: "§147.542", title: "Identity Verification", summary: "Satisfactory evidence of identity requirements" },
  { section: "§147.551", title: "Journal Requirements", summary: "Recording notarial acts in journal" },
  { section: "§147.63", title: "RON Recording Consent", summary: "Audio-video recording consent for RON" },
  { section: "§147.65", title: "RON Authorization", summary: "Remote online notarization authorization" },
  { section: "§147.66", title: "RON Requirements", summary: "KBA, credential analysis, recording requirements" },
  { section: "§1337.09", title: "POA Execution", summary: "Power of Attorney execution requirements in Ohio" },
  { section: "§2107.03", title: "Will Execution", summary: "Requirements for valid will execution" },
  { section: "§1335.04", title: "Statute of Frauds", summary: "Contracts required to be in writing" },
];

const DOCUMENT_STRUCTURE_ITEMS = [
  "Title/heading present",
  "Parties identified with full legal names",
  "Date of execution",
  "Recitals/whereas clauses (if applicable)",
  "Numbered paragraphs/sections",
  "Defined terms section",
  "Governing law clause",
  "Severability clause",
  "Signature blocks for all parties",
  "Witness lines (if required)",
  "Notarization block",
  "Venue (State and County)",
];

export function LegalTools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedStructure, setCheckedStructure] = useState<Set<number>>(new Set());

  const filteredORC = ORC_SECTIONS.filter(s =>
    s.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStructure = (idx: number) => {
    setCheckedStructure(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const structureScore = Math.round((checkedStructure.size / DOCUMENT_STRUCTURE_ITEMS.length) * 100);

  return (
    <div className="space-y-4">
      {/* UPL Warning */}
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="text-xs font-semibold">UPL Warning</AlertTitle>
        <AlertDescription className="text-xs">
          Notaries and document professionals may NOT provide legal advice, select documents for clients,
          or explain the legal effects of documents. Doing so constitutes the Unauthorized Practice of Law
          under Ohio law. Always refer clients to an attorney for legal questions.
        </AlertDescription>
      </Alert>

      {/* ORC Reference Lookup */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4" /> Ohio Revised Code Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search ORC sections..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-7"
            />
          </div>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1.5">
              {filteredORC.map(s => (
                <div key={s.section} className="border rounded p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">{s.section}</Badge>
                    <span className="font-medium">{s.title}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{s.summary}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Structure Validator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Document Structure Check
            <Badge variant={structureScore === 100 ? "default" : "secondary"} className="ml-auto text-[10px]">
              {structureScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {DOCUMENT_STRUCTURE_ITEMS.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={checkedStructure.has(i)}
                  onCheckedChange={() => toggleStructure(i)}
                />
                <span className={checkedStructure.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4" /> Pre-Notarization Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>☐ Signer personally appeared (or via RON platform)</li>
            <li>☐ Identity verified via acceptable ID (DL, passport, state ID, military)</li>
            <li>☐ ID is current and not expired</li>
            <li>☐ Signer appears willing and aware</li>
            <li>☐ Document is complete — no blank spaces</li>
            <li>☐ Notary does not have beneficial interest</li>
            <li>☐ Notary is not related to signer</li>
            <li>☐ Journal entry prepared</li>
            <li>☐ Correct notarial act type selected</li>
            <li>☐ Seal/stamp applied correctly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
