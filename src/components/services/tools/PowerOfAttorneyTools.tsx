import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertTriangle, FileText, CheckCircle } from "lucide-react";

const POA_TYPES = [
  { type: "General Power of Attorney", scope: "Broad authority over financial/legal matters", durability: "Non-durable", orc: "ORC §1337.01", notes: "Terminates upon incapacity of principal" },
  { type: "Durable Power of Attorney", scope: "Survives incapacity of principal", durability: "Durable", orc: "ORC §1337.09", notes: "Must contain 'durable' language per statute" },
  { type: "Limited/Special POA", scope: "Specific transaction or time-limited authority", durability: "Varies", orc: "ORC §1337.01", notes: "Common for real estate closings" },
  { type: "Healthcare POA", scope: "Medical decisions when principal is incapacitated", durability: "Durable", orc: "ORC §1337.11-.17", notes: "Different from living will; requires specific form" },
  { type: "Springing POA", scope: "Activates only upon specified triggering event", durability: "Durable", orc: "ORC §1337.09", notes: "Usually triggers on physician-certified incapacity" },
];

const OHIO_POA_REQUIREMENTS = [
  "Principal must be 18+ and of sound mind",
  "Must be signed by principal (or at principal's direction if physically unable)",
  "Requires notarization of principal's signature",
  "Durable POA must include language: 'This power of attorney shall not be affected by disability of the principal'",
  "Healthcare POA requires two witnesses (not the agent or healthcare provider)",
  "POA must identify the agent by name and relationship",
  "Recording required if POA grants real estate authority (county recorder)",
  "Agent has fiduciary duty to act in principal's best interest",
];

const NOTARY_CONSIDERATIONS = [
  { concern: "Competency Assessment", action: "Observe principal's understanding; do NOT determine legal capacity (that requires a physician)", risk: "High" },
  { concern: "Undue Influence", action: "Speak with principal alone if possible; watch for coercion signs", risk: "High" },
  { concern: "Document Completeness", action: "Ensure all blanks filled before notarization; no blank pages", risk: "Medium" },
  { concern: "UPL Risk", action: "Cannot advise which type of POA to use or explain legal effects", risk: "High" },
  { concern: "Remote Notarization", action: "Ohio allows RON for POA; ensure KBA and recording per ORC §147.66", risk: "Medium" },
];

export function PowerOfAttorneyTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Ohio Power of Attorney Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {POA_TYPES.map((p) => (
              <div key={p.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{p.type}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.durability === "Durable" ? "default" : "secondary"} className="text-xs">{p.durability}</Badge>
                    <Badge variant="outline" className="text-xs">{p.orc}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{p.scope}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ohio POA Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OHIO_POA_REQUIREMENTS.map((req, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">{req}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Notary Risk Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {NOTARY_CONSIDERATIONS.map((c) => (
              <div key={c.concern} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{c.concern}</span>
                  <Badge variant={c.risk === "High" ? "destructive" : "secondary"} className="text-xs">{c.risk} Risk</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.action}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
