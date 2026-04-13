import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, FileText, CheckCircle2, Building2, Search, MapPin } from "lucide-react";

const SIGNING_PACKAGE_DOCS = [
  { name: "Deed of Trust / Mortgage", pages: 15, required: true },
  { name: "Promissory Note", pages: 4, required: true },
  { name: "Closing Disclosure", pages: 5, required: true },
  { name: "Right to Cancel (Rescission)", pages: 2, required: true },
  { name: "HUD-1 Settlement Statement", pages: 3, required: false },
  { name: "Compliance Agreement", pages: 2, required: true },
  { name: "Borrower's Certification", pages: 1, required: true },
  { name: "Signature/Name Affidavit", pages: 2, required: true },
  { name: "Occupancy Affidavit", pages: 1, required: true },
  { name: "Tax Authorization (4506-T)", pages: 1, required: true },
  { name: "W-9 Request", pages: 1, required: false },
  { name: "First Payment Letter", pages: 1, required: true },
  { name: "Error & Omissions Agreement", pages: 2, required: true },
  { name: "Hazard Insurance Disclosure", pages: 1, required: false },
  { name: "Flood Zone Disclosure", pages: 1, required: false },
];

const OHIO_TITLE_COMPANIES = [
  { name: "Ohio Real Title", area: "Columbus", phone: "(614) 555-0100", specialties: ["Residential", "Commercial"] },
  { name: "Buckeye Title Agency", area: "Cleveland", phone: "(216) 555-0200", specialties: ["Residential", "Refinance"] },
  { name: "Midwest Settlement", area: "Cincinnati", phone: "(513) 555-0300", specialties: ["Residential", "New Construction"] },
  { name: "Great Lakes Title", area: "Toledo", phone: "(419) 555-0400", specialties: ["Residential", "Commercial", "REO"] },
  { name: "Capital City Closings", area: "Columbus", phone: "(614) 555-0500", specialties: ["Residential", "HELOC"] },
  { name: "Heartland Title Services", area: "Dayton", phone: "(937) 555-0600", specialties: ["Residential", "FHA/VA"] },
];

const ERECORDING_COUNTIES = [
  { county: "Franklin", status: "Active", portal: "simplifile" },
  { county: "Cuyahoga", status: "Active", portal: "simplifile" },
  { county: "Hamilton", status: "Active", portal: "simplifile" },
  { county: "Summit", status: "Active", portal: "CSC" },
  { county: "Montgomery", status: "Active", portal: "simplifile" },
  { county: "Lucas", status: "Active", portal: "eRecording Partners" },
  { county: "Stark", status: "Active", portal: "simplifile" },
  { county: "Butler", status: "Active", portal: "simplifile" },
  { county: "Lorain", status: "Pending", portal: "—" },
  { county: "Mahoning", status: "Active", portal: "simplifile" },
];

export function RealEstateAdvancedTools() {
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [countySearch, setCountySearch] = useState("");

  const toggleDoc = (name: string) => {
    setCheckedDocs(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const totalPages = SIGNING_PACKAGE_DOCS.filter(d => checkedDocs.has(d.name)).reduce((s, d) => s + d.pages, 0);
  const filteredCounties = ERECORDING_COUNTIES.filter(c => !countySearch || c.county.toLowerCase().includes(countySearch.toLowerCase()));

  return (
    <Tabs defaultValue="package">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="package"><FileText className="h-3 w-3 mr-1" /> Signing Package</TabsTrigger>
        <TabsTrigger value="directory"><Building2 className="h-3 w-3 mr-1" /> Title Directory</TabsTrigger>
        <TabsTrigger value="erecording"><MapPin className="h-3 w-3 mr-1" /> E-Recording</TabsTrigger>
      </TabsList>

      <TabsContent value="package">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Signing Package Document Tracker</span>
              <Badge variant="outline">{checkedDocs.size}/{SIGNING_PACKAGE_DOCS.length} docs • {totalPages} pages</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SIGNING_PACKAGE_DOCS.map(doc => (
                <div key={doc.name} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={checkedDocs.has(doc.name)} onCheckedChange={() => toggleDoc(doc.name)} />
                  <span className={checkedDocs.has(doc.name) ? "line-through text-muted-foreground" : ""}>{doc.name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">{doc.pages}p</Badge>
                  {doc.required && <Badge variant="destructive" className="text-[9px] h-4">REQ</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="directory">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ohio Title Company Directory</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Area</TableHead><TableHead>Specialties</TableHead></TableRow></TableHeader>
              <TableBody>
                {OHIO_TITLE_COMPANIES.map(tc => (
                  <TableRow key={tc.name}>
                    <TableCell className="font-medium text-xs">{tc.name}</TableCell>
                    <TableCell className="text-xs">{tc.area}</TableCell>
                    <TableCell>{tc.specialties.map(s => <Badge key={s} variant="outline" className="text-[10px] mr-1">{s}</Badge>)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-[10px] text-muted-foreground mt-2">* Sample directory. Add your own contacts in the CRM module.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="erecording">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ohio E-Recording Status by County</CardTitle></CardHeader>
          <CardContent>
            <Input placeholder="Search county..." value={countySearch} onChange={e => setCountySearch(e.target.value)} className="mb-3 max-w-xs" />
            <Table>
              <TableHeader><TableRow><TableHead>County</TableHead><TableHead>Status</TableHead><TableHead>Portal</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredCounties.map(c => (
                  <TableRow key={c.county}>
                    <TableCell className="font-medium text-xs">{c.county}</TableCell>
                    <TableCell><Badge className={c.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"} variant="outline">{c.status}</Badge></TableCell>
                    <TableCell className="text-xs">{c.portal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
