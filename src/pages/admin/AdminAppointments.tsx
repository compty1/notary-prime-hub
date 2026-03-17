import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, MapPin, Monitor, FileText, Printer, BookMarked, ChevronRight } from "lucide-react";

const statuses = ["scheduled", "confirmed", "id_verification", "kba_pending", "in_session", "completed", "cancelled", "no_show"];

const statusFlow: Record<string, string> = {
  scheduled: "confirmed",
  confirmed: "id_verification",
  id_verification: "kba_pending",
  kba_pending: "in_session",
  in_session: "completed",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  id_verification: "bg-yellow-100 text-yellow-800",
  kba_pending: "bg-orange-100 text-orange-800",
  in_session: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [receiptAppt, setReceiptAppt] = useState<any>(null);
  const [quickJournalAppt, setQuickJournalAppt] = useState<any>(null);
  const [journalForm, setJournalForm] = useState({
    fees_charged: "5.00",
    oath_administered: false,
    notes: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    let query = supabase.from("appointments").select("*").order("scheduled_date", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as any);
    const [{ data: appts }, { data: profs }] = await Promise.all([
      query,
      supabase.from("profiles").select("*"),
    ]);
    if (appts) setAppointments(appts);
    if (profs) setProfiles(profs);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const getClientName = (clientId: string) => {
    const p = profiles.find((p) => p.user_id === clientId);
    return p?.full_name || "Unknown Client";
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("appointments").update({ status: newStatus as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `→ ${newStatus.replace(/_/g, " ")}` });
      // If completed, offer quick journal entry
      if (newStatus === "completed") {
        const appt = appointments.find((a) => a.id === id);
        if (appt) setQuickJournalAppt(appt);
      }
      fetchData();
    }
  };

  const advanceStatus = (appt: any) => {
    const next = statusFlow[appt.status];
    if (next) updateStatus(appt.id, next);
  };

  const saveQuickJournal = async () => {
    if (!quickJournalAppt || !user) return;
    const { error } = await supabase.from("notary_journal").insert({
      appointment_id: quickJournalAppt.id,
      signer_name: getClientName(quickJournalAppt.client_id),
      document_type: quickJournalAppt.service_type,
      service_performed: "acknowledgment",
      notarization_type: quickJournalAppt.notarization_type,
      fees_charged: parseFloat(journalForm.fees_charged) || 5,
      oath_administered: journalForm.oath_administered,
      oath_timestamp: journalForm.oath_administered ? new Date().toISOString() : null,
      notes: journalForm.notes || null,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Journal error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Journal entry saved" });
      setQuickJournalAppt(null);
      setJournalForm({ fees_charged: "5.00", oath_administered: false, notes: "" });
    }
  };

  const generateReceipt = (appt: any) => {
    setReceiptAppt(appt);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Appointments</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">No appointments found</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className="border-border/50">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    {appt.notarization_type === "ron" ? <Monitor className="h-5 w-5 text-accent" /> : <MapPin className="h-5 w-5 text-accent" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{appt.service_type}</p>
                    <p className="text-xs text-muted-foreground">{getClientName(appt.client_id)}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {appt.scheduled_date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {appt.scheduled_time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Quick advance button */}
                  {statusFlow[appt.status] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => advanceStatus(appt)}
                    >
                      <ChevronRight className="mr-1 h-3 w-3" />
                      {statusFlow[appt.status].replace(/_/g, " ")}
                    </Button>
                  )}
                  {/* Receipt for completed */}
                  {appt.status === "completed" && (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => generateReceipt(appt)}>
                      <Printer className="mr-1 h-3 w-3" /> Receipt
                    </Button>
                  )}
                  <Select value={appt.status} onValueChange={(v) => updateStatus(appt.id, v)}>
                    <SelectTrigger className="w-40">
                      <Badge className={statusColors[appt.status] || "bg-muted"}>{appt.status.replace(/_/g, " ")}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Journal Entry Dialog */}
      <Dialog open={!!quickJournalAppt} onOpenChange={() => setQuickJournalAppt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-accent" />
              Quick Journal Entry
            </DialogTitle>
          </DialogHeader>
          {quickJournalAppt && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>Client:</strong> {getClientName(quickJournalAppt.client_id)}</p>
                <p><strong>Service:</strong> {quickJournalAppt.service_type}</p>
                <p><strong>Date:</strong> {quickJournalAppt.scheduled_date}</p>
                <p><strong>Type:</strong> {quickJournalAppt.notarization_type === "ron" ? "RON" : "In-Person"}</p>
              </div>
              <div>
                <Label>Fee Charged ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={journalForm.fees_charged}
                  onChange={(e) => setJournalForm({ ...journalForm, fees_charged: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={journalForm.oath_administered}
                  onCheckedChange={(v) => setJournalForm({ ...journalForm, oath_administered: v })}
                />
                <Label>Oath/Affirmation Administered</Label>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={journalForm.notes}
                  onChange={(e) => setJournalForm({ ...journalForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Any session notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickJournalAppt(null)}>Skip</Button>
            <Button onClick={saveQuickJournal} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              Save Journal Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptAppt} onOpenChange={() => setReceiptAppt(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Notarization Receipt</DialogTitle>
          </DialogHeader>
          {receiptAppt && (
            <div className="space-y-4 print:p-8" id="receipt-content">
              <div className="text-center border-b border-border pb-4">
                <h2 className="font-display text-xl font-bold text-foreground">Shane Goble</h2>
                <p className="text-sm text-muted-foreground">Ohio Commissioned Notary Public</p>
                <p className="text-xs text-muted-foreground">Franklin County, Ohio</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Receipt of Notarial Act</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Service</span>
                  <span className="font-medium">{receiptAppt.scheduled_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{receiptAppt.scheduled_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{getClientName(receiptAppt.client_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{receiptAppt.service_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notarization Type</span>
                  <span className="font-medium">{receiptAppt.notarization_type === "ron" ? "Remote Online (RON)" : "In-Person"}</span>
                </div>
                {receiptAppt.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{receiptAppt.location}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Fee (per ORC §147.08)</span>
                  <span className="font-bold">$5.00 per signature</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center space-y-1">
                <p>This notarization was performed in compliance with Ohio Revised Code Chapter 147.</p>
                {receiptAppt.notarization_type === "ron" && (
                  <p>RON session conducted per ORC §147.65-.66. Session recording stored per requirements.</p>
                )}
                <p className="mt-2">Thank you for choosing Shane Goble Notary Services.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptAppt(null)}>Close</Button>
            <Button
              onClick={() => window.print()}
              className="bg-accent text-accent-foreground hover:bg-gold-dark"
            >
              <Printer className="mr-1 h-4 w-4" /> Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
