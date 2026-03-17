import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Loader2, Truck, FileText, Pencil, ExternalLink, Globe } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  intake: "bg-blue-100 text-blue-800",
  payment_received: "bg-yellow-100 text-yellow-800",
  submitted_to_sos: "bg-orange-100 text-orange-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusFlow = ["intake", "payment_received", "submitted_to_sos", "processing", "shipped", "delivered"];

export default function AdminApostille() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<any>(null);
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFee, setNewFee] = useState("75");
  const [newClientId, setNewClientId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editDestCountry, setEditDestCountry] = useState("");
  const [editDocCount, setEditDocCount] = useState("1");
  const [newDestCountry, setNewDestCountry] = useState("");
  const [newDocCount, setNewDocCount] = useState("1");

  useEffect(() => {
    Promise.all([
      supabase.from("apostille_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]).then(([{ data: reqs }, { data: profs }]) => {
      if (reqs) setRequests(reqs);
      if (profs) setProfiles(profs);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("apostille_requests").update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
      toast({ title: "Status updated" });
      await supabase.from("audit_log").insert({
        action: "apostille_status_changed",
        entity_type: "apostille_request",
        entity_id: id,
        details: { new_status: newStatus },
      });
    }
  };

  const updateTracking = async (id: string, tracking: string) => {
    await supabase.from("apostille_requests").update({ tracking_number: tracking } as any).eq("id", id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, tracking_number: tracking } : r));
  };

  const openEdit = (req: any) => {
    setEditOpen(req);
    setEditNotes(req.notes || "");
    setEditFee(String(req.fee || "0"));
    setEditDestCountry(req.destination_country || "");
    setEditDocCount(String(req.document_count || 1));
  };

  const saveEdit = async () => {
    if (!editOpen) return;
    const { error } = await supabase.from("apostille_requests").update({
      notes: editNotes || null,
      fee: parseFloat(editFee) || 0,
      destination_country: editDestCountry || null,
      document_count: parseInt(editDocCount) || 1,
      updated_at: new Date().toISOString(),
    } as any).eq("id", editOpen.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      setRequests(prev => prev.map(r => r.id === editOpen.id ? { ...r, notes: editNotes, fee: parseFloat(editFee) || 0, destination_country: editDestCountry || null, document_count: parseInt(editDocCount) || 1 } : r));
      toast({ title: "Request updated" });
      setEditOpen(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Apostille Workflow</h1>
          <p className="text-sm text-muted-foreground">Track apostille requests: intake → processing → delivery</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://www.ohiosos.gov/businesses/apostilles-authentications/" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> Ohio SOS Portal</Button>
          </a>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-accent text-accent-foreground hover:bg-gold-dark">
            <Plus className="mr-1 h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : requests.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          No apostille requests yet
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-accent" />
                        <span className="font-medium text-sm">{req.document_description}</span>
                        <Badge className={statusColors[req.status] || "bg-muted text-muted-foreground"}>{req.status.replace(/_/g, " ")}</Badge>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(req)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Client: {(() => { const p = profiles.find(p => p.user_id === req.client_id); return p?.full_name || p?.email || req.client_id.slice(0, 8); })()}</p>
                      {req.notes && <p className="text-xs text-muted-foreground mb-2">{req.notes}</p>}
                      <p className="text-xs text-muted-foreground">Created: {new Date(req.created_at).toLocaleDateString()}</p>
                      {req.tracking_number && <p className="text-xs text-muted-foreground mt-1">Tracking: {req.tracking_number}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {statusFlow.map((s) => (
                          <Button key={s} size="sm" variant={req.status === s ? "default" : "outline"} className="text-xs h-7" onClick={() => updateStatus(req.id, s)}>
                            {s.replace(/_/g, " ")}
                          </Button>
                        ))}
                      </div>
                      {req.status === "shipped" && (
                        <div className="mt-2 flex items-center gap-2">
                          <Input placeholder="Tracking #" defaultValue={req.tracking_number || ""} className="h-8 text-xs w-48"
                            onBlur={(e) => updateTracking(req.id, e.target.value)} />
                          <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm font-medium">${parseFloat(req.fee || "0").toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New Apostille Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client *</Label>
              <Select value={newClientId} onValueChange={setNewClientId}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Document Description</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="e.g., Birth Certificate for international use" /></div>
            <div><Label>Fee ($)</Label><Input type="number" step="0.01" value={newFee} onChange={(e) => setNewFee(e.target.value)} placeholder="75.00" /></div>
            <div><Label>Notes</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Additional details..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-gold-dark" disabled={!newClientId || !newDesc} onClick={async () => {
              const { error } = await supabase.from("apostille_requests").insert({
                document_description: newDesc, notes: newNotes || null, client_id: newClientId, fee: parseFloat(newFee) || 75,
              } as any);
              if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
              else {
                toast({ title: "Request created" });
                setCreateOpen(false); setNewDesc(""); setNewNotes(""); setNewClientId(""); setNewFee("75");
                const { data } = await supabase.from("apostille_requests").select("*").order("created_at", { ascending: false });
                if (data) setRequests(data);
              }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOpen} onOpenChange={() => setEditOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit Apostille Request</DialogTitle></DialogHeader>
          {editOpen && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{editOpen.document_description}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {editOpen.status.replace(/_/g, " ")}</p>
              </div>
              <div><Label>Fee ($)</Label><Input type="number" step="0.01" value={editFee} onChange={(e) => setEditFee(e.target.value)} /></div>
              <div><Label>Notes</Label><Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>Cancel</Button>
            <Button onClick={saveEdit} className="bg-accent text-accent-foreground hover:bg-gold-dark">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
