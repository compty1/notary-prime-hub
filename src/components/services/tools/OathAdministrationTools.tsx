import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Shield, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const OATH_SCRIPTS = [
  {
    type: "Standard Oath",
    script: "Do you solemnly swear that the statements contained in this document are true and correct to the best of your knowledge and belief, so help you God?",
    useCase: "Affidavits, sworn statements, depositions",
  },
  {
    type: "Affirmation (Non-Religious)",
    script: "Do you solemnly affirm, under penalty of perjury, that the statements contained in this document are true and correct to the best of your knowledge and belief?",
    useCase: "When signer objects to religious oath per ORC §147.53",
  },
  {
    type: "Witness Oath",
    script: "Do you solemnly swear (or affirm) that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?",
    useCase: "Depositions, sworn witness testimony",
  },
  {
    type: "Oath of Office",
    script: "Do you solemnly swear (or affirm) that you will faithfully and impartially discharge the duties of the office of [TITLE], and will support the Constitution of the United States and the Constitution of the State of Ohio?",
    useCase: "Public officials, appointed officers",
  },
];

const OATH_COMPLIANCE_RULES = [
  { rule: "Signer must raise right hand (in-person) or verbally consent (RON)", orc: "ORC §147.53" },
  { rule: "Notary must administer oath/affirmation verbally — cannot be implied", orc: "ORC §147.53" },
  { rule: "Affirmation has same legal effect as religious oath", orc: "Ohio Constitution Art. I §7" },
  { rule: "Perjury applies to false statements under oath (F3 felony)", orc: "ORC §2921.11" },
  { rule: "Journal entry must note type of oath/affirmation administered", orc: "ORC §147.141" },
  { rule: "Notary may refuse if signer appears unwilling or coerced", orc: "ORC §147.141(B)" },
];

export function OathAdministrationTools() {
  const { toast } = useToast();

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Oath & Affirmation Scripts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {OATH_SCRIPTS.map((o) => (
              <div key={o.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{o.type}</h4>
                  <Button variant="ghost" size="sm" onClick={() => copyScript(o.script)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-sm italic bg-muted/50 p-3 rounded-lg mb-2">"{o.script}"</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Use for:</span> {o.useCase}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ohio Oath Compliance Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {OATH_COMPLIANCE_RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{r.rule}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{r.orc}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
