import { usePageTitle } from "@/lib/usePageTitle";
import { useState } from "react";
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
import { Inbox, Users, Settings, CheckCircle, XCircle, Loader2, Mail, Save, RefreshCw } from "lucide-react";
import AdminMailbox from "./AdminMailbox";
import AdminClientEmails from "./AdminClientEmails";

function EmailSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Signature management
  const [signatures, setSignatures] = useState<any[]>([]);
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
        setStatusMessage(typeof data.error === "object" ? JSON.stringify(data.error) : (data.error || `HTTP ${resp.status}`));
      }
    } catch (e: any) {
      setConnectionStatus("error");
      setStatusMessage(e.message);
    }
    setTesting(false);
  };

  const loadSignatures = async () => {
    if (!user) return;
    setSigLoading(true);
    const { data } = await supabase.from("email_signatures").select("*").eq("user_id", user.id).order("created_at");
    if (data) setSignatures(data);
    setSigLoading(false);
  };

  const saveSignature = async () => {
    if (!user || !newSigName.trim()) return;
    setSavingSig(true);
    const { error } = await supabase.from("email_signatures").insert({
      user_id: user.id,
      name: newSigName.trim(),
      signature_html: newSigHtml,
      is_default: signatures.length === 0,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Signature saved" });
      setNewSigName("");
      setNewSigHtml("");
      loadSignatures();
    }
    setSavingSig(false);
  };

  const deleteSignature = async (id: string) => {
    await supabase.from("email_signatures").delete().eq("id", id);
    setSignatures(prev => prev.filter(s => s.id !== id));
    toast({ title: "Signature deleted" });
  };

  const setDefaultSignature = async (id: string) => {
    if (!user) return;
    await supabase.from("email_signatures").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("email_signatures").update({ is_default: true }).eq("id", id);
    setSignatures(prev => prev.map(s => ({ ...s, is_default: s.id === id })));
    toast({ title: "Default signature updated" });
  };

  // Load signatures on mount
  useState(() => { loadSignatures(); });

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">IONOS Email (shane@notardex.com)</p>
              <p className="text-xs text-muted-foreground">SMTP/IMAP connection for sending and receiving email</p>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === "success" && <Badge className="bg-primary/10 text-primary"><CheckCircle className="mr-1 h-3 w-3" /> Connected</Badge>}
              {connectionStatus === "error" && <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Error</Badge>}
              <Button variant="outline" size="sm" onClick={testConnection} disabled={testing}>
                {testing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                Test Connection
              </Button>
            </div>
          </div>
          {statusMessage && (
            <p className={`text-xs ${connectionStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {statusMessage}
            </p>
          )}

          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Connection Details</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">SMTP Host:</span> smtp.ionos.com</div>
              <div><span className="text-muted-foreground">SMTP Port:</span> 587 (TLS)</div>
              <div><span className="text-muted-foreground">IMAP Host:</span> imap.ionos.com</div>
              <div><span className="text-muted-foreground">IMAP Port:</span> 993 (SSL)</div>
              <div><span className="text-muted-foreground">Email:</span> shane@notardex.com</div>
              <div><span className="text-muted-foreground">Status:</span> Credentials configured in backend</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Signatures */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Email Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sigLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {signatures.map(sig => (
                <div key={sig.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{sig.name}</span>
                      {sig.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                    </div>
                    <div className="flex gap-1">
                      {!sig.is_default && (
                        <Button size="sm" variant="ghost" onClick={() => setDefaultSignature(sig.id)}>Set Default</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSignature(sig.id)}>Delete</Button>
                    </div>
                  </div>
                  {sig.signature_html && (
                    <div className="text-xs text-muted-foreground border-t border-border/50 pt-2" dangerouslySetInnerHTML={{ __html: sig.signature_html }} />
                  )}
                </div>
              ))}

              <div className="space-y-3 border-t border-border/50 pt-4">
                <Label className="text-sm font-medium">Add New Signature</Label>
                <Input placeholder="Signature name" value={newSigName} onChange={e => setNewSigName(e.target.value)} />
                <Textarea placeholder="Signature HTML (e.g. <p>Best regards,<br/>Shane Goble</p>)" value={newSigHtml} onChange={e => setNewSigHtml(e.target.value)} rows={4} />
                <Button size="sm" onClick={saveSignature} disabled={savingSig || !newSigName.trim()}>
                  {savingSig ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                  Save Signature
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminEmailManagement() {
  usePageTitle("Email Management");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-sans text-2xl font-bold text-foreground">Email Management</h1>
        <p className="text-sm text-muted-foreground">Manage your mailbox, client correspondence, and email settings</p>
      </div>

      <Tabs defaultValue="mailbox" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="mailbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Mailbox
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Emails
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mailbox" className="mt-4">
          <AdminMailbox />
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <AdminClientEmails />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <EmailSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}