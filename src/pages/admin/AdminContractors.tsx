import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Star, Briefcase, Mail, Phone, Loader2 } from "lucide-react";

interface Contractor {
  id: string; user_id: string; display_name: string; email: string | null;
  phone: string | null; bio: string | null; specializations: string[];
  hourly_rate: number | null; commission_rate: number | null;
  is_available: boolean; rating: number | null; total_jobs: number;
  created_at: string;
}

export default function AdminContractors() {
  usePageMeta({ title: "Contractor Management", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchContractors = useCallback(async () => {
    const { data } = await supabase.from("contractors").select("*").order("display_name");
    if (data) setContractors(data.map(d => ({ ...d, specializations: d.specializations ?? [], total_jobs: d.total_jobs ?? 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchContractors(); }, [fetchContractors]);

  const filtered = contractors.filter(c => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.display_name.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) || c.specializations.some(s => s.toLowerCase().includes(term));
  });

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) { toast({ title: "Name and email required", variant: "destructive" }); return; }
    setInviting(true);
    const { error } = await supabase.from("contractors").insert({
      user_id: crypto.randomUUID(), // placeholder until user registers
      display_name: inviteName,
      email: inviteEmail,
      is_available: false,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Contractor invited" }); setShowInvite(false); setInviteEmail(""); setInviteName(""); fetchContractors(); }
    setInviting(false);
  };

  const toggleAvailability = async (id: string, available: boolean) => {
    await supabase.from("contractors").update({ is_available: available }).eq("id", id);
    setContractors(prev => prev.map(c => c.id === id ? { ...c, is_available: available } : c));
    if (selectedContractor?.id === id) setSelectedContractor(prev => prev ? { ...prev, is_available: available } : null);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contractor Management</h1>
          <p className="text-sm text-muted-foreground">{contractors.length} contractors registered</p>
        </div>
        <Button size="sm" onClick={() => setShowInvite(true)}><Plus className="mr-1 h-3 w-3" /> Invite Contractor</Button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search contractors..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No contractors found</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelectedContractor(c)}>
                  <TableCell>
                    <div><span className="font-medium">{c.display_name}</span>{c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}</div>
                  </TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{c.specializations.slice(0, 3).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div></TableCell>
                  <TableCell>{c.hourly_rate ? `$${c.hourly_rate}/hr` : "—"}</TableCell>
                  <TableCell>{c.rating ? <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{c.rating.toFixed(1)}</span> : "—"}</TableCell>
                  <TableCell>{c.total_jobs}</TableCell>
                  <TableCell><Switch checked={c.is_available} onCheckedChange={v => toggleAvailability(c.id, v)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contractor Detail */}
      <Sheet open={!!selectedContractor} onOpenChange={() => setSelectedContractor(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedContractor?.display_name}</SheetTitle>
            <SheetDescription>Contractor profile and performance</SheetDescription>
          </SheetHeader>
          {selectedContractor && (
            <div className="mt-6 space-y-4">
              {selectedContractor.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{selectedContractor.email}</div>}
              {selectedContractor.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedContractor.phone}</div>}
              {selectedContractor.bio && <div><Label>Bio</Label><p className="text-sm text-muted-foreground">{selectedContractor.bio}</p></div>}
              <div><Label>Specializations</Label><div className="flex flex-wrap gap-1 mt-1">{selectedContractor.specializations.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Hourly Rate</Label><p className="text-lg font-bold">{selectedContractor.hourly_rate ? `$${selectedContractor.hourly_rate}` : "Not set"}</p></div>
                <div><Label>Commission Rate</Label><p className="text-lg font-bold">{selectedContractor.commission_rate}%</p></div>
                <div><Label>Total Jobs</Label><p className="text-lg font-bold">{selectedContractor.total_jobs}</p></div>
                <div><Label>Rating</Label><p className="text-lg font-bold flex items-center gap-1">{selectedContractor.rating ? <><Star className="h-4 w-4 text-amber-500 fill-amber-500" />{selectedContractor.rating.toFixed(1)}</> : "No ratings"}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={selectedContractor.is_available} onCheckedChange={v => toggleAvailability(selectedContractor.id, v)} />
                <span className="text-sm">{selectedContractor.is_available ? "Available" : "Unavailable"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Joined: {new Date(selectedContractor.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Contractor</DialogTitle>
            <DialogDescription>Add a new contractor to the platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input value={inviteName} onChange={e => setInviteName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e = autoComplete="email"> setInviteEmail(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting}>{inviting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
