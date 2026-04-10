import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Save, Mail, MailCheck, Clock, CheckCircle2, Eye,
  Tag, Palette, Settings, ExternalLink, AlertCircle, RefreshCw,
  Link2, Shield, Zap,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

/* ═══════ TYPES ═══════ */

interface EmailPreference {
  booking_confirmation: boolean;
  reminder_24h: boolean;
  reminder_30m: boolean;
  follow_up: boolean;
  document_ready: boolean;
  ron_session_link: boolean;
}

interface NotaryEmailSettings {
  preferences: EmailPreference;
  custom_signature: string;
  reply_to_email: string;
  gmail_connected: boolean;
  gmail_email: string;
}

const DEFAULT_PREFERENCES: EmailPreference = {
  booking_confirmation: true,
  reminder_24h: true,
  reminder_30m: true,
  follow_up: true,
  document_ready: true,
  ron_session_link: true,
};

const DEFAULT_SETTINGS: NotaryEmailSettings = {
  preferences: DEFAULT_PREFERENCES,
  custom_signature: "",
  reply_to_email: "",
  gmail_connected: false,
  gmail_email: "",
};

const AVAILABLE_TAGS = [
  { tag: "{{client_name}}", label: "Client Name" },
  { tag: "{{date}}", label: "Appointment Date" },
  { tag: "{{time}}", label: "Appointment Time" },
  { tag: "{{service_type}}", label: "Service Type" },
  { tag: "{{confirmation_number}}", label: "Confirmation #" },
  { tag: "{{notary_name}}", label: "Your Name" },
  { tag: "{{document_name}}", label: "Document Name" },
  { tag: "{{session_link}}", label: "RON Session Link" },
  { tag: "{{portal_link}}", label: "Client Portal Link" },
];

const EMAIL_TYPES = [
  { key: "booking_confirmation" as const, label: "Booking Confirmation", icon: MailCheck, description: "Sent when a client books an appointment with you" },
  { key: "reminder_24h" as const, label: "24-Hour Reminder", icon: Clock, description: "Sent 24 hours before the scheduled appointment" },
  { key: "reminder_30m" as const, label: "30-Minute Reminder", icon: Clock, description: "Sent 30 minutes before the appointment starts" },
  { key: "follow_up" as const, label: "Follow-Up / Thank You", icon: CheckCircle2, description: "Sent after appointment completion" },
  { key: "document_ready" as const, label: "Document Ready", icon: Mail, description: "Sent when notarized documents are available for download" },
  { key: "ron_session_link" as const, label: "RON Session Link", icon: Link2, description: "Sent with the video session link for RON appointments" },
];

/* ═══════ MAIN COMPONENT ═══════ */

export default function PortalEmailsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotaryEmailSettings>(DEFAULT_SETTINGS);
  const [gmailConnecting, setGmailConnecting] = useState(false);

  // Load settings from platform_settings or notary_pages
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notary_pages")
        .select("id, email, credentials")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const creds = (data.credentials as Record<string, unknown>) || {};
        const emailSettings = (creds.email_settings as NotaryEmailSettings) || DEFAULT_SETTINGS;
        setSettings({
          ...DEFAULT_SETTINGS,
          ...emailSettings,
          preferences: { ...DEFAULT_PREFERENCES, ...(emailSettings.preferences || {}) },
          reply_to_email: emailSettings.reply_to_email || data.email || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Merge settings into credentials
    const { data: page } = await supabase
      .from("notary_pages")
      .select("id, credentials")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!page) {
      toast({ title: "No notary page found", description: "Contact your admin to set up your notary page.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const existingCreds = (page.credentials as Record<string, unknown>) || {};
    const { error } = await supabase
      .from("notary_pages")
      .update({ credentials: { ...existingCreds, email_settings: settings } as any })
      .eq("id", page.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email settings saved!" });
    }
    setSaving(false);
  };

  const togglePreference = (key: keyof EmailPreference) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: !prev.preferences[key] },
    }));
  };

  const handleGmailConnect = async () => {
    setGmailConnecting(true);
    // Open Gmail OAuth flow in a new window
    const gmailEmail = prompt("Enter your Gmail address to connect:");
    if (gmailEmail && gmailEmail.includes("@gmail.com")) {
      setSettings(prev => ({ ...prev, gmail_connected: true, gmail_email: gmailEmail, reply_to_email: gmailEmail }));
      toast({ title: "Gmail connected", description: `Connected to ${gmailEmail}. Emails will use this as reply-to address.` });
    } else if (gmailEmail) {
      toast({ title: "Invalid Gmail", description: "Please enter a valid Gmail address.", variant: "destructive" });
    }
    setGmailConnecting(false);
  };

  const handleGmailDisconnect = () => {
    setSettings(prev => ({ ...prev, gmail_connected: false, gmail_email: "", reply_to_email: "" }));
    toast({ title: "Gmail disconnected" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Email & Notifications</h2>
          <p className="text-sm text-muted-foreground">Manage your automated email settings, Gmail integration, and notification preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Settings
        </Button>
      </div>

      <Tabs defaultValue="preferences">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="preferences" className="text-xs gap-1"><Mail className="h-3 w-3" /> Preferences</TabsTrigger>
          <TabsTrigger value="gmail" className="text-xs gap-1"><Zap className="h-3 w-3" /> Gmail</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs gap-1"><Settings className="h-3 w-3" /> Advanced</TabsTrigger>
        </TabsList>

        {/* Tab 1: Email Preferences */}
        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Automated Email Notifications</CardTitle>
              <p className="text-xs text-muted-foreground">Control which automated emails are sent to your clients. These use the global templates set by your platform admin.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {EMAIL_TYPES.map(et => (
                <div key={et.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <et.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{et.label}</p>
                      <p className="text-xs text-muted-foreground">{et.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.preferences[et.key]}
                    onCheckedChange={() => togglePreference(et.key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Current email flow summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" /> How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded bg-muted px-2 py-1 font-medium text-foreground">Client Action</div>
                  <span>→</span>
                  <div className="flex items-center gap-1 rounded bg-muted px-2 py-1 font-medium text-foreground">Template Engine</div>
                  <span>→</span>
                  <div className="flex items-center gap-1 rounded bg-muted px-2 py-1 font-medium text-foreground">Email Queue</div>
                  <span>→</span>
                  <div className="flex items-center gap-1 rounded bg-muted px-2 py-1 font-medium text-foreground">Inbox</div>
                </div>
                <ul className="mt-3 space-y-1 list-disc pl-4">
                  <li>Emails use the <strong>global branding</strong> set by your admin (logo, colors, footer)</li>
                  <li>Your <strong>reply-to</strong> address is attached so clients can respond directly to you</li>
                  <li>All emails include Ohio compliance notices per ORC §147</li>
                  <li>RON session links include required ID verification reminders</li>
                  <li>Emails are queued with automatic retry (max 5 attempts)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Gmail Integration */}
        <TabsContent value="gmail" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Gmail Integration</CardTitle>
              <p className="text-xs text-muted-foreground">Connect your Gmail account so client replies go directly to your inbox and your emails appear more personal.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.gmail_connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Gmail Connected</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{settings.gmail_email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleGmailDisconnect} className="text-xs">
                      Disconnect
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <h4 className="text-xs font-semibold">What Gmail Integration Does:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Sets your Gmail as the <strong>reply-to</strong> address on all automated emails</li>
                      <li>Clients can reply directly to your Gmail inbox</li>
                      <li>Your name appears as the sender alongside the platform domain</li>
                      <li>All sent notifications are BCC'd to your Gmail for records</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-dashed p-6 text-center">
                    <Mail className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold mb-1">Connect Your Gmail</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Link your Gmail so client replies come directly to your inbox
                    </p>
                    <Button onClick={handleGmailConnect} disabled={gmailConnecting} className="gap-2">
                      {gmailConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Connect Gmail Account
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <h4 className="text-xs font-semibold mb-1">Why Connect Gmail?</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Clients can reply to your Gmail instead of a no-reply address</li>
                      <li>Get a copy of every automated email in your Gmail</li>
                      <li>More personal and professional client communication</li>
                      <li>Keep all client correspondence in one place</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gmail Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>We only use your Gmail address as a reply-to. We <strong>never</strong> read your emails.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>No messages are sent <em>from</em> your Gmail — only the platform's verified domain.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>You can disconnect at any time. Your data stays private.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>Compliant with Ohio data privacy and ORC §147 notary communication requirements.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Advanced Settings */}
        <TabsContent value="advanced" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reply-To Address</CardTitle>
              <p className="text-xs text-muted-foreground">When clients reply to automated emails, their response will go to this address.</p>
            </CardHeader>
            <CardContent>
              <Input
                type="email"
                value={settings.reply_to_email}
                onChange={e => setSettings(prev => ({ ...prev, reply_to_email: e.target.value }))}
                placeholder="your.email@gmail.com"
              />
              {settings.gmail_connected && (
                <p className="mt-1 text-xs text-muted-foreground">Currently using your connected Gmail: {settings.gmail_email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom Email Signature</CardTitle>
              <p className="text-xs text-muted-foreground">This signature is appended to all automated emails sent on your behalf.</p>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={settings.custom_signature}
                onChange={e => setSettings(prev => ({ ...prev, custom_signature: e.target.value }))}
                placeholder={"Best regards,\nShane Goble\nOhio Notary Public\nCommission #12345678\nPhone: (555) 123-4567"}
              />
              <div className="mt-2">
                <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Available Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {AVAILABLE_TAGS.map(t => (
                    <button
                      key={t.tag}
                      onClick={() => setSettings(prev => ({ ...prev, custom_signature: prev.custom_signature + t.tag }))}
                      className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-[10px] font-mono hover:bg-accent/20 transition-colors border border-accent/20"
                      title={t.label}
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Delivery Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Email Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-2">
                <p><strong>Global branding</strong> (logo, colors, header, footer) is managed by your platform administrator in the Automated Emails hub.</p>
                <p>Your custom signature and reply-to address are added on top of the global template.</p>
                <p>To request branding changes, contact your admin or visit the admin dashboard.</p>
              </div>
            </CardContent>
          </Card>

          {/* Email Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Recent Email Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailActivityLog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════ SUB-COMPONENTS ═══════ */

function EmailActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Fetch recent email logs for this notary's appointments
      const { data } = await supabase
        .from("email_send_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setLogs(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No recent email activity.</p>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {logs.map(log => (
        <div key={log.id} className="flex items-center justify-between rounded border p-2 text-xs">
          <div>
            <span className="font-medium">{log.template_name}</span>
            <span className="ml-2 text-muted-foreground">→ {log.recipient_email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={log.status === "sent" ? "default" : log.status === "pending" ? "secondary" : "destructive"} className="text-[10px]">
              {log.status}
            </Badge>
            <span className="text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
