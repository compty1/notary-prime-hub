import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertTriangle, BookOpen, CheckCircle2, HelpCircle, Printer } from "lucide-react";

const DOCUMENT_TYPES = [
  { id: "acknowledgment", name: "Acknowledgment", icon: "📝" },
  { id: "jurat", name: "Jurat", icon: "⚖️" },
  { id: "copy_certification", name: "Copy Certification", icon: "📋" },
  { id: "poa", name: "Power of Attorney", icon: "🔑" },
  { id: "corporate", name: "Corporate Resolution", icon: "🏢" },
  { id: "signature_by_mark", name: "Signature by Mark", icon: "✍️" },
  { id: "vehicle_title", name: "Vehicle Title", icon: "🚗" },
  { id: "self_proving_affidavit", name: "Self-Proving Affidavit", icon: "📜" },
  { id: "deed_transfer", name: "Deed Transfer", icon: "🏠" },
  { id: "affidavit_general", name: "General Affidavit", icon: "📄" },
  { id: "living_will", name: "Living Will", icon: "❤️" },
  { id: "trust_certification", name: "Trust Certification", icon: "🏛️" },
];

const COMMON_MISTAKES: Record<string, string[]> = {
  acknowledgment: [
    "Failing to verify signer's identity before notarizing",
    "Using jurat wording instead of acknowledgment certificate",
    "Not having signer personally appear before the notary",
    "Backdating the notarization to match document date",
    "Missing venue (State/County) on certificate",
  ],
  jurat: [
    "Not administering the oath or affirmation",
    "Signer signing before appearing before notary",
    "Using acknowledgment wording instead of jurat",
    "Forgetting to have signer raise hand for oath",
    "Not documenting oath administration in journal",
  ],
  poa: [
    "Notarizing without verifying principal's mental capacity",
    "Not confirming willing and voluntary execution",
    "Missing witness signatures when required",
    "Failing to check if POA is durable vs. springing",
    "Not advising principal they can revoke at any time",
  ],
  vehicle_title: [
    "Notarizing an open title (felony in Ohio)",
    "Missing odometer disclosure for vehicles under 20 years",
    "Not verifying VIN matches title",
    "Failing to check for liens on title",
    "Notarizing power of attorney for title transfer without proper form",
  ],
  self_proving_affidavit: [
    "Witnesses signing after testator, not simultaneously",
    "Not verifying witness qualification (beneficiaries cannot witness)",
    "Missing testator's acknowledgment of the will",
    "Witnesses not present when testator signs",
    "Using single witness when Ohio requires two",
  ],
};

const QUIZ_DATA: Record<string, { q: string; opts: string[]; answer: number }[]> = {
  acknowledgment: [
    { q: "When does the signer sign an acknowledgment?", opts: ["Before appearing", "At any time", "Before or at appearance", "Only after oath"], answer: 2 },
    { q: "What does the notary certify in an acknowledgment?", opts: ["Truth of contents", "Voluntary signing & identity", "Legal validity", "Witness testimony"], answer: 1 },
    { q: "Is an oath required for acknowledgments?", opts: ["Yes, always", "No, never", "Only for real estate", "Only in Ohio"], answer: 1 },
    { q: "What venue information is required?", opts: ["City only", "State and County", "Full address", "Zip code"], answer: 1 },
    { q: "Can a notary acknowledge their own signature?", opts: ["Yes", "No", "Only for business docs", "With a witness"], answer: 1 },
  ],
  jurat: [
    { q: "What must happen before the signer signs a jurat?", opts: ["Pay a fee", "Take an oath/affirmation", "Provide two IDs", "Have witnesses"], answer: 1 },
    { q: "What does the notary certify in a jurat?", opts: ["Identity only", "Voluntary signing", "Sworn statement before notary", "Document accuracy"], answer: 2 },
    { q: "Ohio max fee per notarial act (ORC §147.08)?", opts: ["$2", "$5", "$10", "$25"], answer: 1 },
    { q: "Can a signer affirm instead of swear?", opts: ["No", "Yes, always", "Only for religious reasons", "Only in court"], answer: 1 },
    { q: "Must the signer sign in the notary's presence for a jurat?", opts: ["No", "Yes", "Only for real estate", "Only if requested"], answer: 1 },
  ],
};

const ORC_REFERENCES: Record<string, { section: string; title: string }[]> = {
  acknowledgment: [{ section: "§147.53", title: "Acknowledgment certificate" }, { section: "§147.08", title: "Fee schedule" }, { section: "§5301.01", title: "Acknowledgment for real estate" }],
  jurat: [{ section: "§147.04", title: "Oath/affirmation authority" }, { section: "§147.53", title: "Certificate wording" }, { section: "§2317.30", title: "Perjury under oath" }],
  poa: [{ section: "§1337.09", title: "Durable POA requirements" }, { section: "§1337.12", title: "Healthcare POA" }, { section: "§147.53", title: "Notarization requirements" }],
  vehicle_title: [{ section: "§4505.03", title: "Certificate of title" }, { section: "§4505.19", title: "Odometer disclosure" }, { section: "§4549.62", title: "Open title prohibition" }],
};

export function DocumentAnatomyTools() {
  const [selectedDoc, setSelectedDoc] = useState("acknowledgment");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const mistakes = COMMON_MISTAKES[selectedDoc] || [];
  const quiz = QUIZ_DATA[selectedDoc] || QUIZ_DATA["acknowledgment"];
  const orcRefs = ORC_REFERENCES[selectedDoc] || [];

  const checkQuiz = () => setShowResults(true);
  const resetQuiz = () => { setQuizAnswers({}); setShowResults(false); };
  const score = quiz.filter((q, i) => quizAnswers[i] === q.answer).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedDoc} onValueChange={v => { setSelectedDoc(v); resetQuiz(); }}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>{DOCUMENT_TYPES.map(d => <SelectItem key={d.id} value={d.id}>{d.icon} {d.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="mistakes">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="mistakes"><AlertTriangle className="h-3 w-3 mr-1" /> Mistakes</TabsTrigger>
          <TabsTrigger value="quiz"><HelpCircle className="h-3 w-3 mr-1" /> Quiz</TabsTrigger>
          <TabsTrigger value="orc"><BookOpen className="h-3 w-3 mr-1" /> ORC Refs</TabsTrigger>
          <TabsTrigger value="card"><Printer className="h-3 w-3 mr-1" /> Quick Ref</TabsTrigger>
        </TabsList>

        <TabsContent value="mistakes">
          <Card>
            <CardHeader><CardTitle className="text-sm">Common Mistakes — {DOCUMENT_TYPES.find(d => d.id === selectedDoc)?.name}</CardTitle></CardHeader>
            <CardContent>
              {mistakes.length > 0 ? (
                <ul className="space-y-2">
                  {mistakes.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No common mistakes documented for this type yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader><CardTitle className="text-sm">Practice Quiz — {DOCUMENT_TYPES.find(d => d.id === selectedDoc)?.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {quiz.map((q, qi) => (
                <div key={qi} className="space-y-2">
                  <p className="text-sm font-medium">{qi + 1}. {q.q}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.opts.map((o, oi) => (
                      <Button key={oi} size="sm" variant={quizAnswers[qi] === oi ? (showResults ? (oi === q.answer ? "default" : "destructive") : "default") : (showResults && oi === q.answer ? "default" : "outline")}
                        onClick={() => !showResults && setQuizAnswers(a => ({ ...a, [qi]: oi }))} className="text-xs justify-start h-auto py-1.5">
                        {o}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                {!showResults ? <Button size="sm" onClick={checkQuiz} disabled={Object.keys(quizAnswers).length < quiz.length}>Check Answers</Button>
                  : <><Badge className={score === quiz.length ? "bg-emerald-500" : "bg-amber-500"}>{score}/{quiz.length} correct</Badge><Button size="sm" variant="outline" onClick={resetQuiz}>Retry</Button></>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orc">
          <Card>
            <CardHeader><CardTitle className="text-sm">Related Ohio Revised Code Sections</CardTitle></CardHeader>
            <CardContent>
              {orcRefs.length > 0 ? (
                <ul className="space-y-2">
                  {orcRefs.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-mono text-xs">{r.section}</span>
                      <span className="text-muted-foreground">— {r.title}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No ORC references for this document type.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="card">
          <Card className="print:shadow-none">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Quick Reference Card</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-3">
              <div><strong>Document:</strong> {DOCUMENT_TYPES.find(d => d.id === selectedDoc)?.name}</div>
              <div><strong>Key Requirements:</strong></div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Verify signer identity (satisfactory evidence per ORC §147.54)</li>
                <li>Signer must personally appear</li>
                <li>Complete journal entry (ORC §147.141 for RON)</li>
                <li>Affix official seal/stamp</li>
                <li>Record in chronological journal</li>
              </ul>
              <div><strong>Ohio Fee Cap:</strong> $5.00 per notarial act (ORC §147.08)</div>
              <div><strong>Ink:</strong> Black or dark blue recommended</div>
              <div><strong>Paper:</strong> Standard 8.5" × 11", no restrictions on weight</div>
              <Button size="sm" variant="outline" onClick={() => window.print()} className="mt-2"><Printer className="h-3 w-3 mr-1" /> Print Card</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
