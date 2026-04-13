import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Shield, CheckCircle, FileText } from "lucide-react";

const ID_VERIFICATION_METHODS = [
  { method: "Government-Issued Photo ID", accepted: ["Driver's License", "US Passport", "State ID Card", "Military ID"], level: "Primary" },
  { method: "Credible Witness", accepted: ["Personal knowledge by notary", "Two credible witnesses who know signer", "Witness must present valid ID"], level: "Alternative" },
  { method: "Knowledge-Based Authentication", accepted: ["Minimum 5 questions", "Must pass within 2 attempts", "Ohio ORC §147.66 compliant"], level: "RON Only" },
];

const CERTIFICATE_TYPES = [
  { type: "Copy Certification by Document Custodian", desc: "Certifies a copy is a true and accurate reproduction of the original", orc: "ORC §147.542" },
  { type: "Signature Witnessing", desc: "Notary witnesses the signing of a document without administering an oath", orc: "ORC §147.53" },
  { type: "Acknowledgment Certificate", desc: "Signer acknowledges signing voluntarily and for purposes stated", orc: "ORC §147.55" },
  { type: "Jurat Certificate", desc: "Signer swears/affirms content is truthful and signs in notary's presence", orc: "ORC §147.53" },
  { type: "Verification on Oath/Affirmation", desc: "Individual makes a sworn statement about truthfulness of content", orc: "ORC §147.542" },
];

const COMPLIANCE_CHECKLIST = [
  "Verify signer's identity using acceptable methods",
  "Confirm signer is willing and aware of document contents",
  "Assess signer's competency and willingness",
  "Check document for blanks or missing information",
  "Complete notarial certificate with all required elements",
  "Affix official notary stamp/seal",
  "Record entry in notary journal per ORC §147.141",
  "Include commission expiration date on certificate",
];

export function IdentityCertificateTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Verification Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ID_VERIFICATION_METHODS.map((m) => (
              <div key={m.method} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-sm">{m.method}</h4>
                  <Badge variant={m.level === "Primary" ? "default" : "secondary"} className="text-xs">{m.level}</Badge>
                </div>
                <div className="space-y-1">
                  {m.accepted.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" /> {a}
                    </div>
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
            <Award className="h-5 w-5" />
            Certificate Types & ORC References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CERTIFICATE_TYPES.map((c) => (
              <div key={c.type} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{c.type}</span>
                  <Badge variant="outline" className="text-xs">{c.orc}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certification Compliance Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {COMPLIANCE_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
