import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Plus, Search, Loader2, Calendar, Building2, User, Star, ArrowRight, Download, Upload, ExternalLink, Pencil, Trash2, Sparkles, RefreshCw, Inbox, Clock, Globe, FileText, Tag, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

import { leadIntentColors as intentColors, leadStatusColors as statusColors } from "@/lib/statusColors";

// LP-001/002/003: Proper Lead type from DB schema
interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lead_type: string;
  service_needed: string | null;
  intent_score: string;
  source: string | null;
  source_url: string | null;
  notes: string | null;
  status: string;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
  email_cache_id: string | null;
  hubspot_contact_id: string | null;
}

interface SourceEmail {
  from_address: string | null;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  date: string | null;
}

const pipelineStatuses = ["new", "contacted", "qualified", "proposal", "converted", "closed-won", "closed-lost"];

const emptyLead = {
  name: "", phone: "", email: "", business_name: "", address: "", city: "", state: "OH", zip: "",
  lead_type: "individual", service_needed: "", intent_score: "medium", source: "manual", source_url: "", notes: "",
};

// LP-009: Proper CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export default function AdminLeadPortal() {
  usePageMeta({ title: "Lead Portal", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // LP-001: Typed state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null); // LP-018: Error state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  // LP-002: Typed editingLead
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [scrapingSocial, setScrapingSocial] = useState(false);
  const [importingEmail, setImportingEmail] = useState(false);
  // LP-003: Typed selectedLead
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sourceEmail, setSourceEmail] = useState<SourceEmail | null>(null);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // LP-012: Separate bulk action state with confirmation
  const [pendingBulkAction, setPendingBulkAction] = useState("");

  // LP-004: Fetch with error handling (LP-018)
  const fetchLeads = useCallback(async () => {
    setFetchError(null);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(error.message);
      setLoading(false);
      return;
    }
    if (data) setLeads(data as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Real-time subscription — LP-020: Handle UPDATE correctly
  useEffect(() => {
    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => {
            // Prevent duplicate if already in list
            if (prev.some(l => l.id === newLead.id)) return prev;
            return [newLead, ...prev];
          });
          setNewLeadIds((prev) => new Set(prev).add(newLead.id));
          setTimeout(() => {
            setNewLeadIds((prev) => {
              const next = new Set(prev);
              next.delete(newLead.id);
              return next;
            });
          }, 10000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          const updated = payload.new as Lead;
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          // Also update selectedLead if it's the same one
          setSelectedLead((prev) => prev && prev.id === updated.id ? updated : prev);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setLeads((prev) => prev.filter((l) => l.id !== deletedId));
          setSelectedLead((prev) => prev && prev.id === deletedId ? null : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => leads.filter((l) => {
    if (filterIntent !== "all" && l.intent_score !== filterIntent) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterType !== "all" && l.lead_type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (l.name || "").toLowerCase().includes(term) ||
        (l.business_name || "").toLowerCase().includes(term) ||
        (l.email || "").toLowerCase().includes(term) ||
        (l.phone || "").includes(term) ||
        (l.city || "").toLowerCase().includes(term);
    }
    return true;
  }), [leads, filterIntent, filterStatus, filterType, searchTerm]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); setSelectedIds(new Set()); }, [filterIntent, filterStatus, filterType, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((l) => l.id)));
    }
  };

  // LP-005/006: Batch operations using .in()
  const executeBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    
    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} leads?`)) return;
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Deleted ${ids.length} leads` });
      }
    } else if (pipelineStatuses.includes(action)) {
      // LP-006: Batch status update
      const updatePayload: Record<string, string> = { status: action };
      if (action === "contacted") {
        updatePayload.contacted_at = new Date().toISOString();
      }
      const { error } = await supabase.from("leads").update(updatePayload).in("id", ids);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Moved ${ids.length} leads → ${action}` });
      }
    }
    setSelectedIds(new Set());
    setPendingBulkAction("");
    fetchLeads();
  };

  const openCreate = () => { setEditingLead(null); setForm(emptyLead); setShowCreate(true); };
  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name || "", phone: lead.phone || "", email: lead.email || "",
      business_name: lead.business_name || "", address: lead.address || "",
      city: lead.city || "", state: lead.state || "OH", zip: lead.zip || "",
      lead_type: lead.lead_type || "individual", service_needed: lead.service_needed || "",
      intent_score: lead.intent_score || "medium", source: lead.source || "manual",
      source_url: lead.source_url || "", notes: lead.notes || "",
    });
    setShowCreate(true);
  };

  const openDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    setSourceEmail(null);
    if (lead.email_cache_id) {
      const { data } = await supabase
        .from("email_cache")
        .select("from_address, from_name, subject, body_text, date")
        .eq("id", lead.email_cache_id)
        .single();
      if (data) setSourceEmail(data as SourceEmail);
    }
  };

  // LP-007: Remove `as any` casts
  const saveLead = async () => {
    if (!form.name && !form.business_name) {
      toast({ title: "Name or business required", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingLead) {
      const { error } = await supabase.from("leads").update({
        name: form.name || null,
        phone: form.phone || null,
        email: form.email || null,
        business_name: form.business_name || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || "OH",
        zip: form.zip || null,
        lead_type: form.lead_type,
        service_needed: form.service_needed || null,
        intent_score: form.intent_score,
        source: form.source || "manual",
        source_url: form.source_url || null,
        notes: form.notes || null,
      }).eq("id", editingLead.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Lead updated" });
    } else {
      const { error } = await supabase.from("leads").insert({
        name: form.name || null,
        phone: form.phone || null,
        email: form.email || null,
        business_name: form.business_name || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || "OH",
        zip: form.zip || null,
        lead_type: form.lead_type,
        service_needed: form.service_needed || null,
        intent_score: form.intent_score,
        source: form.source || "manual",
        source_url: form.source_url || null,
        notes: form.notes || null,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Lead added" });
    }
    setSaving(false);
    setShowCreate(false);
    fetchLeads();
  };

  // LP-008: Remove `as any` cast
  const updateStatus = async (id: string, status: string) => {
    const updatePayload: Record<string, string> = { status };
    if (status === "contacted") {
      updatePayload.contacted_at = new Date().toISOString();
    }
    await supabase.from("leads").update(updatePayload).eq("id", id);
    toast({ title: `Lead → ${status}` });
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    toast({ title: "Lead deleted" });
    if (selectedLead?.id === id) setSelectedLead(null);
    fetchLeads();
  };

  // LP-109: Export includes all fields
  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Business", "Address", "City", "State", "Zip", "Service", "Intent", "Status", "Source", "Notes", "Created", "Score"];
    const rows = filtered.map((l) => [
      l.name, l.phone, l.email, l.business_name, l.address, l.city, l.state, l.zip,
      l.service_needed, l.intent_score, l.status, l.source, l.notes,
      l.created_at, String(computeLeadScore(l)),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v: string | null) => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // LP-009/010/011: Proper CSV parsing with batch insert
  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter(l => l.trim());
    const leadsToInsert: Array<Record<string, string | null>> = [];
    
    for (const line of lines) {
      const cols = parseCSVLine(line);
      if (cols.length < 2 || (!cols[0] && !cols[3])) continue;
      leadsToInsert.push({
        name: cols[0] || null,
        phone: cols[1] || null,
        email: cols[2] || null,
        business_name: cols[3] || null,
        city: cols[4] || null,
        state: cols[5] || "OH",
        service_needed: cols[6] || null,
        intent_score: cols[7] || "medium",
        status: "new",
        source: "csv_import",
      });
    }
    
    if (leadsToInsert.length > 0) {
      // LP-010: Batch insert
      const { error } = await supabase.from("leads").insert(leadsToInsert);
      if (error) {
        toast({ title: "Import error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Imported ${leadsToInsert.length} leads` });
      }
    } else {
      toast({ title: "No valid rows found in CSV", variant: "destructive" });
    }
    fetchLeads();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importFromInbox = async () => {
    setImportingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-email-leads", {});
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Import issue", description: data.error, variant: "destructive" });
      } else {
        toast({
          title: "Email Import Complete",
          description: data.message || `Scanned ${data.scanned} emails, extracted ${data.extracted} new leads.`,
        });
        fetchLeads();
      }
    } catch (e: unknown) {
      // LP-017: Typed error catch
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Import error", description: msg, variant: "destructive" });
    }
    setImportingEmail(false);
  };

  // Lead scoring engine — LP-021: Enhanced scoring
  const computeLeadScore = useCallback((lead: Lead): number => {
    let score = 0;
    if (lead.email) score += 20;
    if (lead.phone) score += 15;
    if (lead.lead_type === "business") score += 10;
    const highValueServices = ["Real Estate", "Loan Signing", "Estate Plan", "Business Formation", "Apostille"];
    if (lead.service_needed && highValueServices.some(s => lead.service_needed!.toLowerCase().includes(s.toLowerCase()))) score += 25;
    if (lead.intent_score === "high") score += 20;
    else if (lead.intent_score === "medium") score += 10;
    if (lead.contacted_at) score += 10;
    // LP-025: Aging penalty — fresher leads score higher
    if (lead.created_at) {
      const daysOld = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOld <= 3) score += 10;
      else if (daysOld <= 7) score += 5;
    }
    return Math.min(100, score);
  }, []);

  // LP-025: Lead aging indicator
  const getLeadAge = useCallback((lead: Lead): { days: number; label: string; color: string } => {
    const days = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return { days, label: "Today", color: "text-green-600" };
    if (days <= 3) return { days, label: `${days}d`, color: "text-green-500" };
    if (days <= 7) return { days, label: `${days}d`, color: "text-yellow-500" };
    if (days <= 14) return { days, label: `${days}d`, color: "text-orange-500" };
    if (days <= 30) return { days, label: `${days}d`, color: "text-red-500" };
    return { days, label: `${days}d`, color: "text-destructive" };
  }, []);

  // LP-027: Lead response time (time from creation to first contact)
  const getResponseTime = useCallback((lead: Lead): string | null => {
    if (!lead.contacted_at) return null;
    const hours = Math.round((new Date(lead.contacted_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "<1h";
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  }, []);

  // LP-028: Conversion velocity
  const conversionVelocity = useMemo(() => {
    const converted = leads.filter(l => l.status === "converted" && l.contacted_at);
    if (converted.length === 0) return null;
    const totalDays = converted.reduce((sum, l) => {
      const days = Math.max(1, Math.floor((new Date(l.contacted_at!).getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)));
      return sum + days;
    }, 0);
    return Math.round(totalDays / converted.length);
  }, [leads]);

  // LP-029: Lead source ROI
  const sourceStats = useMemo(() => {
    const map = new Map<string, { total: number; converted: number; highIntent: number }>();
    leads.forEach(l => {
      const src = l.source || "unknown";
      const existing = map.get(src) || { total: 0, converted: 0, highIntent: 0 };
      existing.total++;
      if (l.status === "converted" || l.status === "closed-won") existing.converted++;
      if (l.intent_score === "high") existing.highIntent++;
      map.set(src, existing);
    });
    return Array.from(map.entries())
      .map(([source, data]) => ({ source, ...data, convRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  // LP-036: Pipeline drop-off analysis
  const pipelineDropoff = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelineStatuses.forEach(s => { counts[s] = leads.filter(l => l.status === s).length; });
    return pipelineStatuses.map((stage, idx) => {
      const current = counts[stage] || 0;
      const previous = idx > 0 ? (counts[pipelineStatuses[idx - 1]] || 0) : leads.length;
      const dropoff = previous > 0 ? Math.round(((previous - current) / previous) * 100) : 0;
      return { stage, count: current, dropoff };
    });
  }, [leads]);

  // LP-026: Stale lead detection
  const staleLeads = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return leads.filter(l =>
      !["converted", "closed-won", "closed-lost"].includes(l.status) &&
      !l.contacted_at &&
      new Date(l.created_at).getTime() < thirtyDaysAgo
    );
  }, [leads]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    converted: leads.filter((l) => l.status === "converted").length,
    highIntent: leads.filter((l) => l.intent_score === "high").length,
    conversionRate: leads.length > 0 ? Math.round((leads.filter((l) => l.status === "converted" || l.status === "closed-won").length / leads.length) * 100) : 0,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((s, l) => s + computeLeadScore(l), 0) / leads.length) : 0,
    stale: staleLeads.length,
  }), [leads, computeLeadScore, staleLeads]);

  // Duplicate detection
  const duplicates = useMemo(() => {
    const emailMap = new Map<string, string[]>();
    const bizMap = new Map<string, string[]>();
    leads.forEach((l) => {
      if (l.email) {
        const key = l.email.toLowerCase().trim();
        emailMap.set(key, [...(emailMap.get(key) || []), l.id]);
      }
      if (l.business_name) {
        const key = l.business_name.toLowerCase().trim();
        bizMap.set(key, [...(bizMap.get(key) || []), l.id]);
      }
    });
    const dupIds = new Set<string>();
    emailMap.forEach((ids) => { if (ids.length > 1) ids.forEach((id) => dupIds.add(id)); });
    bizMap.forEach((ids) => { if (ids.length > 1) ids.forEach((id) => dupIds.add(id)); });
    return dupIds;
  }, [leads]);

  const discoverLeads = async () => {
    if (discovering) return;
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-leads", { body: { action: "discover" } });
      if (error) throw error;
      if (data?.error) toast({ title: "Discovery issue", description: data.error, variant: "destructive" });
      else { toast({ title: "AI Discovery Complete", description: `Found ${data.found} leads, inserted ${data.inserted} new ones.` }); fetchLeads(); }
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Unknown error"; toast({ title: "Discovery error", description: msg, variant: "destructive" }); }
    setDiscovering(false);
  };

  const enrichLeads = async () => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-leads", { body: { action: "enrich" } });
      if (error) throw error;
      if (data?.error) toast({ title: "Enrichment issue", description: data.error, variant: "destructive" });
      else { toast({ title: "Enrichment Complete", description: `Enriched ${data.enriched} leads.` }); fetchLeads(); }
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Unknown error"; toast({ title: "Enrichment error", description: msg, variant: "destructive" }); }
    setEnriching(false);
  };

  const scrapeSocial = async () => {
    setScrapingSocial(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-social-leads", {});
      if (error) throw error;
      if (data?.error) toast({ title: "Scrape issue", description: data.error, variant: "destructive" });
      else { toast({ title: "Social Scrape Complete", description: `Found ${data.results_found} results, extracted ${data.leads_extracted} leads, inserted ${data.inserted} new ones.` }); fetchLeads(); }
    } catch (e: unknown) { const msg = e instanceof Error ? e.message : "Unknown error"; toast({ title: "Scrape error", description: msg, variant: "destructive" }); }
    setScrapingSocial(false);
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  // LP-019: Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Lead Portal</h1>
          <p className="text-sm text-muted-foreground">Ohio notarization leads — discover, manage, convert</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={importFromInbox} disabled={importingEmail}>
            {importingEmail ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Inbox className="mr-1 h-3 w-3" />}
            Import from Inbox
          </Button>
          <Button variant="outline" size="sm" onClick={scrapeSocial} disabled={scrapingSocial}>
            {scrapingSocial ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Search className="mr-1 h-3 w-3" />}
            Scrape Social
          </Button>
          <Button variant="outline" size="sm" onClick={discoverLeads} disabled={discovering}>
            {discovering ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            AI Discover
          </Button>
          <Button variant="outline" size="sm" onClick={enrichLeads} disabled={enriching}>
            {enriching ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Enrich
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="mr-1 h-3 w-3" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-3 w-3" /> Export</Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Lead</Button>
        </div>
      </div>

      {/* Stale lead alert — LP-026 */}
      {staleLeads.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{staleLeads.length} stale lead{staleLeads.length > 1 ? "s" : ""} — untouched for 30+ days</p>
              <p className="text-xs text-muted-foreground">{staleLeads.slice(0, 3).map(l => l.name || l.business_name).join(", ")}{staleLeads.length > 3 ? ` +${staleLeads.length - 3} more` : ""}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats — enhanced with LP-025/028/029 metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-10">
        {[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.new },
          { label: "Contacted", value: stats.contacted },
          { label: "Qualified", value: stats.qualified },
          { label: "Converted", value: stats.converted },
          { label: "High Intent", value: stats.highIntent },
          { label: "Conv. Rate", value: `${stats.conversionRate}%` },
          { label: "Avg Score", value: stats.avgScore },
          { label: "Velocity", value: conversionVelocity ? `${conversionVelocity}d` : "—" },
          { label: "Stale", value: stats.stale },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Privacy & Ethics Notice */}
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
        📋 All lead data is sourced from public directories and direct inquiries. Data handling complies with Ohio privacy regulations. Source attribution is tracked per lead.
      </p>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search leads..." className="pl-9" />
        </div>
        <Select value={filterIntent} onValueChange={setFilterIntent}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Intent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {pipelineStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {/* LP-018: Error state */}
          {fetchError ? (
            <Card className="border-destructive/50">
              <CardContent className="py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium">Failed to load leads</p>
                <p className="text-sm text-muted-foreground mt-1">{fetchError}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={fetchLeads}>Retry</Button>
              </CardContent>
            </Card>
          ) : loading ? (
            // LP-019: Skeleton instead of spinner
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">No leads found. Add your first lead or import from your inbox.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {/* Bulk Actions Bar — LP-012: Confirmation step */}
              <div className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={selectedIds.size === paginated.length && paginated.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all on page"
                />
                <span className="text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filtered.length} leads`}</span>
                {selectedIds.size > 0 && (
                  <>
                    <Select value={pendingBulkAction} onValueChange={setPendingBulkAction}>
                      <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Bulk action..." /></SelectTrigger>
                      <SelectContent>
                        {pipelineStatuses.map((s) => <SelectItem key={s} value={s}>Move → {s}</SelectItem>)}
                        <SelectItem value="delete">Delete selected</SelectItem>
                      </SelectContent>
                    </Select>
                    {pendingBulkAction && (
                      <Button size="sm" variant="default" className="text-xs h-7" onClick={() => executeBulkAction(pendingBulkAction)}>
                        Apply to {selectedIds.size}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedIds(new Set()); setPendingBulkAction(""); }}>Clear</Button>
                  </>
                )}
                <span className="ml-auto text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
              </div>

              {paginated.map((lead) => (
                <Card
                  key={lead.id}
                  className={`border-border/50 transition-all ${newLeadIds.has(lead.id) ? "ring-2 ring-primary animate-pulse" : ""} ${selectedIds.has(lead.id) ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                        aria-label={`Select ${lead.name || lead.business_name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => openDetail(lead)}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {lead.lead_type === "business" ? <Building2 className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{lead.name || lead.business_name || "Unknown"}</p>
                          {lead.business_name && lead.name && <p className="text-xs text-muted-foreground">{lead.business_name}</p>}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {lead.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.city}, {lead.state}</span>}
                            {lead.service_needed && <span>{lead.service_needed}</span>}
                            {lead.source && lead.source !== "manual" && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`}>
                          <Button size="sm" variant="outline" className="text-xs"><Phone className="mr-1 h-3 w-3" />{lead.phone}</Button>
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`}>
                          <Button size="sm" variant="ghost" className="text-xs"><Mail className="h-3 w-3" /></Button>
                        </a>
                      )}
                      <Link to={`/admin/appointments?newLead=${encodeURIComponent(lead.name || lead.business_name || "")}`}>
                        <Button size="sm" variant="outline" className="text-xs"><Calendar className="mr-1 h-3 w-3" /> Schedule</Button>
                      </Link>
                      <Link to={`/ai-writer?tab=proposal&leadId=${lead.id}`}>
                        <Button size="sm" variant="outline" className="text-xs"><Sparkles className="mr-1 h-3 w-3" /> Proposal</Button>
                      </Link>
                      <Badge className={intentColors[lead.intent_score]}>{lead.intent_score}</Badge>
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {pipelineStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteLead(lead.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 7) page = i + 1;
                    else if (currentPage <= 4) page = i + 1;
                    else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                    else page = currentPage - 3 + i;
                    return (
                      <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* LP-013: Fix pipeline grid to show all 7 columns + LP-014: Use filtered instead of leads */}
        <TabsContent value="pipeline">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {pipelineStatuses.map((status) => {
              const pipeLeads = filtered.filter((l) => l.status === status);
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize">{status}</h3>
                    <Badge variant="outline" className="text-xs">{pipeLeads.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {pipeLeads.map((lead) => (
                      <Card key={lead.id} className="border-border/50 cursor-pointer hover:shadow-sm" onClick={() => openDetail(lead)}>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium truncate">{lead.name || lead.business_name}</p>
                          {lead.phone && <p className="text-[10px] text-muted-foreground mt-1">{lead.phone}</p>}
                          <Badge className={`${intentColors[lead.intent_score]} text-[10px] mt-1`}>{lead.intent_score}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedLead?.lead_type === "business" ? <Building2 className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
              {selectedLead?.name || selectedLead?.business_name || "Lead Details"}
            </SheetTitle>
            <SheetDescription>
              {selectedLead?.business_name && selectedLead?.name ? selectedLead.business_name : "View all details and take action"}
            </SheetDescription>
          </SheetHeader>

          {selectedLead && (
            <div className="space-y-6 mt-6">
              {/* Contact Info */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Contact Information</h4>
                <div className="space-y-2">
                  {selectedLead.name && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{selectedLead.name}</span></div>}
                  {selectedLead.business_name && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Business</span><span className="font-medium text-foreground">{selectedLead.business_name}</span></div>}
                  {selectedLead.phone && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Phone</span>
                      <a href={`tel:${selectedLead.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1"><Phone className="h-3 w-3" />{selectedLead.phone}</a>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Email</span>
                      <a href={`mailto:${selectedLead.email}`} className="font-medium text-primary hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{selectedLead.email}</a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Location */}
              {(selectedLead.address || selectedLead.city || selectedLead.state || selectedLead.zip) && (
                <>
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</h4>
                    <div className="space-y-2">
                      {selectedLead.address && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Address</span><span className="font-medium text-foreground">{selectedLead.address}</span></div>}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">City / State / Zip</span>
                        <span className="font-medium text-foreground">{[selectedLead.city, selectedLead.state, selectedLead.zip].filter(Boolean).join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Lead Intelligence */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Lead Intelligence</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={statusColors[selectedLead.status]}>{selectedLead.status}</Badge>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Intent</span>
                    <Badge className={intentColors[selectedLead.intent_score]}>{selectedLead.intent_score}</Badge>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-medium text-foreground capitalize">{selectedLead.lead_type}</span></div>
                  {selectedLead.service_needed && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service Needed</span><span className="font-medium text-foreground">{selectedLead.service_needed}</span></div>}
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium text-foreground flex items-center gap-1"><Globe className="h-3 w-3 text-muted-foreground" />{selectedLead.source}</span>
                  </div>
                  {selectedLead.source_url && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Source URL</span>
                      <a href={selectedLead.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs truncate max-w-[200px]"><ExternalLink className="h-3 w-3" />{selectedLead.source_url}</a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Timeline</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Created</span><span className="text-foreground">{formatDate(selectedLead.created_at)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Last Updated</span><span className="text-foreground">{formatDate(selectedLead.updated_at)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contacted</span><span className="text-foreground">{formatDate(selectedLead.contacted_at)}</span></div>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Notes</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{selectedLead.notes}</p>
                  </div>
                </>
              )}

              {/* Source Email Preview */}
              {sourceEmail && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Source Email</h4>
                    <Card className="border-border/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">From</span>
                          <span className="font-medium text-foreground">{sourceEmail.from_name || sourceEmail.from_address}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Subject</span>
                          <span className="font-medium text-foreground truncate max-w-[250px]">{sourceEmail.subject}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-foreground">{formatDate(sourceEmail.date)}</span>
                        </div>
                        {sourceEmail.body_text && (
                          <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-6 bg-muted/30 rounded p-2">{sourceEmail.body_text.substring(0, 500)}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              <Separator />

              {/* LP-015: Fixed double separator — Lead Score */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Lead Score</h4>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-primary">{computeLeadScore(selectedLead)}</div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${computeLeadScore(selectedLead)}%` }} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* LP-016: Proper URL encoding for actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelectedLead(null); openEdit(selectedLead); }}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Link to={`/book?service=${encodeURIComponent(selectedLead.service_needed || "Notarization")}&name=${encodeURIComponent(selectedLead.name || "")}&email=${encodeURIComponent(selectedLead.email || "")}&phone=${encodeURIComponent(selectedLead.phone || "")}`}>
                  <Button size="sm" variant="outline"><Calendar className="mr-1 h-3 w-3" /> Book Appointment</Button>
                </Link>
                <Link to={`/ai-writer?tab=proposal&leadId=${encodeURIComponent(selectedLead.id)}`}>
                  <Button size="sm" variant="outline"><Sparkles className="mr-1 h-3 w-3" /> Generate Proposal</Button>
                </Link>
                <Select value={selectedLead.status} onValueChange={(v) => { updateStatus(selectedLead.id, v); setSelectedLead({ ...selectedLead, status: v }); }}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {pipelineStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="destructive" onClick={() => deleteLead(selectedLead.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
              <div><Label>Business Name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(614) 555-1234" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} /></div>
              <div><Label>Zip</Label><Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.lead_type} onValueChange={(v) => setForm({ ...form, lead_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intent</Label>
                <Select value={form.intent_score} onValueChange={(v) => setForm({ ...form, intent_score: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Service Needed</Label><Input value={form.service_needed} onChange={(e) => setForm({ ...form, service_needed: e.target.value })} placeholder="Notarization" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="manual, referral, google..." /></div>
              <div><Label>Source URL</Label><Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={saveLead} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              {editingLead ? "Update" : "Add Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
