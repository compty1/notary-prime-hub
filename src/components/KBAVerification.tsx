import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

// TODO: Replace with IDology/Evident API integration
// This is a placeholder KBA flow for RON compliance (ORC §147.66)

interface KBAVerificationProps {
  signerName: string;
  onComplete: (passed: boolean) => void;
  onCancel: () => void;
}

type Step = "signer_info" | "generating" | "questions" | "result";

interface KBAQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

// Placeholder questions — in production, these come from IDology/Evident API
const PLACEHOLDER_QUESTIONS: KBAQuestion[] = [
  {
    id: "q1",
    question: "Which of the following addresses have you been associated with?",
    options: ["123 Main St, Columbus, OH", "456 Oak Ave, Dublin, OH", "789 Pine Rd, Westerville, OH", "None of the above"],
    correctIndex: 0,
  },
  {
    id: "q2",
    question: "Which of the following vehicles have you owned or leased?",
    options: ["2018 Honda Civic", "2020 Toyota Camry", "2019 Ford F-150", "None of the above"],
    correctIndex: 1,
  },
  {
    id: "q3",
    question: "In which county have you lived?",
    options: ["Franklin County", "Delaware County", "Licking County", "None of the above"],
    correctIndex: 0,
  },
  {
    id: "q4",
    question: "Which of the following people are associated with you?",
    options: ["John Smith", "Jane Doe", "Robert Johnson", "None of the above"],
    correctIndex: 3,
  },
  {
    id: "q5",
    question: "What year were you born?",
    options: ["1985", "1990", "1978", "None of the above"],
    correctIndex: 0,
  },
];

export default function KBAVerification({ signerName, onComplete, onCancel }: KBAVerificationProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("signer_info");
  const [signerSSNLast4, setSignerSSNLast4] = useState("");
  const [signerDOB, setSignerDOB] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<boolean | null>(null);

  const startKBA = async () => {
    if (!signerSSNLast4 || !signerDOB) {
      toast({ title: "Required fields", description: "SSN last 4 and DOB are required.", variant: "destructive" });
      return;
    }
    setStep("generating");

    // TODO: Replace with actual API call to IDology/Evident
    // const response = await fetch('https://api.idology.com/kba/start', { ... });
    await new Promise(r => setTimeout(r, 2000)); // Simulate API call

    setStep("questions");
  };

  const submitAnswers = async () => {
    setStep("generating");

    // TODO: Replace with actual API call to verify answers
    // In production, send answers to IDology/Evident API for verification
    await new Promise(r => setTimeout(r, 1500));

    // Placeholder: require at least 4 of 5 correct (80% threshold per MISMO standards)
    const correct = PLACEHOLDER_QUESTIONS.filter(q => answers[q.id] === q.correctIndex).length;
    const passed = correct >= 4;
    setResult(passed);
    setStep("result");
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-sans font-semibold">Knowledge-Based Authentication (KBA)</h3>
          <Badge variant="outline" className="text-xs">ORC §147.66</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          KBA is required for Remote Online Notarization under Ohio law. The signer must correctly answer identity verification questions.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <strong>Placeholder:</strong> This uses simulated questions. Connect IDology or Evident API for production KBA.
        </div>

        {step === "signer_info" && (
          <div className="space-y-3">
            <div>
              <Label>Signer Name</Label>
              <Input value={signerName} readOnly className="bg-muted/30" />
            </div>
            <div>
              <Label>Last 4 of SSN *</Label>
              <Input value={signerSSNLast4} onChange={(e) => setSignerSSNLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" maxLength={4} type="password" />
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" value={signerDOB} onChange={(e) => setSignerDOB(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={startKBA} disabled={!signerSSNLast4 || !signerDOB} className="">
                Generate KBA Questions
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Processing identity verification...</span>
          </div>
        )}

        {step === "questions" && (
          <div className="space-y-6">
            <p className="text-sm font-medium">Answer the following {PLACEHOLDER_QUESTIONS.length} questions within 2 minutes:</p>
            {PLACEHOLDER_QUESTIONS.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-sm">{i + 1}. {q.question}</Label>
                <RadioGroup value={String(answers[q.id] ?? "")} onValueChange={(v) => setAnswers(prev => ({ ...prev, [q.id]: parseInt(v) }))}>
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <RadioGroupItem value={String(j)} id={`${q.id}-${j}`} />
                      <Label htmlFor={`${q.id}-${j}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={submitAnswers} disabled={Object.keys(answers).length < PLACEHOLDER_QUESTIONS.length} className="">
                Submit Answers
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="text-center py-4 space-y-3">
            {result ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                <h4 className="font-sans text-lg font-bold text-emerald-600">KBA Passed</h4>
                <p className="text-sm text-muted-foreground">Identity verification successful. The signer has been authenticated.</p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                <h4 className="font-sans text-lg font-bold text-destructive">KBA Failed</h4>
                <p className="text-sm text-muted-foreground">Identity verification unsuccessful. The signer did not meet the authentication threshold.</p>
              </>
            )}
            <Button onClick={() => onComplete(result!)} className="">
              Continue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
