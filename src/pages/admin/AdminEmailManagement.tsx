import { usePageMeta } from "@/hooks/usePageMeta";
import { sanitizeHtml } from "@/lib/sanitize";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getEdgeFunctionHeaders } from "@/lib/edgeFunctionAuth";
import { Inbox, Users, Settings, CheckCircle, XCircle, Loader2, Mail, Save, RefreshCw, Zap, AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import AdminMailbox from "./AdminMailbox";
import AdminClientEmails from "./AdminClientEmails";
import AdminAutomatedEmails from "./AdminAutomatedEmails";

// ... keep existing code (EmailSettings function - lines 21-193)

function EmailSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [signatures, setSignatures] = useState<Record<string, any>[]>([]);
  const [sigLoading, setSigLoading] = useState(false);
  const [newSigName, setNewSigName] = useState("");
  const [newSigHtml, setNewSigHtml] = useState("");
  const [savingSig, setSavingSig] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus("idle");
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-correspondence`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dry_run: true }),
      });
      if (resp.ok) {
        setConnectionStatus("success");
        setStatusMessage("IONOS SMTP connection verified successfully.");
      } else {
        const data = await resp.json().catch(() => ({}));
        setConnectionStatus("error");
        setStatusMessage(data.error || "Connection failed.");
      }
    } catch {
      setConnectionStatus("error");
      setStatusMessage("Network error testing connection.");
    }
    setTesting(false);
  };

  const fetchSignatures = async () => {
    if (!user) return;
    setSigLoading(true);
    const { data } = await supabase.from("email_signatures").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSignatures(data || []);
    setSigLoading(false);
  };

  useEffect(() => { fetchSignatures(); }, [user]);

  const saveSignature = async () => {
    if (!user || !newSigName.trim()) return;
    setSavingSig(true);
    const sanitized = sanitizeHtml(newSigHtml);
    const { error } = await supabase.from("email_signatures").insert({ user_id: user.id, name: newSigName.trim(), signature_html: sanitized });
    if (error) toast({ title: "Error", description: "Failed to save signature", variant: "destructive" });
    else { toast({ title: "Saved", description: "Email signature saved." }); setNewSigName(""); setNewSigHtml(""); fetchSignatures(); }
    setSavingSig(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">IONOS SMTP Connection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={testing}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          {connectionStatus !== "idle" && (
            <div className={`flex items-center gap-2 text-sm ${connectionStatus === "success" ? "text-success" : "text-destructive"}`}>
              {connectionStatus === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Email Signatures</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Signature Name</Label><Input value={newSigName} onChange={e => setNewSigName(e.target.value)} placeholder="e.g., Default" /></div>
          </div>
          <div><Label>Signature HTML</Label><Textarea value={newSigHtml} onChange={e => setNewSigHtml(e.target.value)} rows={4} placeholder="<p>Best regards,<br/>Your Name</p>" /></div>
          <Button onClick={saveSignature} disabled={savingSig || !newSigName.trim()}>
            <Save className="mr-2 h-4 w-4" />{savingSig ? "Saving..." : "Save Signature"}
          </Button>
          {sigLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : signatures.length > 0 && (
            <div className="space-y-2 pt-2">
              {signatures.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded border p-3">
                  <div><span className="font-medium">{s.name}</span>{s.is_default && <Badge className="ml-2" variant="secondary">Default</Badge>}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** ADMIN-003: Dead Letter Queue monitoring tab */
function DLQViewer() {
  const { toast } = useToast();
  const [failures, setFailures] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFailures = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_send_log")
      .select("*")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(100);
    setFailures(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFailures(); }, []);

  const retryMessage = async (id: string, templateName: string, recipientEmail: string) => {
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-queue`, {
        method: "POST",
        headers,
        body: JSON.stringify({ retry_id: id }),
      });
      if (resp.ok) {
        toast({ title: "Retried", description: `Re-enqueued email to ${recipientEmail}` });
        fetchFailures();
      } else {
        toast({ title: "Retry failed", description: "Could not re-enqueue the message.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error during retry.", variant: "destructive" });
    }
  };

  const dismissMessage = async (id: string) => {
    await supabase.from("email_send_log").update({ status: "dismissed" }).eq("id", id);
    toast({ title: "Dismissed", description: "Failure acknowledged." });
    fetchFailures();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold">Failed Messages ({failures.length})</h3>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFailures}>
          <RefreshCw className="mr-2 h-4 w-4" />Refresh
        </Button>
      </div>

      {failures.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
          No failed messages. All emails delivered successfully.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {failures.map(f => (
            <Card key={f.id} className="border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                      <span className="text-sm font-medium">{f.template_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">To: {f.recipient_email}</p>
                    {f.error_message && (
                      <p className="text-xs text-destructive bg-destructive/5 rounded p-2 mt-1 font-mono">{f.error_message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => retryMessage(f.id, f.template_name, f.recipient_email)}>
                      <RotateCcw className="mr-1 h-3 w-3" />Retry
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => dismissMessage(f.id)}>
                      <Trash2 className="mr-1 h-3 w-3" />Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEmailManagement() {
  usePageMeta({ title: "Email Management", noIndex: true });
  const [dlqCount, setDlqCount] = useState(0);

  useEffect(() => {
    supabase.from("email_send_log").select("id", { count: "exact", head: true }).eq("status", "failed")
      .then(({ count }) => setDlqCount(count || 0));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-sans text-2xl font-bold text-foreground">Email Management</h1>
        <p className="text-sm text-muted-foreground">Manage your mailbox, client correspondence, and email settings</p>
      </div>

      <Tabs defaultValue="mailbox" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="mailbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />Mailbox
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />Client Emails
          </TabsTrigger>
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />Automated
          </TabsTrigger>
          <TabsTrigger value="dlq" className="flex items-center gap-2 relative">
            <AlertTriangle className="h-4 w-4" />Failed
            {dlqCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{dlqCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mailbox" className="mt-4"><AdminMailbox /></TabsContent>
        <TabsContent value="clients" className="mt-4"><AdminClientEmails /></TabsContent>
        <TabsContent value="automated" className="mt-4"><AdminAutomatedEmails /></TabsContent>
        <TabsContent value="dlq" className="mt-4"><DLQViewer /></TabsContent>
        <TabsContent value="settings" className="mt-4"><EmailSettings /></TabsContent>
      </Tabs>
    </div>
  );
}