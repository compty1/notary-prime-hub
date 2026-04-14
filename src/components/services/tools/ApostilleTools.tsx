import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, FileText, AlertTriangle, CheckCircle, Search, Clock, DollarSign } from "lucide-react";

const COUNTRY_REQUIREMENTS: Record<string, { hague: boolean; legalization: boolean; docs: string[]; notes: string; estDays: number; feeRange: string }> = {
  "Germany": { hague: true, legalization: false, docs: ["Apostille from SOS", "Certified translation (German)"], notes: "Hague Convention member. Apostille sufficient for all document types.", estDays: 5, feeRange: "$50-$100" },
  "China": { hague: false, legalization: true, docs: ["State authentication", "US DOS authentication", "Chinese Embassy legalization", "Certified translation (Mandarin)"], notes: "Not Hague member. Full chain authentication required. Processing can take 4-8 weeks.", estDays: 40, feeRange: "$200-$500" },
  "India": { hague: true, legalization: false, docs: ["Apostille from SOS", "Notarized translation if needed (Hindi)"], notes: "Hague member since 2023. Some agencies may still request embassy attestation out of habit.", estDays: 7, feeRange: "$50-$150" },
  "Mexico": { hague: true, legalization: false, docs: ["Apostille from SOS", "Spanish certified translation"], notes: "Hague member. Some registrars may request apostille on translation too.", estDays: 5, feeRange: "$50-$100" },
  "Japan": { hague: true, legalization: false, docs: ["Apostille from SOS", "Japanese certified translation"], notes: "Hague member. Koseki (family register) offices accept apostilled documents.", estDays: 7, feeRange: "$75-$150" },
  "Brazil": { hague: true, legalization: false, docs: ["Apostille from SOS", "Sworn translation by Brazilian translator"], notes: "Hague member. Translation must be by a sworn translator (tradutor juramentado).", estDays: 7, feeRange: "$75-$200" },
  "UAE": { hague: false, legalization: true, docs: ["State authentication", "US DOS authentication", "UAE Embassy attestation", "MOFA attestation in UAE"], notes: "Not Hague member. Full chain required. UAE MOFA attestation is the final step done in-country.", estDays: 30, feeRange: "$250-$600" },
  "South Korea": { hague: true, legalization: false, docs: ["Apostille from SOS", "Korean certified translation"], notes: "Hague member. Immigration offices accept apostilled documents directly.", estDays: 5, feeRange: "$50-$100" },
  "France": { hague: true, legalization: false, docs: ["Apostille from SOS", "French sworn translation"], notes: "Hague founding member. Sworn translations by traducteur assermenté required.", estDays: 5, feeRange: "$50-$100" },
  "United Kingdom": { hague: true, legalization: false, docs: ["Apostille from SOS"], notes: "Hague member. Most documents accepted without translation. Solicitor may need to verify.", estDays: 5, feeRange: "$50-$75" },
  "Canada": { hague: false, legalization: true, docs: ["State authentication", "Canadian Embassy/Consulate authentication"], notes: "Not a Hague member. Documents need embassy/consulate authentication. Province-specific rules apply.", estDays: 15, feeRange: "$100-$250" },
  "Italy": { hague: true, legalization: false, docs: ["Apostille from SOS", "Italian sworn translation"], notes: "Hague founding member. Comune (city hall) accepts apostilled docs. Translation must be asseverata.", estDays: 5, feeRange: "$50-$125" },
  "Philippines": { hague: true, legalization: false, docs: ["Apostille from SOS", "DFA verification in Philippines"], notes: "Hague member since 2019. DFA red ribbon no longer required for apostilled docs.", estDays: 7, feeRange: "$50-$100" },
  "Saudi Arabia": { hague: false, legalization: true, docs: ["State authentication", "US DOS authentication", "Saudi Embassy attestation", "Arabic certified translation"], notes: "Not Hague member. MOFA attestation required after embassy. Commercial docs may need chamber of commerce.", estDays: 35, feeRange: "$300-$700" },
  "Nigeria": { hague: false, legalization: true, docs: ["State authentication", "US DOS authentication", "Nigerian Embassy legalization"], notes: "Not Hague member. Embassy legalization required. Processing times vary significantly.", estDays: 30, feeRange: "$200-$400" },
  "Australia": { hague: true, legalization: false, docs: ["Apostille from SOS"], notes: "Hague member. English documents accepted. No translation needed for most purposes.", estDays: 5, feeRange: "$50-$75" },
  "Russia": { hague: true, legalization: false, docs: ["Apostille from SOS", "Russian certified translation"], notes: "Hague member. Some agencies may require consular legalization despite Hague membership.", estDays: 10, feeRange: "$75-$200" },
  "Colombia": { hague: true, legalization: false, docs: ["Apostille from SOS", "Spanish certified translation"], notes: "Hague member. Notaría will accept apostilled documents directly.", estDays: 5, feeRange: "$50-$100" },
  "Egypt": { hague: false, legalization: true, docs: ["State authentication", "US DOS authentication", "Egyptian Embassy attestation", "Arabic translation"], notes: "Not Hague member. Full chain. MOFA attestation needed in Egypt.", estDays: 30, feeRange: "$250-$500" },
  "Vietnam": { hague: true, legalization: false, docs: ["Apostille from SOS", "Vietnamese certified translation"], notes: "Hague member since 2024. Embassy legalization still accepted as alternative.", estDays: 7, feeRange: "$50-$125" },
  "Turkey": { hague: true, legalization: false, docs: ["Apostille from SOS", "Turkish sworn translation"], notes: "Hague member. Noterler (notary offices) accept apostilled docs.", estDays: 5, feeRange: "$50-$100" },
  "Israel": { hague: true, legalization: false, docs: ["Apostille from SOS", "Hebrew translation if required"], notes: "Hague member. Most government offices accept English with apostille.", estDays: 5, feeRange: "$50-$75" },
};

const DOCUMENT_CHECKLIST = [
  { item: "Original document notarized by commissioned notary", critical: true },
  { item: "County clerk certification (if required by Ohio SOS)", critical: true },
  { item: "Secretary of State apostille/authentication applied", critical: true },
  { item: "Certified translation by qualified translator", critical: false },
  { item: "Embassy/Consulate legalization (non-Hague only)", critical: false },
  { item: "Copy of signer's government-issued photo ID retained", critical: false },
  { item: "Tracking number for shipment recorded", critical: false },
  { item: "Client notified of estimated processing timeline", critical: false },
];

const OHIO_SOS_INFO = {
  address: "Ohio Secretary of State, 22 N. 4th St., Columbus, OH 43215",
  phone: "(614) 466-2655",
  website: "ohiosos.gov",
  apostilleFee: "$10 per document",
  processingTime: "3-5 business days (standard), 1 day (expedited +$10)",
};

export function ApostilleTools() {
  const [country, setCountry] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const filteredCountries = Object.keys(COUNTRY_REQUIREMENTS).filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const req = country ? COUNTRY_REQUIREMENTS[country] : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Country Requirements Lookup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search countries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Select destination country" /></SelectTrigger>
            <SelectContent>
              {filteredCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {req && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={req.hague ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>
                  {req.hague ? "Hague Convention ✓" : "Non-Hague — Full Authentication"}
                </Badge>
                <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> ~{req.estDays} days</Badge>
                <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" /> {req.feeRange}</Badge>
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Required Documents (in order):</p>
                {req.docs.map((d, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                    {d}
                  </p>
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic">{req.notes}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{Object.keys(COUNTRY_REQUIREMENTS).length} countries available. Data current as of 2024.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Processing Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DOCUMENT_CHECKLIST.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors">
                <input type="checkbox" checked={!!checkedItems[i]} onChange={() => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }))} className="rounded" />
                <span className={checkedItems[i] ? "line-through text-muted-foreground" : ""}>{item.item}</span>
                {item.critical && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Required</Badge>}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {Object.values(checkedItems).filter(Boolean).length}/{DOCUMENT_CHECKLIST.length} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Ohio SOS Apostille Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Address:</strong> {OHIO_SOS_INFO.address}</p>
          <p><strong>Phone:</strong> {OHIO_SOS_INFO.phone}</p>
          <p><strong>Fee:</strong> {OHIO_SOS_INFO.apostilleFee}</p>
          <p><strong>Processing:</strong> {OHIO_SOS_INFO.processingTime}</p>
        </CardContent>
      </Card>
    </div>
  );
}
