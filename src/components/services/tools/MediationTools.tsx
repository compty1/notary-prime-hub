import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, FileText, Clock, Users } from "lucide-react";

const ADR_METHODS = [
  { method: "Mediation", binding: false, timeframe: "1-4 weeks", cost: "$500-$3,000", description: "Neutral facilitator helps parties negotiate. Non-binding unless agreement reached." },
  { method: "Arbitration", binding: true, timeframe: "2-6 months", cost: "$2,000-$10,000", description: "Arbitrator hears both sides and makes binding decision." },
  { method: "Med-Arb (Hybrid)", binding: true, timeframe: "1-3 months", cost: "$1,500-$5,000", description: "Mediation first; if no agreement, switches to arbitration." },
  { method: "Negotiation", binding: false, timeframe: "Days-weeks", cost: "Minimal", description: "Direct party-to-party discussion, possibly with attorneys." },
  { method: "Conciliation", binding: false, timeframe: "1-3 weeks", cost: "$300-$1,500", description: "Conciliator acts as go-between for hostile parties." },
];

const MEDIATION_STEPS = [
  "Opening statements by mediator",
  "Each party presents their perspective uninterrupted",
  "Identify issues and common ground",
  "Private caucuses (confidential sessions with each party)",
  "Joint session to explore solutions",
  "Negotiation of terms",
  "Draft written agreement if settlement reached",
  "Review agreement with attorneys (if present)",
  "Sign settlement agreement",
  "File with court (if court-ordered mediation)",
];

const OHIO_ADR_RULES = [
  { rule: "Court-ordered mediation: ORC §2710", notes: "Uniform Mediation Act applies in Ohio." },
  { rule: "Mediator confidentiality: ORC §2710.03", notes: "Communications during mediation are privileged." },
  { rule: "Mediator qualifications", notes: "Ohio Supreme Court Rule 16 — training and ethical requirements." },
  { rule: "Written agreement enforceability", notes: "Signed settlement agreements are enforceable as contracts." },
  { rule: "Arbitration agreements: ORC §2711", notes: "Written arbitration agreements are valid and enforceable." },
];

export function MediationTools() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> ADR Methods Comparison</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ADR_METHODS.map(m => (
              <div key={m.method} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.method}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.binding ? "default" : "secondary"}>{m.binding ? "Binding" : "Non-Binding"}</Badge>
                    <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{m.timeframe}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{m.description}</p>
                <p className="text-xs font-mono">Est. cost: {m.cost}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Mediation Process Steps</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {MEDIATION_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Ohio ADR Rules Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OHIO_ADR_RULES.map((r, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p className="font-medium text-sm">{r.rule}</p>
                <p className="text-xs text-muted-foreground">{r.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
