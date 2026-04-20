import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Scale, Building2, CheckCircle } from "lucide-react";

const ESTATE_DOCUMENT_TYPES = [
  { doc: "Last Will & Testament", notaryReq: "Witnesses + Notary", orc: "ORC §2107.03", notes: "Ohio requires 2 witnesses; notarization creates self-proving affidavit" },
  { doc: "Self-Proving Affidavit", notaryReq: "Required", orc: "ORC §2107.081", notes: "Attached to will; allows probate without witness testimony" },
  { doc: "Living Will (Declaration)", notaryReq: "Witnesses OR Notary", orc: "ORC §2133.02", notes: "2 witnesses required; notarization is alternative" },
  { doc: "Healthcare POA", notaryReq: "Witnesses + Notary", orc: "ORC §1337.12", notes: "Must use specific Ohio statutory form" },
  { doc: "Transfer on Death Deed", notaryReq: "Required", orc: "ORC §5302.22", notes: "Must be recorded with county recorder before death" },
  { doc: "Trust Agreement", notaryReq: "Recommended", orc: "ORC §5801", notes: "Not legally required but strongly recommended" },
  { doc: "Beneficiary Deed", notaryReq: "Required", orc: "ORC §5302.22", notes: "Must contain specific statutory language" },
];

const PROBATE_COURTS_OHIO = [
  { county: "Franklin", judge: "Probate Court", phone: "(614) 525-3894", filingFee: "$45" },
  { county: "Cuyahoga", judge: "Probate Court", phone: "(216) 443-8764", filingFee: "$50" },
  { county: "Hamilton", judge: "Probate Court", phone: "(513) 946-9000", filingFee: "$45" },
  { county: "Summit", judge: "Probate Court", phone: "(330) 643-2350", filingFee: "$40" },
  { county: "Montgomery", judge: "Probate Court", phone: "(937) 496-7761", filingFee: "$45" },
];

const SELF_PROVING_AFFIDAVIT_ELEMENTS = [
  "Testator's declaration that the instrument is their will",
  "Testator signed willingly (or directed another to sign)",
  "Testator was 18+ and of sound mind at time of signing",
  "Two witnesses observed the signing",
  "Witnesses signed in testator's presence and each other's presence",
  "Notary administered oath to testator and witnesses",
  "Notary affixed seal and signed the affidavit",
];

export function EstatePlanningAdvancedTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estate Document Notarization Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ESTATE_DOCUMENT_TYPES.map((d) => (
              <div key={d.doc} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{d.doc}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">{d.notaryReq}</Badge>
                    <Badge variant="outline" className="text-xs">{d.orc}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{d.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Self-Proving Affidavit Requirements (ORC §2107.081)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SELF_PROVING_AFFIDAVIT_ELEMENTS.map((el, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span className="text-sm">{el}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Ohio Probate Court Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {PROBATE_COURTS_OHIO.map((c) => (
              <div key={c.county} className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold text-sm">{c.county} County</p>
                <p className="text-xs text-muted-foreground">{c.judge}</p>
                <p className="text-xs text-primary">{c.phone}</p>
                <Badge variant="outline" className="text-xs mt-1">Filing: {c.filingFee}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
