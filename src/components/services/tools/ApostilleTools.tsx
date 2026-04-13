import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const COUNTRY_REQUIREMENTS: Record<string, { hague: boolean; legalization: boolean; docs: string[]; notes: string }> = {
  "Germany": { hague: true, legalization: false, docs: ["Apostille from SOS", "Certified translation"], notes: "Hague Convention member. Apostille sufficient." },
  "China": { hague: false, legalization: true, docs: ["State authentication", "Chinese Embassy legalization", "Certified translation"], notes: "Not Hague member. Full chain authentication required." },
  "India": { hague: true, legalization: false, docs: ["Apostille from SOS", "Notarized translation if needed"], notes: "Hague member since 2023." },
  "Mexico": { hague: true, legalization: false, docs: ["Apostille from SOS", "Spanish translation"], notes: "Hague member. Some states may request additional verification." },
  "Japan": { hague: true, legalization: false, docs: ["Apostille from SOS", "Japanese translation"], notes: "Hague member. Translation may need notarization." },
  "Brazil": { hague: true, legalization: false, docs: ["Apostille from SOS", "Sworn translation by Brazilian translator"], notes: "Hague member. Translation must be by sworn translator." },
  "UAE": { hague: false, legalization: true, docs: ["State authentication", "US DOS authentication", "UAE Embassy attestation"], notes: "Not Hague member. Full chain required." },
};

const DOCUMENT_CHECKLIST = [
  { item: "Original document notarized", critical: true },
  { item: "County clerk certification (if required by state)", critical: true },
  { item: "Secretary of State apostille/authentication", critical: true },
  { item: "Certified translation (if destination requires)", critical: false },
  { item: "Embassy/Consulate legalization (non-Hague)", critical: false },
  { item: "Copy of signer's ID retained", critical: false },
  { item: "Tracking number for shipment", critical: false },
];

export function ApostilleTools() {
  const [country, setCountry] = useState("");

  const req = country ? COUNTRY_REQUIREMENTS[country] : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Country Requirements Lookup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Select destination country" /></SelectTrigger>
            <SelectContent>
              {Object.keys(COUNTRY_REQUIREMENTS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {req && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge className={req.hague ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                  {req.hague ? "Hague Convention ✓" : "Non-Hague — Full Authentication"}
                </Badge>
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Required Documents:</p>
                {req.docs.map((d, i) => <p key={i} className="text-sm flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{d}</p>)}
              </div>
              <p className="text-sm text-muted-foreground">{req.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Apostille Processing Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DOCUMENT_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.critical ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> : <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                <span>{item.item}</span>
                {item.critical && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
