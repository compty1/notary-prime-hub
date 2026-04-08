import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, BookOpen, Calendar, FileText, Shield, DollarSign, Download, Pencil, Trash2, Loader2, Camera } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const serviceTypes = ["acknowledgment", "jurat", "oath", "copy_certification", "other"];

export default function AdminJournal() {
  usePageMeta({ title: "Notary Journal", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [form, setForm] = useState({
    signer_name: "", signer_address: "", id_type: "", id_number: "", id_expiration: "",
    document_type: "", document_description: "", service_performed: "acknowledgment",
    notarization_type: "in_person" as "in_person" | "ron", fees_charged: "",
    witnesses_present: "0", oath_administered: false, notes: "",
    platform_fees: "", travel_fee: "",
  });

  const fetchEntries = async () => {
    // Bug 483: Add limit; Bug 484: Filter out archived entries
    const { data } = await supabase.from("notary_journal").select("*").neq("archived", true).order("created_at", { ascending: false }).limit(1000);
    if (data) setEntries(data);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }).limit(50);
    if (data) setAppointments(data);
  };

  const [missingJournalCount, setMissingJournalCount] = useState(0);

  useEffect(() => { fetchEntries(); fetchAppointments(); }, []);

  // Compliance banner: check completed appointments without journal entries
  useEffect(() => {
    const checkMissingJournals = async () => {
      const { data: completedAppts } = await supabase
        .from("appointments")
        .select("id")
        .eq("status", "completed")
        .order("scheduled_date", { ascending: false })
        .limit(200);
      if (!completedAppts || completedAppts.length === 0) return;

      const { data: journalApptIds } = await supabase
        .from("notary_journal")
        .select("appointment_id")
        .not("appointment_id", "is", null);

      const journalSet = new Set((journalApptIds || []).map((j: any) => j.appointment_id));
      const missing = completedAppts.filter(a => !journalSet.has(a.id));
      setMissingJournalCount(missing.length);
    };
    checkMissingJournals();
  }, [entries]);

  useEffect(() => {
    if (selectedAppointment && selectedAppointment !== "") {
      const appt = appointments.find((a) => a.id === selectedAppointment);
      if (appt) {
        setForm((prev) => ({ ...prev, document_type: appt.service_type || "", notarization_type: appt.notarization_type || "in_person" }));
      }
    }
  }, [selectedAppointment, appointments]);

  const resetForm = () => {
    setForm({
      signer_name: "", signer_address: "", id_type: "", id_number: "", id_expiration: "",
      document_type: "", document_description: "", service_performed: "acknowledgment",
      notarization_type: "in_person", fees_charged: "", witnesses_present: "0",
      oath_administered: false, notes: "", platform_fees: "", travel_fee: "",
    });
    setSelectedAppointment("");
    setEditingEntry(null);
  };

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setForm({
      signer_name: entry.signer_name || "", signer_address: entry.signer_address || "",
      id_type: entry.id_type || "", id_number: entry.id_number || "",
      id_expiration: entry.id_expiration || "", document_type: entry.document_type || "",
      document_description: entry.document_description || "", service_performed: entry.service_performed || "acknowledgment",
      notarization_type: entry.notarization_type || "in_person",
      fees_charged: entry.fees_charged?.toString() || "", witnesses_present: entry.witnesses_present?.toString() || "0",
      oath_administered: entry.oath_administered || false, notes: entry.notes || "",
      platform_fees: entry.platform_fees?.toString() || "", travel_fee: entry.travel_fee?.toString() || "",
    });
    setSelectedAppointment(entry.appointment_id || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Audit Item 14: Validate ALL ORC §147.141 required fields
    const missing: string[] = [];
    if (!form.signer_name) missing.push("Signer Name");
    if (!form.signer_address) missing.push("Signer Address");
    if (!form.document_type) missing.push("Document Type");
    if (!form.id_type) missing.push("ID Type");
    if (!form.id_number) missing.push("ID Number");
    if (!form.id_expiration) missing.push("ID Expiration");
    if (!form.service_performed) missing.push("Service Performed");
    if (!form.fees_charged) missing.push("Fee Charged");
    if (form.notarization_type === "ron" && !form.id_number) missing.push("ID Number (required for RON)");
    // ORC §147.08: Validate Ohio fee cap
    const feesCharged = parseFloat(form.fees_charged);
    if (feesCharged > 0 && feesCharged > 5) {
      const docCount = 1; // per-act validation
      if (feesCharged > docCount * 5) {
        missing.push(`Fee exceeds Ohio $5/act cap (ORC §147.08)`);
      }
    }
    if (missing.length > 0) {
      toast({ title: "Incomplete journal entry", description: `Required: ${missing.join(", ")}`, variant: "destructive" });
      return;
    }

    const feesCharged = form.fees_charged ? parseFloat(form.fees_charged) : null;
    const platformFees = form.platform_fees ? parseFloat(form.platform_fees) : null;
    const travelFee = form.travel_fee ? parseFloat(form.travel_fee) : null;
    const netProfit = feesCharged !== null ? feesCharged - (platformFees || 0) - (travelFee || 0) : null;

    const payload = {
      appointment_id: selectedAppointment && selectedAppointment !== "" ? selectedAppointment : null,
      signer_name: form.signer_name, signer_address: form.signer_address || null,
      id_type: form.id_type || null, id_number: form.id_number || null,
      id_expiration: form.id_expiration || null, document_type: form.document_type,
      document_description: form.document_description || null, service_performed: form.service_performed,
      notarization_type: form.notarization_type, fees_charged: feesCharged,
      witnesses_present: parseInt(form.witnesses_present) || 0, oath_administered: form.oath_administered,
      oath_timestamp: form.oath_administered ? new Date().toISOString() : null,
      notes: form.notes || null, platform_fees: platformFees, travel_fee: travelFee, net_profit: netProfit,
    };

    let error;
    if (editingEntry) {
      ({ error } = await supabase.from("notary_journal").update(payload).eq("id", editingEntry.id));
    } else {
      ({ error } = await supabase.from("notary_journal").insert({ ...payload, created_by: user!.id }));
    }

    if (error) {
      toast({ title: "Error saving entry", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingEntry ? "Entry updated" : "Journal entry saved" });
      setDialogOpen(false);
      resetForm();
      fetchEntries();
    }
  };

  const deleteEntry = async (id: string) => {
    setDeletingId(id);
    const entry = entries.find(e => e.id === id);
    // Bug 484: Soft-delete for ORC §147.551 compliance (5-year retention)
    const { error } = await supabase.from("notary_journal").update({ archived: true } as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Entry deleted" });
      // Item 317: Audit log on journal delete
      try {
        const { logAuditEvent } = await import("@/lib/auditLog");
        logAuditEvent("journal_entry_deleted", { entityType: "notary_journal", entityId: id, details: { signer_name: entry?.signer_name, document_type: entry?.document_type } });
      } catch (e) { console.error("Audit log error:", e); }
      fetchEntries();
    }
    setDeletingId(null);
  };

  const exportCSV = () => {
    const headers = ["Journal #", "Date", "Signer Name", "Document Type", "Service", "Type", "ID Type", "ID Number", "Fee Charged", "Platform Fees", "Travel Fee", "Net Profit", "Oath", "Notes"];
    const rows = filtered.map((e) => [
      e.journal_number || "", new Date(e.created_at).toLocaleDateString(), e.signer_name, e.document_type,
      e.service_performed, e.notarization_type, e.id_type || "", e.id_number || "",
      e.fees_charged || "", e.platform_fees || "", e.travel_fee || "", e.net_profit || "",
      e.oath_administered ? "Yes" : "No", (e.notes || "").replace(/,/g, ";"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `notary-journal-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Journal exported", description: "CSV file downloaded." });
  };

  const exportJSONBackup = () => {
    const backup = {
      exported_at: new Date().toISOString(),
      format: "notary_journal_backup_v1",
      entry_count: filtered.length,
      entries: filtered.map(e => ({
        journal_number: e.journal_number,
        created_at: e.created_at,
        signer_name: e.signer_name,
        signer_address: e.signer_address,
        document_type: e.document_type,
        document_description: e.document_description,
        service_performed: e.service_performed,
        notarization_type: e.notarization_type,
        id_type: e.id_type,
        id_number: e.id_number,
        id_expiration: e.id_expiration,
        fees_charged: e.fees_charged,
        platform_fees: e.platform_fees,
        travel_fee: e.travel_fee,
        net_profit: e.net_profit,
        oath_administered: e.oath_administered,
        oath_timestamp: e.oath_timestamp,
        witnesses_present: e.witnesses_present,
        notes: e.notes,
        recording_url: e.recording_url,
      })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `notary-journal-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Journal backup exported", description: "JSON backup file downloaded." });
  };

  const exportPrintablePDF = () => {
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Popup blocked", description: "Please allow popups to export.", variant: "destructive" }); return; }
    const rows = filtered.map((e) => `<tr>
      <td>${e.journal_number || "—"}</td>
      <td>${new Date(e.created_at).toLocaleDateString()}</td>
      <td>${e.signer_name}</td>
      <td>${e.document_type}</td>
      <td>${e.service_performed?.replace(/_/g, " ")}</td>
      <td>${e.notarization_type === "ron" ? "RON" : "In-Person"}</td>
      <td>${e.id_type?.replace(/_/g, " ") || "—"}</td>
      <td>${e.id_number || "—"}</td>
      <td>$${parseFloat(e.fees_charged || 0).toFixed(2)}</td>
      <td>${e.oath_administered ? "Yes" : "No"}</td>
      <td>${e.notes || ""}</td>
    </tr>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Notary Journal Report</title><style>
      body{font-family:Arial,sans-serif;margin:20px;color:#333}
      h1{font-size:18px;margin-bottom:4px}
      p{font-size:12px;color:#666;margin-top:0}
      table{border-collapse:collapse;width:100%;font-size:11px;margin-top:16px}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:bold}
      @media print{body{margin:0}button{display:none}}
    </style></head><body>
      <h1>Notary Journal — ORC §147.551 Compliant</h1>
      <p>Generated: ${new Date().toLocaleString()} · ${filtered.length} entries</p>
      <table><thead><tr><th>#</th><th>Date</th><th>Signer</th><th>Doc Type</th><th>Service</th><th>Type</th><th>ID Type</th><th>ID #</th><th>Fee</th><th>Oath</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
    </body></html>`);
    win.document.close();
    toast({ title: "Print preview opened" });
  };

  // Item 321: Add notarization type filter and date range filter
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filtered = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = e.signer_name.toLowerCase().includes(term) ||
      e.document_type.toLowerCase().includes(term) ||
      (e.notes || "").toLowerCase().includes(term) ||
      (e.service_performed || "").toLowerCase().includes(term);
    const matchType = typeFilter === "all" || e.notarization_type === typeFilter;
    let matchDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const created = new Date(e.created_at);
      if (dateFilter === "week") matchDate = (now.getTime() - created.getTime()) < 7 * 86400000;
      else if (dateFilter === "month") matchDate = (now.getTime() - created.getTime()) < 30 * 86400000;
      else if (dateFilter === "year") matchDate = (now.getTime() - created.getTime()) < 365 * 86400000;
    }
    return matchSearch && matchType && matchDate;
  });

  // Item 323: Summary statistics
  const totalFees = filtered.reduce((sum, e) => sum + (parseFloat(e.fees_charged) || 0), 0);
  const totalNet = filtered.reduce((sum, e) => sum + (parseFloat(e.net_profit) || 0), 0);

  // Item 325: Pagination
  const JOURNAL_PAGE_SIZE = 25;
  const [journalPage, setJournalPage] = useState(1);
  const totalJournalPages = Math.max(1, Math.ceil(filtered.length / JOURNAL_PAGE_SIZE));
  const paginatedFiltered = filtered.slice((journalPage - 1) * JOURNAL_PAGE_SIZE, journalPage * JOURNAL_PAGE_SIZE);

  return (
    <div>
      {/* Compliance Warning Banner */}
      {missingJournalCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {missingJournalCount} completed appointment{missingJournalCount > 1 ? "s" : ""} without journal entries
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Ohio ORC §147.551 requires a journal entry for every notarial act. Create entries for all completed appointments.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            onClick={() => { setDialogOpen(true); }}
          >
            <Plus className="mr-1 h-3 w-3" /> Create Entry
          </Button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Notary Journal</h1>
          <p className="text-sm text-muted-foreground">ORC §147.551 compliant record keeping</p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-1 h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportPrintablePDF}>
                <FileText className="mr-1 h-4 w-4" /> Print PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportJSONBackup}>
                <Download className="mr-1 h-4 w-4" /> JSON Backup
              </Button>
            </>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="">
                <Plus className="mr-1 h-4 w-4" /> New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-sans">{editingEntry ? "Edit Journal Entry" : "New Journal Entry"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Link to Appointment (optional)</Label>
                  <Select value={selectedAppointment} onValueChange={(v) => setSelectedAppointment(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select appointment to auto-fill..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {appointments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.scheduled_date} — {a.service_type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Signer Name *</Label><Input value={form.signer_name} onChange={(e) => setForm({ ...form, signer_name: e.target.value })} /></div>
                  <div><Label>Signer Address</Label><Input value={form.signer_address} onChange={(e) => setForm({ ...form, signer_address: e.target.value })} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>ID Type</Label>
                    <Select value={form.id_type} onValueChange={(v) => setForm({ ...form, id_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="state_id">State ID</SelectItem>
                        <SelectItem value="passport">U.S. Passport</SelectItem>
                        <SelectItem value="military_id">Military ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>ID Number</Label><Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
                  <div><Label>ID Expiration</Label><Input type="date" value={form.id_expiration} onChange={(e) => setForm({ ...form, id_expiration: e.target.value })} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Document Type *</Label><Input value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} placeholder="e.g., Power of Attorney" /></div>
                  <div>
                    <Label>Service Performed</Label>
                    <Select value={form.service_performed} onValueChange={(v) => setForm({ ...form, service_performed: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{serviceTypes.map((s) => (<SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Document Description</Label><Input value={form.document_description} onChange={(e) => setForm({ ...form, document_description: e.target.value })} placeholder="Brief description" /></div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Notarization Type</Label>
                    <Select value={form.notarization_type} onValueChange={(v: "in_person" | "ron") => setForm({ ...form, notarization_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="in_person">In Person</SelectItem><SelectItem value="ron">RON</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fee Charged ($)</Label><Input type="number" step="0.01" min="0" value={form.fees_charged} onChange={(e) => setForm({ ...form, fees_charged: e.target.value })} placeholder="5.00" /></div>
                  <div><Label>Witnesses Present</Label><Input type="number" min="0" value={form.witnesses_present} onChange={(e) => setForm({ ...form, witnesses_present: e.target.value })} /></div>
                </div>
                <div className="rounded-lg border border-border/50 p-3 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Profit Tracking</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div><Label>Platform Fees ($)</Label><Input type="number" step="0.01" min="0" value={form.platform_fees} onChange={(e) => setForm({ ...form, platform_fees: e.target.value })} placeholder="KBA + SignNow fees" /></div>
                     <div><Label>Travel Fee ($)</Label><Input type="number" step="0.01" min="0" value={form.travel_fee} onChange={(e) => setForm({ ...form, travel_fee: e.target.value })} placeholder="Travel costs" /></div>
                  </div>
                  {form.fees_charged && (
                    <p className="text-xs text-muted-foreground">
                      Net profit: ${((parseFloat(form.fees_charged) || 0) - (parseFloat(form.platform_fees) || 0) - (parseFloat(form.travel_fee) || 0)).toFixed(2)}
                    </p>
                  )}
                </div>
                 <div className="flex items-center gap-3">
                   <Switch id="oath-switch" checked={form.oath_administered} onCheckedChange={(v) => setForm({ ...form, oath_administered: v })} />
                   <Label htmlFor="oath-switch">Oath/Affirmation Administered</Label>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any additional notes..." /></div>
                {/* Certificate Photo Upload */}
                <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium"><Camera className="h-4 w-4 text-primary" /> Certificate Photos (optional)</p>
                  <Input type="file" accept="image/*" multiple onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || !user) return;
                    const urls: string[] = [];
                    for (const file of Array.from(files)) {
                      const path = `certificates/${user.id}/${Date.now()}_${file.name}`;
                      const { error } = await supabase.storage.from("documents").upload(path, file);
                      if (!error) {
                        const { data: signedData } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 365);
                        if (signedData?.signedUrl) urls.push(signedData.signedUrl);
                      }
                    }
                    if (urls.length > 0) toast({ title: `${urls.length} photo(s) uploaded` });
                  }} className="text-xs" />
                  <p className="mt-1 text-xs text-muted-foreground">Upload photos of certificates, stamps, or seals for this notarization</p>
                </div>
                <Button onClick={handleSubmit} className="w-full ">
                  {editingEntry ? "Update Entry" : "Save Journal Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Item 323: Summary stats bar */}
      {entries.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted-foreground">{filtered.length} entries</span>
          <span className="font-medium text-foreground">Total Fees: ${totalFees.toFixed(2)}</span>
          <span className={`font-medium ${totalNet >= 0 ? "text-primary" : "text-destructive"}`}>Net: ${totalNet.toFixed(2)}</span>
        </div>
      )}

      <div className="relative mb-6 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by signer, document type, notes..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setJournalPage(1); }} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setJournalPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in_person">In-Person</SelectItem>
            <SelectItem value="ron">RON</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setJournalPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <CardListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No journal entries yet</p>
            <p className="text-xs text-muted-foreground">Click "New Entry" to record a notarial act</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedFiltered.map((entry) => (
            <Card key={entry.id} className="border-border/50 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{entry.signer_name}</p>
                       <p className="text-sm text-muted-foreground">{entry.document_type}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {/* Item 319: Show journal_number */}
                        {entry.journal_number && <Badge variant="secondary" className="text-xs">#{entry.journal_number}</Badge>}
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(entry.created_at).toLocaleDateString()}</span>
                        <Badge variant="outline" className="text-xs">{entry.service_performed?.replace(/_/g, " ")}</Badge>
                        <Badge variant="outline" className="text-xs">{entry.notarization_type === "ron" ? "RON" : "In-Person"}</Badge>
                        {entry.oath_administered && <Badge className="bg-purple-100 text-purple-800 text-xs">Oath</Badge>}
                        {entry.fees_charged && <span className="font-medium text-foreground">${parseFloat(entry.fees_charged).toFixed(2)}</span>}
                        {entry.net_profit !== null && entry.net_profit !== undefined && (
                          <span className={`font-medium ${entry.net_profit >= 0 ? "text-primary" : "text-destructive"}`}>
                            Net: ${parseFloat(entry.net_profit).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {entry.id_type && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />{entry.id_type?.replace(/_/g, " ")} — #{entry.id_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="text-xs text-destructive"
                      onClick={() => deleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Item 325: Pagination controls */}
          {filtered.length > JOURNAL_PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Showing {(journalPage - 1) * JOURNAL_PAGE_SIZE + 1}–{Math.min(journalPage * JOURNAL_PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={journalPage <= 1} onClick={() => setJournalPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={journalPage >= totalJournalPages} onClick={() => setJournalPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
