import React, { useState } from "react";
import { ScrollText, Plus, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const CATEGORIES = ["real_property", "financial", "personal_property", "business_interest", "insurance", "other"];
const TRUST_TYPES = ["revocable", "irrevocable", "living", "testamentary"];

const TrustScheduler = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTrust, setSelectedTrust] = useState<any>(null);
  const [showTrustForm, setShowTrustForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [trustForm, setTrustForm] = useState({ trust_name: "", trust_type: "revocable", grantor_name: "", trustee_name: "", date_established: "" });
  const [assetForm, setAssetForm] = useState({ category: "real_property", description: "", estimated_value: "", institution: "", account_number: "" });

  const { data: trusts } = useQuery({
    queryKey: ["trust-documents", user?.id],
    queryFn: async () => { const { data } = await supabase.from("trust_documents").select("*").order("created_at", { ascending: false }); return data || []; },
    enabled: !!user,
  });

  const { data: assets } = useQuery({
    queryKey: ["trust-assets", selectedTrust?.id],
    queryFn: async () => { if (!selectedTrust) return []; const { data } = await supabase.from("trust_assets").select("*").eq("trust_id", selectedTrust.id).order("category"); return data || []; },
    enabled: !!selectedTrust,
  });

  const createTrust = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("trust_documents").insert({ ...trustForm, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trust-documents"] }); setShowTrustForm(false); toast.success("Trust created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const createAsset = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("trust_assets").insert({ ...assetForm, estimated_value: parseFloat(assetForm.estimated_value) || 0, trust_id: selectedTrust.id, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trust-assets"] }); setShowAssetForm(false); setAssetForm({ category: "real_property", description: "", estimated_value: "", institution: "", account_number: "" }); toast.success("Asset added"); },
    onError: (err: any) => toast.error(err.message),
  });

  const groupedAssets = (assets || []).reduce((acc: Record<string, any[]>, a: any) => { (acc[a.category] = acc[a.category] || []).push(a); return acc; }, {});
  const totalValue = (assets || []).reduce((sum: number, a: any) => sum + (Number(a.estimated_value) || 0), 0);

  const generateScheduleAHtml = () => {
    let html = "";
    for (const [cat, items] of Object.entries(groupedAssets)) {
      const catTotal = (items as any[]).reduce((s: number, a: any) => s + (Number(a.estimated_value) || 0), 0);
      html += `<h4 style="margin-top:16px;text-transform:capitalize;font-weight:bold;">${cat.replace(/_/g, " ")} — $${catTotal.toLocaleString()}</h4><ul>`;
      (items as any[]).forEach((a: any) => { html += `<li>${a.description} — $${Number(a.estimated_value || 0).toLocaleString()}${a.institution ? ` (${a.institution})` : ""}</li>`; });
      html += "</ul>";
    }
    return html;
  };

  return (
    <EnterpriseLayout title="Trust Asset Scheduler" icon={ScrollText} description="Manage estate trusts and generate Schedule A asset documents">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Trusts</h3>
            <Dialog open={showTrustForm} onOpenChange={setShowTrustForm}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />New Trust</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-black">Create Trust</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Trust Name</Label><Input value={trustForm.trust_name} onChange={(e) => setTrustForm(f => ({ ...f, trust_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Type</Label><Select value={trustForm.trust_type} onValueChange={(v) => setTrustForm(f => ({ ...f, trust_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRUST_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">Grantor</Label><Input value={trustForm.grantor_name} onChange={(e) => setTrustForm(f => ({ ...f, grantor_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Trustee</Label><Input value={trustForm.trustee_name} onChange={(e) => setTrustForm(f => ({ ...f, trustee_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Date Established</Label><Input type="date" value={trustForm.date_established} onChange={(e) => setTrustForm(f => ({ ...f, date_established: e.target.value }))} /></div>
                  <Button onClick={() => createTrust.mutate()} disabled={!trustForm.trust_name} variant="dark" className="w-full">Create Trust</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {trusts?.map((t: any) => (
            <Card key={t.id} className={`cursor-pointer ${selectedTrust?.id === t.id ? "border-primary ring-1 ring-primary" : ""}`} onClick={() => setSelectedTrust(t)}>
              <CardContent className="p-4">
                <h4 className="font-bold text-sm">{t.trust_name}</h4>
                <div className="flex items-center gap-2 mt-1"><Badge variant="outline" className="capitalize">{t.trust_type}</Badge><Badge variant="secondary">{t.status}</Badge></div>
                <p className="text-xs text-muted-foreground mt-1">{t.grantor_name} → {t.trustee_name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedTrust ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">{selectedTrust.trust_name}</h2>
                  <p className="text-sm text-muted-foreground">Total Estate Value: <span className="font-bold text-foreground">${totalValue.toLocaleString()}</span></p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showAssetForm} onOpenChange={setShowAssetForm}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />Add Asset</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="font-black">Add Asset</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label className="text-xs">Category</Label><Select value={assetForm.category} onValueChange={(v) => setAssetForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="text-xs">Description</Label><Input value={assetForm.description} onChange={(e) => setAssetForm(f => ({ ...f, description: e.target.value }))} /></div>
                        <div><Label className="text-xs">Estimated Value</Label><Input type="number" value={assetForm.estimated_value} onChange={(e) => setAssetForm(f => ({ ...f, estimated_value: e.target.value }))} /></div>
                        <div><Label className="text-xs">Institution</Label><Input value={assetForm.institution} onChange={(e) => setAssetForm(f => ({ ...f, institution: e.target.value }))} /></div>
                        <Button onClick={() => createAsset.mutate()} disabled={!assetForm.description} variant="dark" className="w-full">Add Asset</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="dark" size="sm" onClick={() => setShowDocModal(true)}><FileText className="mr-1 h-3 w-3" />Generate Schedule A</Button>
                </div>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {CATEGORIES.map(cat => {
                  const items = groupedAssets[cat] || [];
                  if (items.length === 0) return null;
                  const catTotal = items.reduce((s: number, a: any) => s + (Number(a.estimated_value) || 0), 0);
                  return (
                    <AccordionItem key={cat} value={cat} className="rounded-[16px] border px-4">
                      <AccordionTrigger className="text-sm font-bold capitalize">{cat.replace(/_/g, " ")} ({items.length}) — ${catTotal.toLocaleString()}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {items.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between rounded-[8px] bg-muted p-3">
                              <div><p className="text-sm font-medium">{a.description}</p>{a.institution && <p className="text-xs text-muted-foreground">{a.institution}</p>}</div>
                              <span className="text-sm font-bold">${Number(a.estimated_value || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          ) : (
            <Card><CardContent className="flex h-64 items-center justify-center text-muted-foreground"><p>Select a trust to manage assets</p></CardContent></Card>
          )}
        </div>
      </div>

      {selectedTrust && <DocumentGeneratorModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} templateId="trust_schedule_a" data={{ trust_name: selectedTrust.trust_name, grantor_name: selectedTrust.grantor_name || "", trustee_name: selectedTrust.trustee_name || "", date_established: selectedTrust.date_established || "", assets_html: generateScheduleAHtml() }} />}
    </EnterpriseLayout>
  );
};

export default TrustScheduler;
