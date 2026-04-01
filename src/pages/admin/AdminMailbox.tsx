import { useEffect, useState, useCallback } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctionAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Send, Archive, Loader2, Reply, Search, Star,
  Inbox, FileText, Trash2, PenLine, RefreshCw, MailOpen,
  ChevronLeft, Forward, ReplyAll, CheckSquare, Square, Paperclip,
  Settings
} from "lucide-react";

type EmailItem = {
  id: string;
  message_id: string;
  folder: string;
  from_address: string | null;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses?: string[];
  subject: string | null;
  body_html?: string;
  body_text?: string;
  date: string | null;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  attachments?: any[];
  in_reply_to?: string;
  references?: string;
};

const FOLDERS = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: PenLine },
  { key: "starred", label: "Starred", icon: Star },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "trash", label: "Trash", icon: Trash2 },
];

export default function AdminMailbox() {
  usePageTitle("Mailbox");
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeFolder, setActiveFolder] = useState("inbox");
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "replyAll" | "forward">("new");
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeInReplyTo, setComposeInReplyTo] = useState("");
  const [sending, setSending] = useState(false);

  const [signatures, setSignatures] = useState<any[]>([]);
  const [showSignatures, setShowSignatures] = useState(false);
  const [sigName, setSigName] = useState("");
  const [sigHtml, setSigHtml] = useState("");
  const [editingSigId, setEditingSigId] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<any[]>([]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await callEdgeFunction("ionos-email", {
        action: activeFolder === "starred" ? "search" : "list",
        folder: activeFolder === "starred" ? undefined : activeFolder,
        search: searchTerm || undefined,
        limit: 50,
      });
      const data = await resp.json();
      if (data.error) {
        let query = supabase
          .from("email_cache")
          .select("*")
          .order("date", { ascending: false })
          .limit(50);
        if (activeFolder === "starred") {
          query = query.eq("is_starred", true);
        } else {
          query = query.eq("folder", activeFolder);
        }
        if (searchTerm) {
          query = query.or(`subject.ilike.%${searchTerm}%,from_address.ilike.%${searchTerm}%`);
        }
        const { data: cached } = await query;
        setEmails((cached || []) as unknown as EmailItem[]);
      } else {
        setEmails(data.emails || []);
      }
    } catch {
      const { data: cached } = await supabase
        .from("email_cache")
        .select("*")
        .eq("folder", activeFolder === "starred" ? "inbox" : activeFolder)
        .order("date", { ascending: false })
        .limit(50);
      setEmails((cached || []) as unknown as EmailItem[]);
    }
    setLoading(false);
  }, [activeFolder, searchTerm]);

  const fetchFolderCounts = useCallback(async () => {
    try {
      const resp = await callEdgeFunction("ionos-email", { action: "folders" });
      const data = await resp.json();
      if (data.unreadCounts) setUnreadCounts(data.unreadCounts);
    } catch {
      for (const f of FOLDERS) {
        const { count } = await supabase
          .from("email_cache")
          .select("id", { count: "exact", head: true })
          .eq("folder", f.key)
          .eq("is_read", false);
        setUnreadCounts(prev => ({ ...prev, [f.key]: count || 0 }));
      }
    }
  }, []);

  const fetchSignatures = async () => {
    if (!user) return;
    const { data } = await supabase.from("email_signatures").select("*").eq("user_id", user.id).order("created_at");
    if (data) setSignatures(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, email");
    if (data) setProfiles(data);
  };

  useEffect(() => { fetchEmails(); }, [fetchEmails]);
  useEffect(() => { fetchFolderCounts(); fetchSignatures(); fetchProfiles(); }, []);
  useEffect(() => {
    const interval = setInterval(() => { fetchEmails(); fetchFolderCounts(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchEmails, fetchFolderCounts]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const resp = await callEdgeFunction("ionos-email-sync", {});
      const data = await resp.json();
      toast({ title: "Sync complete", description: data.message || "Emails synced" });
      fetchEmails();
      fetchFolderCounts();
    } catch (e: any) {
      toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    }
    setSyncing(false);
  };

  const handleSelectEmail = async (email: EmailItem) => {
    setSelectedEmail(email);
    if (!email.body_html && !email.body_text) {
      try {
        const resp = await callEdgeFunction("ionos-email", { action: "read", id: email.id });
        const full = await resp.json();
        if (!full.error) {
          setSelectedEmail(full);
          setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
        }
      } catch {}
    } else if (!email.is_read) {
      callEdgeFunction("ionos-email", { action: "mark_read", id: email.id }).catch(() => {});
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
    }
  };

  const handleStarToggle = async (email: EmailItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = email.is_starred ? "unstar" : "star";
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, is_starred: !em.is_starred } : em));
    try { await callEdgeFunction("ionos-email", { action, id: email.id }); } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await callEdgeFunction("ionos-email", { action: "delete", id });
      setEmails(prev => prev.filter(e => e.id !== id));
      if (selectedEmail?.id === id) setSelectedEmail(null);
      toast({ title: "Email moved to trash" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await callEdgeFunction("ionos-email", { action: "move", id, folder: "archive" });
      setEmails(prev => prev.filter(e => e.id !== id));
      if (selectedEmail?.id === id) setSelectedEmail(null);
      toast({ title: "Email archived" });
    } catch (e: any) {
      toast({ title: "Archive failed", description: e.message, variant: "destructive" });
    }
  };

  const handleBulkAction = async (bulkAction: string) => {
    if (selectedIds.size === 0) return;
    try {
      await callEdgeFunction("ionos-email", { action: "bulk_action", ids: Array.from(selectedIds), bulkAction });
      setSelectedIds(new Set());
      fetchEmails();
      toast({ title: `Bulk action: ${bulkAction}` });
    } catch (e: any) {
      toast({ title: "Bulk action failed", description: e.message, variant: "destructive" });
    }
  };

  const openCompose = (mode: "new" | "reply" | "replyAll" | "forward" = "new", email?: EmailItem) => {
    setComposeMode(mode);
    if (mode === "new") {
      setComposeTo(""); setComposeCc(""); setComposeSubject(""); setComposeBody(""); setComposeInReplyTo("");
    } else if (email) {
      if (mode === "reply") {
        setComposeTo(email.from_address || "");
        setComposeCc("");
        setComposeSubject(`Re: ${(email.subject || "").replace(/^Re:\s*/i, "")}`);
        setComposeInReplyTo(email.message_id);
      } else if (mode === "replyAll") {
        setComposeTo(email.from_address || "");
        setComposeCc((email.to_addresses || []).join(", "));
        setComposeSubject(`Re: ${(email.subject || "").replace(/^Re:\s*/i, "")}`);
        setComposeInReplyTo(email.message_id);
      } else if (mode === "forward") {
        setComposeTo(""); setComposeCc("");
        setComposeSubject(`Fwd: ${(email.subject || "").replace(/^Fwd:\s*/i, "")}`);
        setComposeBody(`<br/><br/>---------- Forwarded message ----------<br/>From: ${email.from_address}<br/>Date: ${email.date ? new Date(email.date).toLocaleString() : ""}<br/>Subject: ${email.subject}<br/><br/>${email.body_html || email.body_text || ""}`);
        setComposeInReplyTo("");
      }
      const defaultSig = signatures.find(s => s.is_default);
      if (defaultSig && mode !== "forward") {
        setComposeBody(`<br/><br/>${defaultSig.signature_html}`);
      }
    }
    setShowCompose(true);
  };

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ title: "Missing required fields", description: "To and Subject are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const resp = await callEdgeFunction("ionos-email", {
        action: "send", to: composeTo.trim(), cc: composeCc.trim() || undefined,
        subject: composeSubject, html: composeBody || "<p></p>", inReplyTo: composeInReplyTo || undefined,
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Email sent successfully" });
      setShowCompose(false);
      if (activeFolder === "sent") fetchEmails();
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      await supabase.from("email_drafts").insert({
        user_id: user.id, to_addresses: composeTo ? [composeTo] : [], cc_addresses: composeCc ? [composeCc] : [],
        subject: composeSubject, body_html: composeBody, in_reply_to: composeInReplyTo || null,
      } as any);
      toast({ title: "Draft saved" });
      setShowCompose(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveSignature = async () => {
    if (!user || !sigName.trim()) return;
    if (editingSigId) {
      await supabase.from("email_signatures").update({ name: sigName, signature_html: sigHtml } as any).eq("id", editingSigId);
    } else {
      await supabase.from("email_signatures").insert({
        user_id: user.id, name: sigName, signature_html: sigHtml, is_default: signatures.length === 0,
      } as any);
    }
    setSigName(""); setSigHtml(""); setEditingSigId(null);
    fetchSignatures();
    toast({ title: "Signature saved" });
  };

  const handleSetDefaultSig = async (id: string) => {
    if (!user) return;
    await supabase.from("email_signatures").update({ is_default: false } as any).eq("user_id", user.id);
    await supabase.from("email_signatures").update({ is_default: true } as any).eq("id", id);
    fetchSignatures();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === emails.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(emails.map(e => e.id)));
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading && emails.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-sans text-lg font-semibold text-foreground">shane@notardex.com</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Live mailbox — send, receive, and manage email</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sync
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSignatures(true)}>
            <Settings className="mr-1 h-4 w-4" /> Signatures
          </Button>
          <Button size="sm" onClick={() => openCompose("new")}>
            <PenLine className="mr-1 h-4 w-4" /> Compose
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 gap-0 overflow-hidden rounded-lg border border-border">
        {/* Folder Sidebar */}
        <div className="w-48 shrink-0 border-r border-border bg-muted/30 p-3">
          <div className="space-y-1">
            {FOLDERS.map(f => {
              const Icon = f.icon;
              const count = unreadCounts[f.key] || 0;
              const isActive = activeFolder === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => { setActiveFolder(f.key); setSelectedEmail(null); setSelectedIds(new Set()); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{f.label}</span>
                  {count > 0 && f.key !== "drafts" && (
                    <Badge variant="secondary" className="h-5 min-w-[20px] justify-center px-1 text-xs">{count}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email List */}
        <div className={`flex flex-col ${selectedEmail ? "w-[340px] shrink-0" : "flex-1"} border-r border-border`}>
          <div className="border-b border-border p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search emails..." className="pl-9 h-8 text-sm" />
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{selectedIds.size} selected</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleBulkAction("mark_read")}><MailOpen className="mr-1 h-3 w-3" /> Read</Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleBulkAction("archive")}><Archive className="mr-1 h-3 w-3" /> Archive</Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => handleBulkAction("delete")}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Mail className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No emails in {activeFolder}</p>
              </div>
            ) : (
              <div>
                <button onClick={toggleSelectAll} className="flex w-full items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50">
                  {selectedIds.size === emails.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                  Select all
                </button>
                {emails.map(email => (
                  <button
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`flex w-full items-start gap-2 border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                      selectedEmail?.id === email.id ? "bg-primary/5" : ""
                    } ${!email.is_read ? "bg-primary/[0.02]" : ""}`}
                  >
                    <div className="flex shrink-0 items-center gap-1.5 pt-0.5" onClick={e => toggleSelect(email.id, e)}>
                      {selectedIds.has(email.id) ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <button onClick={e => handleStarToggle(email, e)} className="shrink-0 pt-0.5">
                      {email.is_starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <Star className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-amber-400" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${!email.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                          {email.from_name || email.from_address || "Unknown"}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(email.date)}</span>
                      </div>
                      <p className={`truncate text-sm ${!email.is_read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {email.subject || "(no subject)"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {email.has_attachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                        {!email.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Email Reader */}
        {selectedEmail && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openCompose("reply", selectedEmail)} title="Reply"><Reply className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openCompose("replyAll", selectedEmail)} title="Reply All"><ReplyAll className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openCompose("forward", selectedEmail)} title="Forward"><Forward className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleArchive(selectedEmail.id)} title="Archive"><Archive className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedEmail.id)} title="Delete" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{selectedEmail.subject || "(no subject)"}</h2>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-12">From</span>
                  <span className="font-medium text-foreground">{selectedEmail.from_name || selectedEmail.from_address}</span>
                  {selectedEmail.from_name && <span className="text-muted-foreground">&lt;{selectedEmail.from_address}&gt;</span>}
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-12">To</span>
                  <span className="text-foreground">{(selectedEmail.to_addresses || []).join(", ")}</span>
                </div>
                {selectedEmail.cc_addresses && selectedEmail.cc_addresses.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-12">CC</span>
                    <span className="text-foreground">{selectedEmail.cc_addresses.join(", ")}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-12">Date</span>
                  <span className="text-foreground">{selectedEmail.date ? new Date(selectedEmail.date).toLocaleString() : ""}</span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {selectedEmail.body_html ? (
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">{selectedEmail.body_text || "No content"}</pre>
              )}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <Paperclip className="h-4 w-4" /> {selectedEmail.attachments.length} Attachment{selectedEmail.attachments.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{att.filename || `Attachment ${i + 1}`}</span>
                        {att.size && <span className="text-xs text-muted-foreground">({(att.size / 1024).toFixed(0)} KB)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {!selectedEmail && emails.length > 0 && (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              {composeMode === "new" ? "New Email" : composeMode === "reply" ? "Reply" : composeMode === "replyAll" ? "Reply All" : "Forward"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>To *</Label>
              <Input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@email.com" list="email-suggestions" />
              <datalist id="email-suggestions">
                {profiles.filter(p => p.email).map(p => (
                  <option key={p.user_id} value={p.email}>{p.full_name}</option>
                ))}
              </datalist>
            </div>
            <div><Label>CC</Label><Input value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder="cc@email.com" /></div>
            <div><Label>Subject *</Label><Input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Email subject" /></div>
            <div>
              <Label>Body</Label>
              <RichTextEditor value={composeBody} onChange={setComposeBody} placeholder="Write your email..." minHeight="200px" className="mt-1" />
            </div>
            {signatures.length > 0 && (
              <div>
                <Label>Signature</Label>
                <Select onValueChange={id => {
                  const sig = signatures.find(s => s.id === id);
                  if (sig) setComposeBody(prev => prev + `<br/><br/>${sig.signature_html}`);
                }}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Insert signature..." /></SelectTrigger>
                  <SelectContent>
                    {signatures.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}{s.is_default ? " ★" : ""}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Discard</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signatures Dialog */}
      <Dialog open={showSignatures} onOpenChange={setShowSignatures}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-sans">Email Signatures</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {signatures.map(sig => (
              <Card key={sig.id} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{sig.name}</span>
                      {sig.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    <div className="flex gap-1">
                      {!sig.is_default && <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleSetDefaultSig(sig.id)}>Set Default</Button>}
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setEditingSigId(sig.id); setSigName(sig.name); setSigHtml(sig.signature_html); }}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={async () => { await supabase.from("email_signatures").delete().eq("id", sig.id); fetchSignatures(); }}>Delete</Button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs" dangerouslySetInnerHTML={{ __html: sig.signature_html }} />
                </CardContent>
              </Card>
            ))}
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{editingSigId ? "Edit Signature" : "New Signature"}</h4>
              <div><Label>Name</Label><Input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="e.g., Professional" /></div>
              <div><Label>Signature Content</Label><RichTextEditor value={sigHtml} onChange={setSigHtml} placeholder="Your email signature..." minHeight="100px" className="mt-1" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSignature} disabled={!sigName.trim()}>{editingSigId ? "Update" : "Create"} Signature</Button>
                {editingSigId && <Button variant="outline" size="sm" onClick={() => { setEditingSigId(null); setSigName(""); setSigHtml(""); }}>Cancel</Button>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
