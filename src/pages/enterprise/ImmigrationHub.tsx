import React, { useState } from "react";
import { Globe, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const ImmigrationHub = () => {
  const [showDocModal, setShowDocModal] = useState(false);
  const [affidavitData, setAffidavitData] = useState({ translator_name: "", language: "", document_description: "" });

  const { data: bulletin } = useQuery({
    queryKey: ["visa-bulletin"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-visa-bulletin");
      if (error) throw error;
      return data;
    },
  });

  const getDateBadge = (val: string) => {
    if (val === "Current") return <Badge className="bg-success/10 text-success border-success/30">Current</Badge>;
    return <Badge variant="outline">{val}</Badge>;
  };

  return (
    <EnterpriseLayout title="Immigration & Visa Hub" icon={Globe} description="Visa bulletin reference and translation affidavit generator">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {bulletin && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-sm font-black">Family-Sponsored Preferences — {bulletin.month}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Worldwide</TableHead><TableHead>China</TableHead><TableHead>India</TableHead><TableHead>Mexico</TableHead><TableHead>Philippines</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {bulletin.family?.map((f: any) => (
                        <TableRow key={f.category}><TableCell className="font-bold">{f.category}</TableCell><TableCell className="text-xs">{f.description}</TableCell><TableCell>{getDateBadge(f.worldwide)}</TableCell><TableCell>{getDateBadge(f.china)}</TableCell><TableCell>{getDateBadge(f.india)}</TableCell><TableCell>{getDateBadge(f.mexico)}</TableCell><TableCell>{getDateBadge(f.philippines)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-black">Employment-Based Preferences</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Worldwide</TableHead><TableHead>China</TableHead><TableHead>India</TableHead><TableHead>Mexico</TableHead><TableHead>Philippines</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {bulletin.employment?.map((e: any) => (
                        <TableRow key={e.category}><TableCell className="font-bold">{e.category}</TableCell><TableCell className="text-xs">{e.description}</TableCell><TableCell>{getDateBadge(e.worldwide)}</TableCell><TableCell>{getDateBadge(e.china)}</TableCell><TableCell>{getDateBadge(e.india)}</TableCell><TableCell>{getDateBadge(e.mexico)}</TableCell><TableCell>{getDateBadge(e.philippines)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-black">Translation Affidavit Generator</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">Translator Name</Label><Input value={affidavitData.translator_name} onChange={(e) => setAffidavitData(d => ({ ...d, translator_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Language</Label><Input value={affidavitData.language} onChange={(e) => setAffidavitData(d => ({ ...d, language: e.target.value }))} placeholder="e.g., Spanish" /></div>
              <div><Label className="text-xs">Document Description</Label><Input value={affidavitData.document_description} onChange={(e) => setAffidavitData(d => ({ ...d, document_description: e.target.value }))} placeholder="e.g., Birth Certificate" /></div>
              <Button variant="dark" className="w-full" onClick={() => setShowDocModal(true)} disabled={!affidavitData.translator_name}>
                <FileText className="mr-2 h-4 w-4" />Generate Affidavit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentGeneratorModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} templateId="affidavit_translation"
        data={{ ...affidavitData, state: "Ohio", county: "", date: new Date().toLocaleDateString(), notary_name: "", commission_number: "", commission_expiration: "" }} />
    </EnterpriseLayout>
  );
};

export default ImmigrationHub;
