import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctionAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Send, CheckCircle, Archive, Loader2, Eye, Reply, Search } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  replied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  forwarded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  archived: "bg-muted text-muted-foreground",
};

export default function AdminEmailManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyForm, setReplyForm] = useState({ to_address: "", subject: "", body: "" });
  const [sendingReply, setSendingReply] = useState(false);
  const [newItem, setNewItem] = useState({
    client_id: "",
    direction: "inbound",
    subject: "",
    body: "",
    from_address: "",
    to_address: "",
  });

  const fetchData = async () => {
    const [{ data: corr }, { data: profs }] = await Promise.all([
      supabase.from("client_correspondence").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    if (corr) setItems(corr);
    if (profs) setProfiles(profs);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getClientName = (clientId: string) => {
    const p = profiles.find((p) => p.user_id === clientId);
    return p?.full_name || p?.email || clientId.slice(0, 8);
  };

  const getClientEmail = (clientId: string) => {
    const p = profiles.find((p) => p.user_id === clientId);
    return p?.email || "";
  };

  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return item.subject.toLowerCase().includes(term) ||
        item.body.toLowerCase().includes(term) ||
        getClientName(item.client_id).toLowerCase().includes(term);
    }
    return true;
  });

  const createItem = async () => {
    if (!newItem.client_id || !newItem.subject || !newItem.body || !user) return;
    setSaving(true);
    const { error } = await supabase.from("client_correspondence").insert({
      ...newItem,
      handled_by: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Correspondence logged" });
      setShowCreate(false);
      setNewItem({ client_id: "", direction: "inbound", subject: "", body: "", from_address: "", to_address: "" });
      fetchData();
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("client_correspondence").update({
      status,
      handled_by: user?.id,
      handled_at: new Date().toISOString(),
    } as any).eq("id", id);
    toast({ title: `Status → ${status}` });
    fetchData();
    if (showDetail?.id === id) setShowDetail({ ...showDetail, status });
  };

  const addNote = async (id: string, note: string) => {
    if (!note.trim()) return;
    await supabase.from("client_correspondence").update({
      notes: note,
      handled_by: user?.id,
      handled_at: new Date().toISOString(),
    } as any).eq("id", id);
    toast({ title: "Note saved" });
    setReplyText("");
    fetchData();
  };

  const openReplyDialog = (item: any) => {
    const clientEmail = getClientEmail(item.client_id);
    setReplyForm({
      to_address: item.from_address || clientEmail,
      subject: `Re: ${item.subject}`,
      body: "",
    });
    setShowReplyDialog(true);
  };

  const sendReply = async () => {
    if (!replyForm.to_address || !replyForm.subject || !replyForm.body || !showDetail) return;
    setSendingReply(true);
    try {
      const resp = await callEdgeFunction("send-correspondence", {
        to_address: replyForm.to_address,
        subject: replyForm.subject,
        body: replyForm.body,
        client_id: showDetail.client_id,
        reply_to_id: showDetail.id,
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      toast({
        title: result.email_sent ? "Reply sent" : "Reply logged",
        description: result.email_sent ? "Email delivered successfully." : "Logged but email not sent (Resend not configured).",
      });
      setShowReplyDialog(false);
      setReplyForm({ to_address: "", subject: "", body: "" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    }
    setSendingReply(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Email & Correspondence Management</h1>
          <p className="text-sm text-muted-foreground">Manage client correspondence, send replies, and track forwarding</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="">
          <Plus className="mr-1 h-4 w-4" /> Log Correspondence
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search correspondence..." className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="forwarded">Forwarded</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pending", count: items.filter(i => i.status === "pending").length },
          { label: "In Progress", count: items.filter(i => i.status === "in_progress").length },
          { label: "Replied", count: items.filter(i => i.status === "replied").length },
          { label: "Total", count: items.length },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">No correspondence found</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="border-border/50">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setShowDetail(item); setReplyText(item.notes || ""); }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {item.direction === "inbound" ? <Mail className="h-5 w-5 text-primary" /> : <Send className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.direction === "inbound" ? "From" : "To"}: {item.from_address || item.to_address || getClientName(item.client_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[item.status] || "bg-muted"}>{item.status.replace(/_/g, " ")}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => { setShowDetail(item); setReplyText(item.notes || ""); }}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  {item.status !== "replied" && item.status !== "archived" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(item.id, "replied")}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Mark Replied
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans">Correspondence Detail</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{getClientName(showDetail.client_id)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Direction</span><span className="font-medium capitalize">{showDetail.direction}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium">{showDetail.subject}</span></div>
                {showDetail.from_address && <div className="flex justify-between"><span className="text-muted-foreground">From</span><span className="font-medium">{showDetail.from_address}</span></div>}
                {showDetail.to_address && <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-medium">{showDetail.to_address}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[showDetail.status]}>{showDetail.status.replace(/_/g, " ")}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(showDetail.created_at).toLocaleString()}</span></div>
              </div>
              <div>
                <Label>Body</Label>
                <div className="mt-1 rounded-lg border border-border/50 bg-background p-3 text-sm whitespace-pre-wrap">{showDetail.body}</div>
              </div>
              <div>
                <Label>Admin Notes</Label>
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Notes about how this was handled..." />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => addNote(showDetail.id, replyText)} className="">Save Notes</Button>
                <Button size="sm" variant="default" onClick={() => openReplyDialog(showDetail)}>
                  <Send className="mr-1 h-3 w-3" /> Send Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(showDetail.id, "forwarded")}>Mark Forwarded</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(showDetail.id, "archived")}>
                  <Archive className="mr-1 h-3 w-3" /> Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Send Reply Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>To</Label><Input value={replyForm.to_address} onChange={(e) => setReplyForm({ ...replyForm, to_address: e.target.value })} /></div>
            <div><Label>Subject</Label><Input value={replyForm.subject} onChange={(e) => setReplyForm({ ...replyForm, subject: e.target.value })} /></div>
            <div><Label>Body</Label><RichTextEditor value={replyForm.body} onChange={(html) => setReplyForm({ ...replyForm, body: html })} placeholder="Type your reply..." className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>Cancel</Button>
            <Button onClick={sendReply} disabled={sendingReply || !replyForm.body.trim()} className="">
              {sendingReply ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Log Correspondence
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client *</Label>
              <Select value={newItem.client_id} onValueChange={(v) => setNewItem({ ...newItem, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={newItem.direction} onValueChange={(v) => setNewItem({ ...newItem, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound (received)</SelectItem>
                  <SelectItem value="outbound">Outbound (sent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From</Label><Input value={newItem.from_address} onChange={(e) => setNewItem({ ...newItem, from_address: e.target.value })} placeholder="sender@email.com" /></div>
              <div><Label>To</Label><Input value={newItem.to_address} onChange={(e) => setNewItem({ ...newItem, to_address: e.target.value })} placeholder="recipient@email.com" /></div>
            </div>
            <div><Label>Subject *</Label><Input value={newItem.subject} onChange={(e) => setNewItem({ ...newItem, subject: e.target.value })} placeholder="Email subject line" /></div>
            <div><Label>Body *</Label><RichTextEditor value={newItem.body} onChange={(html) => setNewItem({ ...newItem, body: html })} placeholder="Full email content..." className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createItem} disabled={saving} className="">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
