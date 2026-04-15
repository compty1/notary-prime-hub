import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState, useRef } from "react";
import { BRAND } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Loader2, Truck, FileText, Pencil, ExternalLink, Globe, Printer, Download, CheckCircle2, Clock, ChevronRight, MessageSquare, X } from "lucide-react";
import { motion } from "framer-motion";

import { apostilleStatusColors as statusColors } from "@/lib/statusColors";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const statusFlow = ["intake", "payment_received", "submitted_to_sos", "processing", "shipped", "delivered"];

const statusLabels: Record<string, string> = {
  intake: "Intake",
  payment_received: "Payment Received",
  submitted_to_sos: "Submitted to SOS",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const CHECKLIST_ITEMS = [
  { key: "original_doc", label: "Original document received" },
  { key: "notarized_copy", label: "Notarized copy prepared" },
  { key: "sos_fee", label: "SOS fee collected ($5/doc)" },
  { key: "cover_letter", label: "Cover letter prepared" },
  { key: "sos_form", label: "SOS submission form completed" },
  { key: "shipping_label", label: "Return shipping label" },
];

interface ApostilleRequest {
  id: string; client_id: string; document_description: string; document_count: number;
  destination_country: string | null; fee: number | null; status: string;
  tracking_number: string | null; shipping_label_url: string | null; notes: string | null;
  created_at: string; updated_at: string;
}
interface ProfileInfo { user_id: string; full_name: string | null; email: string | null; address: string | null; city: string | null; state: string | null; zip: string | null; phone: string | null; }

export default function AdminApostille() {
  usePageMeta({ title: "Apostille Requests", noIndex: true });
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApostilleRequest[]>([]);
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailReq, setDetailReq] = useState<ApostilleRequest | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFee, setNewFee] = useState("75");
  const [newClientId, setNewClientId] = useState("");
  const [newDestCountry, setNewDestCountry] = useState("");
  const [newDocCount, setNewDocCount] = useState("1");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("apostille_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email, address, city, state, zip, phone"),
    ]).then(([{ data: reqs }, { data: profs }]) => {
      if (reqs) setRequests(reqs);
      if (profs) setProfiles(profs);
      setLoading(false);
    });
  }, []);

  const getClient = (clientId: string) => profiles.find(p => p.user_id === clientId);
  const getClientName = (clientId: string) => {
    const p = getClient(clientId);
    return p?.full_name || p?.email || clientId.slice(0, 8);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("apostille_requests").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (detailReq?.id === id) setDetailReq((prev: any) => prev ? { ...prev, status: newStatus } : null);
    toast({ title: "Status updated" });
    await supabase.from("audit_log").insert({ action: "apostille_status_changed", entity_type: "apostille_request", entity_id: id, details: { new_status: newStatus } });
  };

  const updateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase.from("apostille_requests").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
      if (detailReq?.id === id) setDetailReq((prev: any) => prev ? { ...prev, [field]: value } : null);
    }
  };

  const openDetail = (req: any) => {
    setDetailReq(req);
    // Load checklist from notes (stored as JSON in notes field prefix)
    try {
      const notesStr = req.notes || "";
      const checkMatch = notesStr.match(/\[CHECKLIST:(.*?)\]/);
      if (checkMatch) setChecklist(JSON.parse(checkMatch[1]));
      else setChecklist({});
    } catch { setChecklist({}); }
  };

  const toggleCheckItem = async (key: string) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    const currentNotes = (detailReq?.notes || "").replace(/\[CHECKLIST:.*?\]/, "").trim();
    const newNotes = `${currentNotes}\n[CHECKLIST:${JSON.stringify(updated)}]`.trim();
    await updateField(detailReq.id, "notes", newNotes);
  };

  const printCoverSheet = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const client = getClient(detailReq.client_id);
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Apostille Cover Sheet</title>
      <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.6}
      h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px}
      .field{margin:8px 0}.label{font-weight:bold;display:inline-block;width:200px}
      .section{margin-top:24px;border-top:1px solid #ccc;padding-top:12px}
      @media print{button{display:none}}</style></head><body>
      <h1>Apostille Request Cover Sheet</h1>
      <p style="text-align:center;color:#666">Ohio Secretary of State — Apostille/Authentication</p>
      <div class="section"><h3>Client Information</h3>
        <div class="field"><span class="label">Name:</span> ${client?.full_name || "N/A"}</div>
        <div class="field"><span class="label">Email:</span> ${client?.email || "N/A"}</div>
        <div class="field"><span class="label">Phone:</span> ${client?.phone || "N/A"}</div>
        <div class="field"><span class="label">Address:</span> ${client?.address || ""} ${client?.city || ""}, ${client?.state || ""} ${client?.zip || ""}</div>
      </div>
      <div class="section"><h3>Document Details</h3>
        <div class="field"><span class="label">Description:</span> ${detailReq.document_description}</div>
        <div class="field"><span class="label">Document Count:</span> ${detailReq.document_count}</div>
        <div class="field"><span class="label">Destination Country:</span> ${detailReq.destination_country || "N/A"}</div>
        <div class="field"><span class="label">Fee:</span> $${parseFloat(detailReq.fee || "0").toFixed(2)}</div>
      </div>
      <div class="section"><h3>Submission Details</h3>
        <div class="field"><span class="label">Request Date:</span> ${new Date(detailReq.created_at).toLocaleDateString()}</div>
        <div class="field"><span class="label">Status:</span> ${detailReq.status.replace(/_/g, " ")}</div>
        <div class="field"><span class="label">Tracking:</span> ${detailReq.tracking_number || "Pending"}</div>
      </div>
      <div class="section"><h3>Notes</h3><p>${(detailReq.notes || "None").replace(/\[CHECKLIST:.*?\]/, "").trim()}</p></div>
      <div class="section" style="margin-top:40px">
        <p>Prepared by: ${BRAND.teamLead.name}, Ohio Notary Public</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <button onclick="window.print()" style="margin-top:20px;padding:8px 24px;cursor:pointer">Print</button>
      </body></html>`);
    printWindow.document.close();
  };

  const generateSOSForm = () => {
    const client = getClient(detailReq.client_id);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Ohio SOS Apostille Form</title>
      <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.8}
      h1{text-align:center;font-size:18px}h2{font-size:14px;margin-top:20px}
      .field{margin:6px 0;border-bottom:1px dotted #999;padding-bottom:4px}
      .label{font-weight:bold;display:inline-block;width:220px;font-size:13px}
      .value{font-size:13px}
      @media print{button{display:none}}</style></head><body>
      <h1>STATE OF OHIO — SECRETARY OF STATE</h1>
      <h1>REQUEST FOR APOSTILLE / AUTHENTICATION</h1>
      <p style="text-align:center;font-size:12px;color:#666">180 E. Broad St., 16th Floor, Columbus, OH 43215 | (614) 466-2655</p>
      <h2>Requestor Information</h2>
      <div class="field"><span class="label">Name:</span><span class="value">${client?.full_name || "___________________"}</span></div>
      <div class="field"><span class="label">Address:</span><span class="value">${client?.address || "___________________"}</span></div>
      <div class="field"><span class="label">City/State/Zip:</span><span class="value">${client?.city || "________"}, ${client?.state || "__"} ${client?.zip || "_____"}</span></div>
      <div class="field"><span class="label">Phone:</span><span class="value">${client?.phone || "___________________"}</span></div>
      <div class="field"><span class="label">Email:</span><span class="value">${client?.email || "___________________"}</span></div>
      <h2>Document Information</h2>
      <div class="field"><span class="label">Type of Document:</span><span class="value">${detailReq.document_description}</span></div>
      <div class="field"><span class="label">Number of Documents:</span><span class="value">${detailReq.document_count}</span></div>
      <div class="field"><span class="label">Country of Destination:</span><span class="value">${detailReq.destination_country || "___________________"}</span></div>
      <h2>Fee Calculation</h2>
      <div class="field"><span class="label">Number of Apostilles:</span><span class="value">${detailReq.document_count}</span></div>
      <div class="field"><span class="label">Fee per Document:</span><span class="value">$5.00</span></div>
      <div class="field"><span class="label">Total SOS Fee:</span><span class="value">$${(detailReq.document_count * 5).toFixed(2)}</span></div>
      <h2>Type of Request</h2>
      <div class="field">☑ Apostille (for Hague Convention countries)  ☐ Authentication (for non-Hague countries)</div>
      <div style="margin-top:40px;border-top:1px solid #333;padding-top:10px">
        <p>Signature: _________________________ Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <button onclick="window.print()" style="margin-top:20px;padding:8px 24px;cursor:pointer">Print</button>
      </body></html>`);
    printWindow.document.close();
  };

  const sendMessage = async (clientId: string) => {
    const message = prompt("Enter message to send to client:");
    if (!message) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: session.user.id,
      recipient_id: clientId,
      message,
      is_admin: true,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Message sent" });
  };

  return (
    <DashboardEnhancer category="apostille">
      <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Apostille Workflow</h1>
          <p className="text-sm text-muted-foreground">Track apostille requests: intake → processing → delivery</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://www.ohiosos.gov/businesses/apostilles-authentications/" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> Ohio SOS Portal</Button>
          </a>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="">
            <Plus className="mr-1 h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          No apostille requests yet
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const currentIdx = statusFlow.indexOf(req.status);
            return (
              <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openDetail(req)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{req.document_description}</span>
                          <Badge className={statusColors[req.status] || "bg-muted text-muted-foreground"}>
                            {statusLabels[req.status] || req.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{getClientName(req.client_id)}</span>
                          {req.destination_country && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{req.destination_country}</span>}
                          <span>{req.document_count} doc(s)</span>
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        {/* Status pipeline mini */}
                        <div className="mt-2 flex items-center gap-1">
                          {statusFlow.map((s, i) => (
                            <div key={s} className="flex items-center">
                              <div className={`h-2 w-2 rounded-full ${i <= currentIdx ? "bg-accent" : "bg-muted-foreground/20"}`} />
                              {i < statusFlow.length - 1 && <div className={`h-0.5 w-4 ${i < currentIdx ? "bg-accent" : "bg-muted-foreground/20"}`} />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">${parseFloat(req.fee || "0").toFixed(2)}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      <Dialog open={!!detailReq} onOpenChange={() => setDetailReq(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailReq && (() => {
            const client = getClient(detailReq.client_id);
            const currentIdx = statusFlow.indexOf(detailReq.status);
            const displayNotes = (detailReq.notes || "").replace(/\[CHECKLIST:.*?\]/, "").trim();
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-sans flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {detailReq.document_description}
                  </DialogTitle>
                </DialogHeader>

                {/* Status Pipeline */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  {statusFlow.map((s, i) => (
                    <button key={s} className="flex flex-col items-center gap-1 group" onClick={() => updateStatus(detailReq.id, s)}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground group-hover:bg-accent/30"}`}>
                        {i < currentIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={`text-[10px] ${i <= currentIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {statusLabels[s]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Client Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Client</h3>
                    <div className="rounded-lg border border-border/50 p-3 text-sm space-y-1">
                      <p className="font-medium">{client?.full_name || "Unknown"}</p>
                      <p className="text-muted-foreground">{client?.email}</p>
                      {client?.phone && <p className="text-muted-foreground">{client.phone}</p>}
                      {client?.address && <p className="text-muted-foreground">{client.address}, {client.city}, {client.state} {client.zip}</p>}
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => sendMessage(detailReq.client_id)}>
                        <MessageSquare className="mr-1 h-3 w-3" /> Message Client
                      </Button>
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Details</h3>
                    <div className="rounded-lg border border-border/50 p-3 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span>{detailReq.destination_country || "N/A"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span>{detailReq.document_count}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Fee</span>
                        <Input className="h-6 w-20 text-xs text-right" type="number" defaultValue={detailReq.fee || 0}
                          onBlur={(e) => updateField(detailReq.id, "fee", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="flex justify-between"><span className="text-muted-foreground">SOS Fee</span><span>${(detailReq.document_count * 5).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(detailReq.created_at).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                </div>

                {/* Document Checklist */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Preparation Checklist</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CHECKLIST_ITEMS.map(item => (
                      <button key={item.key}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-xs text-left transition-colors ${checklist[item.key] ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/20"}`}
                        onClick={() => toggleCheckItem(item.key)}>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${checklist[item.key] ? "bg-accent border-accent" : "border-muted-foreground/30"}`}>
                          {checklist[item.key] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tracking */}
                {(detailReq.status === "shipped" || detailReq.status === "delivered") && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1"><Truck className="h-4 w-4" /> Shipping</h3>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Tracking number" defaultValue={detailReq.tracking_number || ""} className="text-sm"
                        onBlur={(e) => updateField(detailReq.id, "tracking_number", e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Notes</h3>
                  <Textarea defaultValue={displayNotes} rows={3} className="text-sm"
                    onBlur={(e) => {
                      const checkPart = (detailReq.notes || "").match(/\[CHECKLIST:.*?\]/)?.[0] || "";
                      updateField(detailReq.id, "notes", `${e.target.value}\n${checkPart}`.trim());
                    }} />
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={printCoverSheet}>
                    <Printer className="mr-1 h-3 w-3" /> Print Cover Sheet
                  </Button>
                  <Button size="sm" variant="outline" onClick={generateSOSForm}>
                    <Download className="mr-1 h-3 w-3" /> SOS Submission Form
                  </Button>
                  <a href="https://www.ohiosos.gov/businesses/apostilles-authentications/" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> Ohio SOS Portal</Button>
                  </a>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">New Apostille Request</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Destination Country</Label><Input value={newDestCountry} onChange={(e) => setNewDestCountry(e.target.value)} placeholder="e.g. Germany" /></div>
              <div><Label>Document Count</Label><Input type="number" min="1" value={newDocCount} onChange={(e) => setNewDocCount(e.target.value)} /></div>
            </div>
            <div><Label>Fee ($)</Label><Input type="number" step="0.01" value={newFee} onChange={(e) => setNewFee(e.target.value)} placeholder="75.00" /></div>
            <div><Label>Notes</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Additional details..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="" disabled={!newClientId || !newDesc} onClick={async () => {
              const { error } = await supabase.from("apostille_requests").insert({
                document_description: newDesc, notes: newNotes || null, client_id: newClientId, fee: parseFloat(newFee) || 75,
                destination_country: newDestCountry || null, document_count: parseInt(newDocCount) || 1,
              });
              if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
              else {
                toast({ title: "Request created" });
                setCreateOpen(false); setNewDesc(""); setNewNotes(""); setNewClientId(""); setNewFee("75"); setNewDestCountry(""); setNewDocCount("1");
                const { data } = await supabase.from("apostille_requests").select("*").order("created_at", { ascending: false });
                if (data) setRequests(data);
              }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardEnhancer>
  );
}