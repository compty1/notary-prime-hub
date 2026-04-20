import React, { useState, useMemo } from "react";
import { Scale, Search, FileText, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apostilleStateData } from "@/lib/apostilleStateData";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const ApostilleMatrix = () => {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<any>(null);
  const [docCount, setDocCount] = useState(1);
  const [showDocModal, setShowDocModal] = useState(false);

  const filtered = useMemo(() => apostilleStateData.filter(s =>
    s.state.toLowerCase().includes(search.toLowerCase()) || s.abbreviation.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  const totalFee = selectedState ? selectedState.fee * docCount : 0;

  return (
    <EnterpriseLayout title="50-State Apostille Matrix" icon={Scale} description="Reference guide for apostille fees, processing times, and SOS contact info">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search by state name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>State</TableHead><TableHead>Fee</TableHead><TableHead>Processing</TableHead><TableHead>Electronic</TableHead><TableHead>Walk-In</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.abbreviation} className={`cursor-pointer ${selectedState?.abbreviation === s.abbreviation ? "bg-primary/5" : ""}`} onClick={() => setSelectedState(s)}>
                        <TableCell className="font-bold">{s.state} <span className="text-muted-foreground">({s.abbreviation})</span></TableCell>
                        <TableCell>${s.fee}</TableCell>
                        <TableCell>{s.processingDays} days</TableCell>
                        <TableCell>{s.acceptsElectronic ? <Badge className="bg-success/10 text-success border-success/30">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                        <TableCell>{s.walkInAvailable ? <Badge className="bg-success/10 text-success border-success/30">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedState && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-black">{selectedState.state} Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>Office:</strong> {selectedState.sosName}</p>
                <p><strong>Address:</strong> {selectedState.sosAddress}</p>
                <p><strong>Phone:</strong> {selectedState.sosPhone}</p>
                <p><strong>Email:</strong> {selectedState.sosEmail}</p>
                <p className="text-xs text-muted-foreground">{selectedState.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm font-black flex items-center gap-2"><Calculator className="h-4 w-4" />Fee Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">State</Label><p className="font-bold">{selectedState?.state || "Select a state"}</p></div>
              <div><Label className="text-xs">Document Count</Label><Input type="number" min={1} value={docCount} onChange={(e) => setDocCount(Math.max(1, parseInt(e.target.value) || 1))} /></div>
              {selectedState && (
                <div className="rounded-[12px] bg-muted p-4 text-center">
                  <p className="text-xs text-muted-foreground">Estimated Total</p>
                  <p className="text-3xl font-black">${totalFee}</p>
                  <p className="text-xs text-muted-foreground">{docCount} doc(s) × ${selectedState.fee}/doc</p>
                </div>
              )}
              <Button variant="dark" className="w-full" disabled={!selectedState} onClick={() => setShowDocModal(true)}>
                <FileText className="mr-2 h-4 w-4" />Generate Cover Letter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedState && (
        <DocumentGeneratorModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} templateId="apostille_cover_letter"
          data={{ sos_name: selectedState.sosName, sos_address: selectedState.sosAddress, sender_name: "", sender_address: "", document_count: String(docCount), document_description: "", destination_country: "", fee_total: String(totalFee), date: new Date().toLocaleDateString() }} />
      )}
    </EnterpriseLayout>
  );
};

export default ApostilleMatrix;
