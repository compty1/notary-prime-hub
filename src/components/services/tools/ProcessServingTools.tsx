import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, FileText, Clock, AlertTriangle, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const OHIO_SERVICE_RULES: Record<string, { method: string; rule: string; notes: string }[]> = {
  "Personal Service": [
    { method: "Hand delivery to defendant", rule: "Civ.R. 4.1(1)", notes: "Preferred method. Serve on individual personally." },
    { method: "Leave at dwelling with suitable person", rule: "Civ.R. 4.1(1)", notes: "Person of suitable age & discretion residing therein." },
  ],
  "Certified Mail": [
    { method: "Via clerk of courts", rule: "Civ.R. 4.1(1)", notes: "Default method by Ohio courts. Return receipt required." },
  ],
  "Residential Service": [
    { method: "Leave at usual place of abode", rule: "Civ.R. 4.1(1)", notes: "Must be with person of suitable age/discretion." },
  ],
  "Service by Publication": [
    { method: "Newspaper publication", rule: "Civ.R. 4.4(A)", notes: "Only when defendant cannot be found. Requires court order." },
  ],
};

const AFFIDAVIT_TEMPLATE = `AFFIDAVIT OF SERVICE

STATE OF OHIO
COUNTY OF _______________

I, _______________, being duly sworn, state:

1. I am over the age of 18 and not a party to this action.
2. On _______________ (date), at approximately _______________ (time),
   I served the following documents: _______________
3. Service was made upon _______________ (name of person served)
   at _______________ (address).
4. Method of service: _______________
5. Description of person served: _______________

Further affiant sayeth naught.

_______________________________
Process Server Signature

Sworn to and subscribed before me this _____ day of _______________, 20___.

_______________________________
Notary Public, State of Ohio
My commission expires: _______________`;

export function ProcessServingTools() {
  const [serviceMethod, setServiceMethod] = useState("");

  const rules = serviceMethod ? OHIO_SERVICE_RULES[serviceMethod] : null;

  const copyAffidavit = () => {
    navigator.clipboard.writeText(AFFIDAVIT_TEMPLATE);
    toast({ title: "Copied", description: "Affidavit template copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Ohio Service Rules Reference</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={serviceMethod} onValueChange={setServiceMethod}>
            <SelectTrigger><SelectValue placeholder="Select service method" /></SelectTrigger>
            <SelectContent>
              {Object.keys(OHIO_SERVICE_RULES).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          {rules && (
            <div className="space-y-2">
              {rules.map((r, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{r.method}</p>
                    <Badge variant="outline">{r.rule}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.notes}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Affidavit of Service Template</CardTitle>
            <Button variant="outline" size="sm" onClick={copyAffidavit}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-4 rounded-lg font-mono leading-relaxed">{AFFIDAVIT_TEMPLATE}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Attempt Log Best Practices</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              "Record exact date, time, and GPS coordinates for each attempt",
              "Note weather conditions and lighting",
              "Describe the property (gate, dogs, cameras, etc.)",
              "Document vehicles present at address",
              "Record physical description of person who answered door",
              "Note if refused — document exact words used",
              "Minimum 3 attempts at different times/days before substituted service",
              "Include photos of address/posted notices when applicable",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
