import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Clock, Users, FileText, DollarSign } from "lucide-react";

const MEDIATION_PHASES = [
  { phase: "Opening Statement", duration: "10-15 min", tasks: ["Mediator introduces process", "Set ground rules", "Confirm confidentiality agreement", "Each party gives opening statement"] },
  { phase: "Issue Identification", duration: "20-30 min", tasks: ["List all disputed issues", "Prioritize by importance/urgency", "Identify shared interests", "Reframe positions as interests"] },
  { phase: "Negotiation/Caucus", duration: "30-60 min", tasks: ["Private sessions with each party", "Reality-test positions", "Explore settlement options", "Develop proposals"] },
  { phase: "Agreement Drafting", duration: "15-30 min", tasks: ["Draft settlement terms", "Review with both parties", "Ensure mutual understanding", "Notarize signatures if needed"] },
];

const ADR_METHODS = [
  { method: "Mediation", binding: "Non-binding", desc: "Neutral facilitator helps parties reach agreement", cost: "$150-400/hr", bestFor: "Preserving relationships, flexible solutions" },
  { method: "Arbitration", binding: "Binding", desc: "Arbitrator hears evidence and makes decision", cost: "$200-500/hr", bestFor: "Final resolution, contract disputes" },
  { method: "Med-Arb", binding: "Hybrid", desc: "Starts as mediation, converts to arbitration if needed", cost: "$200-400/hr", bestFor: "When parties want to try settlement first" },
  { method: "Collaborative Law", binding: "Non-binding", desc: "Attorneys commit to settlement without court", cost: "Attorney rates", bestFor: "Divorce, family matters" },
  { method: "Conciliation", binding: "Non-binding", desc: "Third party suggests solutions and assists negotiation", cost: "$100-300/hr", bestFor: "Labor disputes, community conflicts" },
];

const OHIO_ADR_RULES = [
  { rule: "Mediation communications are privileged", ref: "ORC §2710.03" },
  { rule: "Written mediation agreement required for privilege to apply", ref: "ORC §2710.02" },
  { rule: "Mediator cannot be compelled to testify", ref: "ORC §2710.06" },
  { rule: "Court-ordered mediation governed by local rules", ref: "Ohio Sup.R. 16" },
  { rule: "Mediator qualifications vary by court/county", ref: "Ohio Sup.R. 16.23" },
  { rule: "Mediated settlement agreements are enforceable as contracts", ref: "ORC §2710.08" },
];

export function MediationAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mediation Session Phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MEDIATION_PHASES.map((p, i) => (
              <div key={p.phase} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</div>
                  <h4 className="font-semibold text-sm">{p.phase}</h4>
                  <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{p.duration}</Badge>
                </div>
                <div className="grid gap-1 ml-10">
                  {p.tasks.map((t) => (
                    <p key={t} className="text-xs text-muted-foreground">• {t}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            ADR Method Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ADR_METHODS.map((m) => (
              <div key={m.method} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{m.method}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.binding === "Binding" ? "default" : "secondary"} className="text-xs">{m.binding}</Badge>
                    <Badge variant="outline" className="text-xs"><DollarSign className="h-3 w-3" />{m.cost}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
                <p className="text-xs text-primary mt-1">Best for: {m.bestFor}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ohio ADR Statutory References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OHIO_ADR_RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <span className="text-sm flex-1">{r.rule}</span>
                <Badge variant="outline" className="text-xs shrink-0">{r.ref}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
