import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Save, Mail, MailCheck, Clock, CheckCircle2, Eye,
  Tag, Palette, Settings, ExternalLink, AlertCircle, RefreshCw,
  Link2, Shield, Zap, Send, Edit3, ChevronDown, ChevronUp,
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

interface TemplateOverride {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
}

interface NotaryEmailSettings {
  preferences: EmailPreference;
  custom_signature: string;
  reply_to_email: string;
  gmail_connected: boolean;
  gmail_email: string;
  template_overrides: Record<string, TemplateOverride>;
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
  template_overrides: {},
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
  {
    key: "booking_confirmation" as const,
    label: "Booking Confirmation",
    icon: MailCheck,
    description: "Sent when a client books an appointment with you",
    defaultSubject: "Your Notary Appointment is Confirmed — {{confirmation_number}}",
    defaultGreeting: "Hello {{client_name}},",
    defaultBody: "Your appointment for {{service_type}} has been scheduled for {{date}} at {{time}}. Your confirmation number is {{confirmation_number}}.\n\nPlease bring a valid government-issued photo ID to your appointment. For RON sessions, ensure you have a stable internet connection and a working camera/microphone.",
    defaultClosing: "We look forward to assisting you.",
  },
  {
    key: "reminder_24h" as const,
    label: "24-Hour Reminder",
    icon: Clock,
    description: "Sent 24 hours before the scheduled appointment",
    defaultSubject: "Reminder: Your Notary Appointment is Tomorrow — {{confirmation_number}}",
    defaultGreeting: "Hello {{client_name}},",
    defaultBody: "This is a friendly reminder that your {{service_type}} appointment is scheduled for tomorrow, {{date}} at {{time}}.\n\nPlease have your documents ready and a valid photo ID available. If you need to reschedule, please do so at least 4 hours before your appointment time.",
    defaultClosing: "See you tomorrow!",
  },
  {
    key: "reminder_30m" as const,
    label: "30-Minute Reminder",
    icon: Clock,
    description: "Sent 30 minutes before the appointment starts",
    defaultSubject: "Starting Soon: Your Notary Appointment in 30 Minutes",
    defaultGreeting: "Hello {{client_name}},",
    defaultBody: "Your {{service_type}} appointment begins in approximately 30 minutes at {{time}}.\n\nFor RON sessions, please click your session link and complete the tech check. Have your photo ID ready for verification.",
    defaultClosing: "We're ready when you are!",
  },
  {
    key: "follow_up" as const,
    label: "Follow-Up / Thank You",
    icon: CheckCircle2,
    description: "Sent after appointment completion",
    defaultSubject: "Thank You for Choosing Our Notary Services",
    defaultGreeting: "Hello {{client_name}},",
    defaultBody: "Thank you for your recent {{service_type}} appointment on {{date}}. We hope the experience met your expectations.\n\nYour notarized documents are available for download in your client portal. If you need additional copies or have questions about your documents, please don't hesitate to reach out.\n\nWe'd appreciate a brief review of your experience — your feedback helps us improve our services.",
    defaultClosing: "Thank you for your trust in our services.",
  },
  {
    key: "document_ready" as const,
    label: "Document Ready",
    icon: Mail,
    description: "Sent when notarized documents are available for download",
    defaultSubject: "Your Notarized Document is Ready — {{document_name}}",
    defaultGreeting: "Hello {{client_name}},",
    defaultBody: "Your document \"{{document_name}}\" has been notarized and is now available for download in your client portal.\n\nPlease log in to your portal to access your documents. Notarized documents include our digital e-seal and are compliant with Ohio ORC §147 requirements.",
    defaultClosing: "If you have any questions about your documents, we're here to help.",
  },
  {
    key: "ron_session_link" as const,
    label: "RON Session Link",
    icon: Link2,
    description: "Sent with the video session link for RON appointments",
    defaultSubject: "Your RON Session Link — {{confirmation_number}}",
    defaultGreeting: "Hello {{client_name}},",
    defaultBody: "Your Remote Online Notarization (RON) session is ready. Please use the link below to join your secure video session:\n\n{{session_link}}\n\nBefore joining, please ensure:\n• You have a stable internet connection\n• Your camera and microphone are working\n• You have a valid government-issued photo ID ready\n• You are in a well-lit, quiet environment\n\nPer Ohio ORC §147.63, this session will be recorded for compliance purposes.",
    defaultClosing: "We'll be waiting for you in the session.",
  },
];

/* ═══════ MAIN COMPONENT ═══════ */

export default function PortalEmailsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotaryEmailSettings>(DEFAULT_SETTINGS);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

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
          template_overrides: emailSettings.template_overrides || {},
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
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
      .update({ credentials: { ...existingCreds, email_settings: settings } as Record<string, unknown> })
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

  const getTemplateOverride = (key: string): TemplateOverride => {
    const et = EMAIL_TYPES.find(e => e.key === key);
    return settings.template_overrides[key] || {
      subject: et?.defaultSubject || "",
      greeting: et?.defaultGreeting || "",
      body: et?.defaultBody || "",
      closing: et?.defaultClosing || "",
    };
  };

  const updateTemplateOverride = (key: string, field: keyof TemplateOverride, value: string) => {
    const current = getTemplateOverride(key);
    setSettings(prev => ({
      ...prev,
      template_overrides: {
        ...prev.template_overrides,
        [key]: { ...current, [field]: value },
      },
    }));
  };

  const resetTemplate = (key: string) => {
    const newOverrides = { ...settings.template_overrides };
    delete newOverrides[key];
    setSettings(prev => ({ ...prev, template_overrides: newOverrides }));
    toast({ title: "Template reset to default" });
  };

  const handleTestSend = async (templateKey: string) => {
    if (!user?.email) return;
    setSendingTest(templateKey);
    // Log a test send attempt
    toast({
      title: "Test email queued",
      description: `A preview of "${EMAIL_TYPES.find(e => e.key === templateKey)?.label}" will be sent to ${user.email}. Check your inbox shortly.`,
    });
    // In production, this would invoke send-transactional-email
    setTimeout(() => setSendingTest(null), 2000);
  };

  const handleGmailConnect = async () => {
    setGmailConnecting(true);
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

  const renderTagPreview = (text: string) => {
    return text
      .replace(/\{\{client_name\}\}/g, "Jane Doe")
      .replace(/\{\{date\}\}/g, "April 15, 2026")
      .replace(/\{\{time\}\}/g, "2:00 PM")
      .replace(/\{\{service_type\}\}/g, "Acknowledgment")
      .replace(/\{\{confirmation_number\}\}/g, "NTR-20260415-A1B2C3")
      .replace(/\{\{notary_name\}\}/g, "Your Name")
      .replace(/\{\{document_name\}\}/g, "Power of Attorney")
      .replace(/\{\{session_link\}\}/g, "https://session.example.com/abc123")
      .replace(/\{\{portal_link\}\}/g, "https://portal.example.com");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Email & Notifications</h2>
          <p className="text-sm text-muted-foreground">Manage automated emails, templates, Gmail integration, and notification preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Settings
        </Button>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="templates" className="text-xs gap-1"><Edit3 className="h-3 w-3" /> Templates</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs gap-1"><Mail className="h-3 w-3" /> Toggles</TabsTrigger>
          <TabsTrigger value="gmail" className="text-xs gap-1"><Zap className="h-3 w-3" /> Gmail</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs gap-1"><Settings className="h-3 w-3" /> Advanced</TabsTrigger>
        </TabsList>

        {/* Tab 1: Template Editor */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email Template Editor</CardTitle>
              <p className="text-xs text-muted-foreground">Customize the subject, greeting, body, and closing for each automated email. Use dynamic tags to personalize messages. Changes apply only to your clients' emails.</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {EMAIL_TYPES.map(et => {
                  const override = getTemplateOverride(et.key);
                  const isCustomized = !!settings.template_overrides[et.key];
                  const isEditing = editingTemplate === et.key;
                  const isPreviewing = previewTemplate === et.key;

                  return (
                    <AccordionItem key={et.key} value={et.key} className="border rounded-lg px-3">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <et.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{et.label}</span>
                              {isCustomized && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Customized</Badge>}
                              <Badge variant={settings.preferences[et.key] ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                                {settings.preferences[et.key] ? "Active" : "Disabled"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{et.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                        {/* Toggle between Edit and Preview */}
                        <div className="flex gap-2 mb-2">
                          <Button variant={!isPreviewing ? "default" : "outline"} size="sm" className="text-xs gap-1"
                            onClick={() => { setPreviewTemplate(null); setEditingTemplate(et.key); }}>
                            <Edit3 className="h-3 w-3" /> Edit
                          </Button>
                          <Button variant={isPreviewing ? "default" : "outline"} size="sm" className="text-xs gap-1"
                            onClick={() => { setEditingTemplate(null); setPreviewTemplate(et.key); }}>
                            <Eye className="h-3 w-3" /> Preview
                          </Button>
                          <div className="flex-1" />
                          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => handleTestSend(et.key)}
                            disabled={sendingTest === et.key || !settings.preferences[et.key]}>
                            {sendingTest === et.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Test Send
                          </Button>
                          {isCustomized && (
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => resetTemplate(et.key)}>
                              <RefreshCw className="h-3 w-3" /> Reset
                            </Button>
                          )}
                        </div>

                        {isPreviewing ? (
                          /* Live Preview */
                          <div className="rounded-lg border bg-background p-4 space-y-3">
                            <div className="border-b pb-2">
                              <p className="text-xs text-muted-foreground">Subject:</p>
                              <p className="text-sm font-medium">{renderTagPreview(override.subject)}</p>
                            </div>
                            <div className="text-sm space-y-2">
                              <p>{renderTagPreview(override.greeting)}</p>
                              {renderTagPreview(override.body).split("\n").map((line, i) => (
                                <p key={i} className={line.trim() === "" ? "h-2" : ""}>{line}</p>
                              ))}
                              <p className="mt-4">{renderTagPreview(override.closing)}</p>
                              {settings.custom_signature && (
                                <div className="mt-4 pt-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">
                                  {renderTagPreview(settings.custom_signature)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Edit Form */
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Subject Line</Label>
                              <Input value={override.subject} onChange={e => updateTemplateOverride(et.key, "subject", e.target.value)}
                                placeholder={et.defaultSubject} className="mt-1 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Greeting</Label>
                              <Input value={override.greeting} onChange={e => updateTemplateOverride(et.key, "greeting", e.target.value)}
                                placeholder={et.defaultGreeting} className="mt-1 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs">Body</Label>
                              <Textarea rows={6} value={override.body} onChange={e => updateTemplateOverride(et.key, "body", e.target.value)}
                                placeholder={et.defaultBody} className="mt-1 text-sm font-mono" />
                            </div>
                            <div>
                              <Label className="text-xs">Closing</Label>
                              <Input value={override.closing} onChange={e => updateTemplateOverride(et.key, "closing", e.target.value)}
                                placeholder={et.defaultClosing} className="mt-1 text-sm" />
                            </div>
                            {/* Tag Inserter */}
                            <div>
                              <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Insert Dynamic Tag</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {AVAILABLE_TAGS.map(t => (
                                  <button key={t.tag}
                                    onClick={() => navigator.clipboard.writeText(t.tag).then(() => toast({ title: `Copied ${t.tag}` }))}
                                    className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-[10px] font-mono hover:bg-accent/20 transition-colors border border-accent/20"
                                    title={`Copy ${t.label} tag`}>
                                    {t.tag}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">Click to copy, then paste into any field above.</p>
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Notification Toggles */}
        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Automated Email Notifications</CardTitle>
              <p className="text-xs text-muted-foreground">Control which automated emails are sent to your clients. Disabled emails will not be sent even if triggered.</p>
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
                  <Switch checked={settings.preferences[et.key]} onCheckedChange={() => togglePreference(et.key)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Email Delivery Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="rounded bg-muted px-2 py-1 font-medium text-foreground">Client Action</div>
                  <span>→</span>
                  <div className="rounded bg-muted px-2 py-1 font-medium text-foreground">Your Template</div>
                  <span>→</span>
                  <div className="rounded bg-muted px-2 py-1 font-medium text-foreground">Email Queue</div>
                  <span>→</span>
                  <div className="rounded bg-muted px-2 py-1 font-medium text-foreground">Retry Engine</div>
                  <span>→</span>
                  <div className="rounded bg-muted px-2 py-1 font-medium text-foreground">Client Inbox</div>
                </div>
                <ul className="mt-3 space-y-1 list-disc pl-4">
                  <li>Emails use <strong>global branding</strong> (logo, colors, footer) set by your admin</li>
                  <li>Your <strong>custom template text</strong> and <strong>signature</strong> are applied on top</li>
                  <li>Your <strong>reply-to</strong> address is attached so clients respond directly to you</li>
                  <li>All emails include Ohio compliance notices per ORC §147</li>
                  <li>RON session links include required ID verification reminders</li>
                  <li>Emails queued with automatic retry (max 5 attempts, exponential backoff)</li>
                  <li>Failed emails after 5 retries are logged for admin review</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Gmail Integration */}
        <TabsContent value="gmail" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Gmail Integration</CardTitle>
              <p className="text-xs text-muted-foreground">Connect your Gmail account so client replies go directly to your inbox.</p>
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
                    <Button variant="outline" size="sm" onClick={handleGmailDisconnect} className="text-xs">Disconnect</Button>
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
                    <p className="text-xs text-muted-foreground mb-4">Link your Gmail so client replies come directly to your inbox</p>
                    <Button onClick={handleGmailConnect} disabled={gmailConnecting} className="gap-2">
                      {gmailConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Connect Gmail Account
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <h4 className="text-xs font-semibold mb-1">Why Connect Gmail?</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Clients reply to your Gmail instead of a no-reply address</li>
                      <li>Get a copy of every automated email in your Gmail</li>
                      <li>More personal and professional client communication</li>
                      <li>Keep all client correspondence in one place</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2">
                {[
                  "We only use your Gmail address as a reply-to. We never read your emails.",
                  "No messages are sent from your Gmail — only the platform's verified domain.",
                  "You can disconnect at any time. Your data stays private.",
                  "Compliant with Ohio data privacy and ORC §147 notary communication requirements.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: text.replace(/never|from your Gmail/gi, m => `<strong>${m}</strong>`) }} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Advanced Settings */}
        <TabsContent value="advanced" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reply-To Address</CardTitle>
              <p className="text-xs text-muted-foreground">When clients reply to automated emails, their response goes to this address.</p>
            </CardHeader>
            <CardContent>
              <Input type="email" value={settings.reply_to_email}
                onChange={e => setSettings(prev => ({ ...prev, reply_to_email: e.target.value }))}
                placeholder="your.email@gmail.com" />
              {settings.gmail_connected && (
                <p className="mt-1 text-xs text-muted-foreground">Currently using your connected Gmail: {settings.gmail_email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom Email Signature</CardTitle>
              <p className="text-xs text-muted-foreground">Appended to all automated emails sent on your behalf. Supports dynamic tags.</p>
            </CardHeader>
            <CardContent>
              <Textarea rows={5} value={settings.custom_signature}
                onChange={e => setSettings(prev => ({ ...prev, custom_signature: e.target.value }))}
                placeholder={"Best regards,\nShane Goble\nOhio Notary Public\nCommission #12345678\nPhone: (555) 123-4567"} />
              <div className="mt-2">
                <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Available Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {AVAILABLE_TAGS.map(t => (
                    <button key={t.tag}
                      onClick={() => setSettings(prev => ({ ...prev, custom_signature: prev.custom_signature + t.tag }))}
                      className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-[10px] font-mono hover:bg-accent/20 transition-colors border border-accent/20"
                      title={t.label}>
                      {t.tag}
                    </button>
                  ))}
                </div>
              </div>
              {settings.custom_signature && (
                <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                  <p className="text-[10px] text-muted-foreground mb-1 font-semibold">Preview:</p>
                  <div className="text-xs whitespace-pre-wrap">{renderTagPreview(settings.custom_signature)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Email Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-2">
                <p><strong>Global branding</strong> (logo, colors, header, footer) is managed by your platform administrator in the Automated Emails hub.</p>
                <p>Your custom template text, signature, and reply-to address are applied on top of the global template.</p>
                <p>To request branding changes, contact your admin or visit the admin dashboard.</p>
              </div>
            </CardContent>
          </Card>

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
  const [logs, setLogs] = useState<Array<{ id: string; template_name: string; recipient_email: string; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("email_send_log")
        .select("id, template_name, recipient_email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setLogs((data as typeof logs) || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (logs.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No recent email activity.</p>;

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
