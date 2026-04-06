import { CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SignerChecklistProps {
  type?: "in_person" | "ron";
  className?: string;
}

const inPersonItems = [
  "Bring a valid, unexpired government-issued photo ID (driver's license, passport, or state ID)",
  "Bring original document(s) — do NOT sign beforehand",
  "All signers must be physically present before the notary",
  "Be prepared to state your identity and sign in the notary's presence",
  "Bring payment (card, Venmo, Zelle, CashApp, or cash for in-person)",
];

const ronItems = [
  "Have a valid, unexpired government-issued photo ID ready to show on camera",
  "Use a computer with a working camera and microphone",
  "Ensure a stable internet connection (5+ Mbps recommended)",
  "Have your document(s) in digital format (PDF preferred)",
  "Be in a quiet, well-lit room for the video session",
  "Be ready to answer 5 Knowledge-Based Authentication (KBA) questions",
];

const warnings = [
  "Do NOT sign the document before your session — the notary must witness your signature",
  "The notary cannot provide legal advice or explain document contents (ORC §147.01)",
];

export function SignerChecklist({ type = "in_person", className }: SignerChecklistProps) {
  const items = type === "ron" ? ronItems : inPersonItems;

  return (
    <Card className={className}>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-sans text-base font-semibold text-foreground">
          Signer Preparation Checklist
        </h3>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 rounded-lg bg-destructive/5 p-3">
          {warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{w}</span>
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
