import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Plus, MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";

type Complaint = {
  id: string;
  clientName: string;
  category: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  createdAt: string;
  resolution?: string;
};

const CATEGORIES = [
  "Service Quality",
  "Billing Dispute",
  "Scheduling Issue",
  "Document Error",
  "Communication",
  "Compliance Concern",
  "Other",
];

export function ComplaintTracker() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [newComplaint, setNewComplaint] = useState({ clientName: "", category: "", description: "" });
  const [resolution, setResolution] = useState("");

  const addComplaint = () => {
    if (!newComplaint.clientName || !newComplaint.category || !newComplaint.description) return;
    const complaint: Complaint = {
      id: crypto.randomUUID(),
      ...newComplaint,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setComplaints(prev => [complaint, ...prev]);
    setNewComplaint({ clientName: "", category: "", description: "" });
    setDialogOpen(false);

    // Log to audit
    supabase.from("audit_log").insert({
      action: "complaint_filed",
      entity_type: "complaint",
      details: { category: complaint.category, client: complaint.clientName },
    });

    toast.success("Complaint recorded");
  };

  const resolveComplaint = (id: string) => {
    setComplaints(prev => prev.map(c =>
      c.id === id ? { ...c, status: "resolved" as const, resolution } : c
    ));
    setResolveDialog(null);
    setResolution("");
    toast.success("Complaint resolved");
  };

  const statusColor: Record<string, string> = {
    open: "bg-red-500/10 text-red-600 border-red-500/30",
    investigating: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
    resolved: "bg-green-500/10 text-green-600 border-green-500/30",
    dismissed: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" /> Complaints & Disputes
        </CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Complaint
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No complaints recorded</p>
          ) : (
            <div className="space-y-2">
              {complaints.map(c => (
                <div key={c.id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.clientName}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColor[c.status]}`}>{c.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {format(new Date(c.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  {c.status === "open" && (
                    <Button size="sm" variant="outline" className="text-xs h-6 mt-1" onClick={() => setResolveDialog(c.id)}>
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Complaint</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Client Name</label>
              <input
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                value={newComplaint.clientName}
                onChange={e => setNewComplaint(p => ({ ...p, clientName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={newComplaint.category} onValueChange={v => setNewComplaint(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={newComplaint.description} onChange={e => setNewComplaint(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addComplaint}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Complaint</DialogTitle></DialogHeader>
          <Textarea placeholder="Resolution notes..." value={resolution} onChange={e => setResolution(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>Cancel</Button>
            <Button onClick={() => resolveDialog && resolveComplaint(resolveDialog)}>Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
