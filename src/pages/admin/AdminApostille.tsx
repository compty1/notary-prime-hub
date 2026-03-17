import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Loader2, Truck, CheckCircle, Clock, FileText } from "lucide-react";
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
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newClientId, setNewClientId] = useState("");

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
    }
  };

  const updateTracking = async (id: string, tracking: string) => {
    await supabase.from("apostille_requests").update({ tracking_number: tracking } as any).eq("id", id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, tracking_number: tracking } : r));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Apostille Workflow</h1>
          <p className="text-sm text-muted-foreground">Track apostille requests: intake → processing → delivery</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-accent text-accent-foreground hover:bg-gold-dark">
          <Plus className="mr-1 h-4 w-4" /> New Request
        </Button>
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
                      </div>
                      {req.notes && <p className="text-xs text-muted-foreground mb-2">{req.notes}</p>}
                      <p className="text-xs text-muted-foreground">Created: {new Date(req.created_at).toLocaleDateString()}</p>
                      {req.tracking_number && <p className="text-xs text-muted-foreground mt-1">Tracking: {req.tracking_number}</p>}
                      {/* Status flow buttons */}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New Apostille Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Document Description</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="e.g., Birth Certificate for international use" /></div>
            <div><Label>Notes</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Additional details..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-gold-dark" onClick={async () => {
              // Admin creating on behalf — use a placeholder client_id
              const { error } = await supabase.from("apostille_requests").insert({ document_description: newDesc, notes: newNotes, client_id: "00000000-0000-0000-0000-000000000000", fee: parseFloat(String(75)) } as any);
              if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
              else { toast({ title: "Request created" }); setCreateOpen(false); setNewDesc(""); setNewNotes(""); }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
