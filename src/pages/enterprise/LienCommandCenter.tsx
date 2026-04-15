import React, { useState } from "react";
import { Hammer, Plus, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const WAIVER_TYPES = [
  { id: "conditional_partial", label: "Conditional Partial" },
  { id: "unconditional_partial", label: "Unconditional Partial" },
  { id: "conditional_final", label: "Conditional Final" },
  { id: "unconditional_final", label: "Unconditional Final" },
];

const LienCommandCenter = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showWaiverForm, setShowWaiverForm] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [waiverDocData, setWaiverDocData] = useState<any>(null);
  const [projectForm, setProjectForm] = useState({ project_name: "", property_address: "", owner_name: "", general_contractor: "", contract_amount: "" });
  const [waiverForm, setWaiverForm] = useState({ waiver_type: "conditional_partial", claimant_name: "", amount: "", through_date: "" });

  const { data: projects } = useQuery({
    queryKey: ["construction-projects", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("construction_projects").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: waivers } = useQuery({
    queryKey: ["lien-waivers", selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data } = await supabase.from("lien_waivers").select("*").eq("project_id", selectedProject.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedProject,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("construction_projects").insert({ ...projectForm, contract_amount: parseFloat(projectForm.contract_amount) || 0, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["construction-projects"] }); setShowProjectForm(false); setProjectForm({ project_name: "", property_address: "", owner_name: "", general_contractor: "", contract_amount: "" }); toast.success("Project created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const createWaiver = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lien_waivers").insert({ ...waiverForm, amount: parseFloat(waiverForm.amount) || 0, project_id: selectedProject.id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lien-waivers"] }); setShowWaiverForm(false); setWaiverForm({ waiver_type: "conditional_partial", claimant_name: "", amount: "", through_date: "" }); toast.success("Waiver created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const totalWaivers = (waivers || []).reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  return (
    <EnterpriseLayout title="Construction Lien Command Center" icon={Hammer} description="Track construction projects and manage AIA-standard lien waivers">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Projects</h3>
            <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-black">New Project</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Project Name</Label><Input value={projectForm.project_name} onChange={(e) => setProjectForm(p => ({ ...p, project_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Property Address</Label><Input value={projectForm.property_address} onChange={(e) => setProjectForm(p => ({ ...p, property_address: e.target.value }))} /></div>
                  <div><Label className="text-xs">Owner</Label><Input value={projectForm.owner_name} onChange={(e) => setProjectForm(p => ({ ...p, owner_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">General Contractor</Label><Input value={projectForm.general_contractor} onChange={(e) => setProjectForm(p => ({ ...p, general_contractor: e.target.value }))} /></div>
                  <div><Label className="text-xs">Contract Amount</Label><Input type="number" value={projectForm.contract_amount} onChange={(e) => setProjectForm(p => ({ ...p, contract_amount: e.target.value }))} /></div>
                  <Button onClick={() => createProject.mutate()} disabled={!projectForm.project_name} variant="dark" className="w-full">Create Project</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {projects?.map((p: any) => (
            <Card key={p.id} className={`cursor-pointer transition-all ${selectedProject?.id === p.id ? "border-primary ring-1 ring-primary" : ""}`} onClick={() => setSelectedProject(p)}>
              <CardContent className="p-4">
                <h4 className="font-bold text-sm">{p.project_name}</h4>
                <p className="text-xs text-muted-foreground">{p.property_address}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{p.status}</Badge>
                  {p.contract_amount && <span className="text-xs font-semibold">${Number(p.contract_amount).toLocaleString()}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProject ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Contract</p><p className="text-xl font-black">${Number(selectedProject.contract_amount || 0).toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Waivers Issued</p><p className="text-xl font-black">${totalWaivers.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Remaining</p><p className="text-xl font-black">${(Number(selectedProject.contract_amount || 0) - totalWaivers).toLocaleString()}</p></CardContent></Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black">Waivers</CardTitle>
                  <Dialog open={showWaiverForm} onOpenChange={setShowWaiverForm}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />Add Waiver</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="font-black">New Waiver</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label className="text-xs">Type</Label><Select value={waiverForm.waiver_type} onValueChange={(v) => setWaiverForm(f => ({ ...f, waiver_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WAIVER_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="text-xs">Claimant</Label><Input value={waiverForm.claimant_name} onChange={(e) => setWaiverForm(f => ({ ...f, claimant_name: e.target.value }))} /></div>
                        <div><Label className="text-xs">Amount</Label><Input type="number" value={waiverForm.amount} onChange={(e) => setWaiverForm(f => ({ ...f, amount: e.target.value }))} /></div>
                        <div><Label className="text-xs">Through Date</Label><Input type="date" value={waiverForm.through_date} onChange={(e) => setWaiverForm(f => ({ ...f, through_date: e.target.value }))} /></div>
                        <Button onClick={() => createWaiver.mutate()} disabled={!waiverForm.claimant_name} variant="dark" className="w-full">Create Waiver</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Claimant</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(waivers || []).map((w: any) => (
                        <TableRow key={w.id}>
                          <TableCell><Badge variant="outline">{w.waiver_type?.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell className="font-medium">{w.claimant_name}</TableCell>
                          <TableCell>${Number(w.amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="secondary">{w.status}</Badge></TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => {
                            const templateId = w.waiver_type?.includes("unconditional") ? "lien_waiver_unconditional" : "lien_waiver_conditional";
                            setWaiverDocData({ templateId, data: { project_name: selectedProject.project_name, property_address: selectedProject.property_address || "", owner_name: selectedProject.owner_name || "", claimant_name: w.claimant_name, amount: String(w.amount || 0), through_date: w.through_date || "", date: new Date().toLocaleDateString() } });
                            setShowDocModal(true);
                          }}><FileText className="h-3.5 w-3.5" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="flex h-64 items-center justify-center text-muted-foreground"><p>Select a project to view details</p></CardContent></Card>
          )}
        </div>
      </div>

      {waiverDocData && <DocumentGeneratorModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} templateId={waiverDocData.templateId} data={waiverDocData.data} />}
    </EnterpriseLayout>
  );
};

export default LienCommandCenter;
