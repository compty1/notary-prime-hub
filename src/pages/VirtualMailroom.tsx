import { useState, useEffect, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Inbox, Mail, Archive, Forward, Eye, Download, Loader2, MailOpen, Package,
  Search, Sparkles, FileText, Clock, ChevronRight, Scan, Send, Trash2, Filter
} from "lucide-react";
import { callEdgeFunction } from "@/lib/edgeFunctionAuth";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  read: "bg-muted text-muted-foreground",
  forwarded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  archived: "bg-muted/50 text-muted-foreground",
};

export default function VirtualMailroom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);

  usePageMeta({ title: "Virtual Mailroom", description: "Track and manage your physical mail items — scanned documents, forwarding, and secure digital access." });

  useEffect(() => {
    if (!user) return;
    supabase.from("mailroom_items").select("*").eq("client_id", user.id).order("received_date", { ascending: false }).then(({ data }) => {
      if (data) {
        setItems(data);
        if (data.length > 0) setSelectedItem(data[0]);
      }
      setLoading(false);
    });
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("mailroom_items").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      if (selectedItem?.id === id) setSelectedItem((prev: any) => prev ? { ...prev, status: newStatus } : null);
      toast({ title: `Marked as ${newStatus}` });
    }
  };

  const downloadScan = async (item: any) => {
    if (!item.scanned_file_path) {
      toast({ title: "No scan available", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.storage.from("documents").download(item.scanned_file_path);
    if (error) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = `mail_${item.subject.replace(/\s+/g, "_")}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const aiSummarize = async (item: any) => {
    if (!user) return;
    setAiProcessing(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const { data, error } = await supabase.functions.invoke("notary-assistant", {
        body: {
          message: `Summarize this mail item for a client. Subject: "${item.subject}". From: "${item.sender || "Unknown"}". Date: ${item.received_date}. Provide a concise 2-3 sentence summary of what this correspondence likely contains and any recommended actions.`,
          context: "mailroom_summary",
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error) throw error;
      const summary = data?.reply || data?.response || "AI summary unavailable.";
      // Save summary to notes
      await supabase.from("mailroom_items").update({ notes: summary }).eq("id", item.id);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, notes: summary } : i));
      if (selectedItem?.id === item.id) setSelectedItem((prev: any) => prev ? { ...prev, notes: summary } : null);
      toast({ title: "AI summary generated" });
    } catch (e: any) {
      toast({ title: "AI summary failed", description: e.message, variant: "destructive" });
    }
    setAiProcessing(false);
  };

  const draftResponse = (item: any) => {
    navigate(`/docudex?draft=response&subject=${encodeURIComponent(item.subject)}&sender=${encodeURIComponent(item.sender || "")}`);
  };

  const filtered = useMemo(() => {
    let result = filter === "all" ? items : items.filter(i => i.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.subject?.toLowerCase().includes(q) || i.sender?.toLowerCase().includes(q));
    }
    return result;
  }, [items, filter, searchQuery]);

  const newCount = items.filter(i => i.status === "new").length;
  const scannedCount = items.filter(i => i.status === "read" || i.scanned_file_path).length;

  return (
    <PageShell>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Inbox className="h-6 w-6 text-primary" />
              <h1 className="font-sans text-2xl font-bold text-foreground">Virtual Mailroom</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {items.length} Total</span>
              {newCount > 0 && <Badge>{newCount} new</Badge>}
              <span className="flex items-center gap-1"><Scan className="h-3.5 w-3.5" /> {scannedCount} Scanned</span>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <Card className="rounded-2xl border-border/50">
            <CardContent className="py-16 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No mail items yet. When mail arrives at your registered address, scanned copies will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT: Mail List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search mail…" className="pl-10 rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
                  <TabsTrigger value="new" className="flex-1 text-xs">New</TabsTrigger>
                  <TabsTrigger value="read" className="flex-1 text-xs">Read</TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1 text-xs">Archived</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedItem?.id === item.id
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-border/50 bg-background hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold truncate ${item.status === "new" ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.sender || "Unknown Sender"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{new Date(item.received_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-foreground truncate">{item.subject}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={`text-[10px] ${statusColors[item.status] || "bg-muted"}`}>{item.status}</Badge>
                      {/* Urgency badge based on subject keywords */}
                      {/urgent|asap|immediate|rush/i.test(item.subject || "") && (
                        <Badge className="text-[10px] bg-destructive/10 text-destructive">High</Badge>
                      )}
                      {/follow.?up|reminder|pending/i.test(item.subject || "") && !(/urgent|asap/i.test(item.subject || "")) && (
                        <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Medium</Badge>
                      )}
                      {/* Type badge based on sender/subject */}
                      {/law|legal|attorney|court|subpoena/i.test((item.sender || "") + " " + (item.subject || "")) && (
                        <Badge className="text-[10px] bg-primary/10 text-primary">Legal</Badge>
                      )}
                      {/invoice|payment|bill|receipt/i.test((item.sender || "") + " " + (item.subject || "")) && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Invoice</Badge>
                      )}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No items match your filter.</p>
                )}
              </div>
            </div>

            {/* RIGHT: Detail Panel */}
            <div className="lg:col-span-3 space-y-4">
              {selectedItem ? (
                <>
                  <Card className="rounded-2xl border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Mailroom / Processing / {selectedItem.id.slice(0, 8)}</p>
                          <h2 className="text-lg font-bold text-foreground mt-1">{selectedItem.subject}</h2>
                          <p className="text-sm text-muted-foreground">From: {selectedItem.sender || "Unknown"} · {new Date(selectedItem.received_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="text-xs" onClick={() => draftResponse(selectedItem)}>
                            <Send className="mr-1 h-3 w-3" /> Draft Response
                          </Button>
                        </div>
                      </div>

                      {/* Scanned preview area */}
                      <div className="rounded-xl border border-border/50 bg-muted/30 p-8 text-center mb-4">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">Physical Letter Scan</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedItem.scanned_file_path ? "Scan available" : "Simulated optical scan from"} {selectedItem.sender}
                        </p>
                        {selectedItem.scanned_file_path && (
                          <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => downloadScan(selectedItem)}>
                            <Download className="mr-1 h-3 w-3" /> View Full Scan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Intelligence Report */}
                  <Card className="rounded-2xl border-border/50">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> AI Intelligence Report
                      </h3>
                      {aiProcessing ? (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Analyzing document…</p>
                        </div>
                      ) : selectedItem.notes ? (
                        <div className="bg-muted/30 rounded-xl p-4">
                          <p className="text-sm text-foreground italic">"{selectedItem.notes}"</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full py-6 border-dashed rounded-xl text-sm"
                          onClick={() => aiSummarize(selectedItem)}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Run AI Summary
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Center */}
                  <Card className="rounded-2xl border-border/50">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-bold text-foreground mb-3">Action Center</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedItem.status === "new" && (
                          <Button variant="outline" className="text-xs justify-start" onClick={() => updateStatus(selectedItem.id, "read")}>
                            <Eye className="mr-2 h-3 w-3" /> Mark Read
                          </Button>
                        )}
                        <Button variant="outline" className="text-xs justify-start" onClick={() => updateStatus(selectedItem.id, "forwarded")}>
                          <Forward className="mr-2 h-3 w-3" /> Forward to Client
                        </Button>
                        {selectedItem.status !== "archived" && (
                          <Button variant="outline" className="text-xs justify-start text-destructive hover:text-destructive" onClick={() => updateStatus(selectedItem.id, "archived")}>
                            <Archive className="mr-2 h-3 w-3" /> Archive
                          </Button>
                        )}
                        {selectedItem.scanned_file_path && (
                          <Button variant="outline" className="text-xs justify-start" onClick={() => downloadScan(selectedItem)}>
                            <Download className="mr-2 h-3 w-3" /> Download Scan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="rounded-2xl border-border/50">
                  <CardContent className="py-16 text-center">
                    <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Select a mail item to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
