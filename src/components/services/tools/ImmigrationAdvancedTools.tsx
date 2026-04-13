import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Clock, FileText, AlertCircle } from "lucide-react";

const COUNTRY_DOC_MATRIX: Record<string, { docs: string[]; notes: string }> = {
  Mexico: { docs: ["Birth Certificate (Acta de Nacimiento)", "Marriage Certificate", "Criminal Background Check", "Passport Photos", "Proof of Address"], notes: "Apostille accepted. Consular legalization may be needed for older documents." },
  India: { docs: ["Birth Certificate", "Marriage Certificate", "Education Transcripts", "Police Clearance", "Affidavit of Support"], notes: "Apostille accepted since 2023. Previously required embassy attestation." },
  China: { docs: ["Notarized Birth Certificate", "Marriage Certificate", "Education Credentials", "Employment Verification", "Medical Exam"], notes: "Apostille NOT accepted. Requires Chinese embassy authentication chain." },
  Philippines: { docs: ["PSA Birth Certificate", "CENOMAR", "NBI Clearance", "Marriage Certificate", "Passport"], notes: "Apostille accepted. Red ribbon no longer required for Hague countries." },
  Nigeria: { docs: ["Birth Certificate", "Police Clearance", "Education Certificates", "Marriage Certificate", "Passport Photos"], notes: "Not a Hague Convention member. Requires full embassy legalization." },
  Brazil: { docs: ["Birth Certificate", "Marriage/Divorce Certificate", "Criminal Record", "Education Diplomas", "Proof of Income"], notes: "Apostille accepted. Documents must be translated to English by certified translator." },
};

const USCIS_TIMES = [
  { form: "I-130", desc: "Petition for Alien Relative", time: "12-24 months" },
  { form: "I-485", desc: "Adjustment of Status", time: "8-14 months" },
  { form: "I-765", desc: "Employment Authorization", time: "3-7 months" },
  { form: "N-400", desc: "Naturalization", time: "8-14 months" },
  { form: "I-751", desc: "Remove Conditions on Residence", time: "12-24 months" },
  { form: "I-129F", desc: "Fiancé(e) Petition", time: "15-21 months" },
  { form: "I-90", desc: "Green Card Renewal", time: "6-12 months" },
];

export function ImmigrationAdvancedTools() {
  const [country, setCountry] = useState("Mexico");
  const matrix = COUNTRY_DOC_MATRIX[country];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Country Document Matrix</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(COUNTRY_DOC_MATRIX).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          {matrix && (
            <>
              <ul className="space-y-1">
                {matrix.docs.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><FileText className="h-3 w-3 text-muted-foreground" />{d}</li>
                ))}
              </ul>
              <div className="flex items-start gap-2 text-xs bg-amber-500/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{matrix.notes}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> USCIS Processing Times (Approx.)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Form</TableHead><TableHead>Description</TableHead><TableHead>Est. Time</TableHead></TableRow></TableHeader>
            <TableBody>
              {USCIS_TIMES.map(t => (
                <TableRow key={t.form}>
                  <TableCell className="font-mono text-xs">{t.form}</TableCell>
                  <TableCell className="text-xs">{t.desc}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.time}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
