import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Search, Loader2, Users, Shield, Star, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const SPECIALIZATIONS = [
  "Mobile Notary", "Loan Signing Agent", "RON Notary", "Process Server",
  "Skip Tracer", "Courier", "Fingerprinting Tech", "Background Check Agent",
  "Translator", "Photographer", "Tax Preparer", "Estate Planner",
];

const ONBOARDING_STEPS = [
  { key: "application", label: "Application Submitted" },
  { key: "background_check", label: "Background Check" },
  { key: "credential_verification", label: "Credentials Verified" },
  { key: "insurance_verification", label: "E&O Insurance Verified" },
  { key: "training_complete", label: "Platform Training" },
  { key: "approved", label: "Approved & Active" },
];

export default function AdminContractorOnboarding() {
  usePageMeta({ title: "Contractor Onboarding — Admin", noIndex: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["contractor-assignments-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_assignments")
        .select("contractor_id, status")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const updateAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("contractors").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast({ title: "Contractor updated" });
    },
  });

  const filtered = contractors.filter((c: any) => {
    if (search && !c.display_name?.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "available" && !c.is_available) return false;
    if (statusFilter === "unavailable" && c.is_available) return false;
    return true;
  });

  const stats = {
    total: contractors.length,
    available: contractors.filter((c: any) => c.is_available).length,
    avgRating: contractors.length ? (contractors.reduce((s: number, c: any) => s + (c.rating || 0), 0) / contractors.length).toFixed(1) : "—",
    totalJobs: contractors.reduce((s: number, c: any) => s + (c.total_jobs || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Contractor Onboarding
          </h1>
          <p className="text-sm text-muted-foreground">Manage contractor pipeline, credentials & assignments</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Contractors</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Available</p><p className="text-2xl font-bold text-success">{stats.available}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Rating</p><p className="text-2xl font-bold text-warning">{stats.avgRating}★</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Jobs</p><p className="text-2xl font-bold">{stats.totalJobs}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster" className="gap-1"><Users className="h-3.5 w-3.5" /> Roster</TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1"><Shield className="h-3.5 w-3.5" /> Onboarding Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contractors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No contractors found.</CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.display_name}</TableCell>
                      <TableCell className="text-sm">{c.email || "—"}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(c.specializations || []).slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{c.rating ? <span className="text-warning">{c.rating}★</span> : "—"}</TableCell>
                      <TableCell>{c.total_jobs || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant={c.is_available ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => updateAvailability.mutate({ id: c.id, is_available: !c.is_available })}
                        >
                          {c.is_available ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Onboarding Steps</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ONBOARDING_STEPS.map((step, idx) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{idx + 1}</div>
                    <div>
                      <p className="font-medium text-sm">{step.label}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
