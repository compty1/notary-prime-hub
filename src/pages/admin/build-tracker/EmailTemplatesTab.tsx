import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Eye, Save, Palette, Tag, FileEdit, Layout, Loader2 } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

type EmailTemplate = {
  id: string;
  name: string;
  label: string;
  subject: string;
  bodyHtml: string;
  category: "auth" | "appointment" | "notification" | "lead";
  tags: string[];
  sampleData: Record<string, string>;
};

const AVAILABLE_TAGS = [
  { tag: "{{client_name}}", label: "Client Name", sample: "Jane Smith" },
  { tag: "{{date}}", label: "Date", sample: "April 1, 2026" },
  { tag: "{{time}}", label: "Time", sample: "2:30 PM EST" },
  { tag: "{{service_type}}", label: "Service Type", sample: "Remote Online Notarization" },
  { tag: "{{confirmation_number}}", label: "Confirmation #", sample: "NTR-20260401-a1b2c3" },
  { tag: "{{location}}", label: "Location", sample: "123 Main St, Columbus, OH 43215" },
  { tag: "{{notary_name}}", label: "Notary Name", sample: "Shane Goble" },
  { tag: "{{company_name}}", label: "Company Name", sample: "NotaryDex" },
  { tag: "{{document_name}}", label: "Document Name", sample: "Power of Attorney" },
  { tag: "{{appointment_link}}", label: "Appointment Link", sample: "https://notardex.com/confirmation/abc123" },
  { tag: "{{portal_link}}", label: "Portal Link", sample: "https://notardex.com/portal" },
  { tag: "{{fee_amount}}", label: "Fee Amount", sample: "$25.00" },
  { tag: "{{session_link}}", label: "RON Session Link", sample: "https://notardex.com/ron-session/abc123" },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { id: "appt-confirmation", name: "appointment_confirmation", label: "Appointment Confirmation", subject: "Your Appointment is Confirmed — {{confirmation_number}}", bodyHtml: "<h2>Appointment Confirmed</h2><p>Dear {{client_name}},</p><p>Your {{service_type}} appointment has been confirmed for <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p><p>Confirmation Number: <strong>{{confirmation_number}}</strong></p><p>Location: {{location}}</p><p>Please have a valid government-issued photo ID ready.</p>", category: "appointment", tags: ["client_name", "date", "time", "service_type", "confirmation_number", "location"], sampleData: { client_name: "Jane Smith", date: "April 1, 2026", time: "2:30 PM EST", service_type: "Remote Online Notarization", confirmation_number: "NTR-20260401-a1b2c3", location: "Online — RON Session" } },
  { id: "appt-reminder-24h", name: "appointment_reminder_24h", label: "Appointment Reminder (24hr)", subject: "Reminder: Your Appointment Tomorrow — {{date}}", bodyHtml: "<h2>Appointment Tomorrow</h2><p>Hi {{client_name}},</p><p>This is a friendly reminder that your {{service_type}} appointment is scheduled for tomorrow, <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p><p>Please ensure you have your valid photo ID ready.</p>", category: "appointment", tags: ["client_name", "date", "time", "service_type"], sampleData: { client_name: "Jane Smith", date: "April 2, 2026", time: "2:30 PM EST", service_type: "Notarization" } },
  { id: "appt-reminder-30m", name: "appointment_reminder_30m", label: "Appointment Reminder (30min)", subject: "Starting Soon: Your Appointment in 30 Minutes", bodyHtml: "<h2>Your Appointment Starts Soon</h2><p>Hi {{client_name}},</p><p>Your {{service_type}} session begins in 30 minutes at <strong>{{time}}</strong>.</p><p>{{session_link}}</p>", category: "appointment", tags: ["client_name", "time", "service_type", "session_link"], sampleData: { client_name: "Jane Smith", time: "2:30 PM EST", service_type: "RON Session", session_link: "https://notardex.com/ron-session" } },
  { id: "appt-completed", name: "appointment_completed", label: "Appointment Completed", subject: "Your Notarization is Complete", bodyHtml: "<h2>Notarization Complete</h2><p>Dear {{client_name}},</p><p>Your {{service_type}} has been successfully completed on {{date}}.</p><p>Your notarized documents are available in your <a href='{{portal_link}}'>client portal</a>.</p><p>Thank you for choosing NotaryDex!</p>", category: "appointment", tags: ["client_name", "date", "service_type", "portal_link"], sampleData: { client_name: "Jane Smith", date: "April 1, 2026", service_type: "Remote Online Notarization", portal_link: "https://notardex.com/portal" } },
  { id: "welcome", name: "signup_welcome", label: "Signup Welcome", subject: "Welcome to NotaryDex!", bodyHtml: "<h2>Welcome to NotaryDex</h2><p>Hi {{client_name}},</p><p>Thank you for creating your account! You can now:</p><ul><li>Book notary appointments online</li><li>Upload and manage documents securely</li><li>Track your notarization progress</li></ul><p><a href='{{portal_link}}'>Access Your Portal</a></p>", category: "auth", tags: ["client_name", "portal_link"], sampleData: { client_name: "Jane Smith", portal_link: "https://notardex.com/portal" } },
  { id: "password-recovery", name: "password_recovery", label: "Password Recovery", subject: "Reset Your Password — NotaryDex", bodyHtml: "<h2>Password Reset</h2><p>Hi {{client_name}},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href='{{appointment_link}}'>Reset Password</a></p><p>If you didn't request this, please ignore this email.</p>", category: "auth", tags: ["client_name", "appointment_link"], sampleData: { client_name: "Jane Smith", appointment_link: "https://notardex.com/reset" } },
  { id: "magic-link", name: "magic_link", label: "Magic Link Login", subject: "Your Login Link — NotaryDex", bodyHtml: "<h2>Sign In to NotaryDex</h2><p>Hi {{client_name}},</p><p>Click the link below to sign in securely:</p><p><a href='{{appointment_link}}'>Sign In Now</a></p>", category: "auth", tags: ["client_name", "appointment_link"], sampleData: { client_name: "Jane Smith", appointment_link: "https://notardex.com/magic-link" } },
  { id: "email-change", name: "email_change", label: "Email Change Verification", subject: "Confirm Your New Email — NotaryDex", bodyHtml: "<h2>Confirm Email Change</h2><p>Hi {{client_name}},</p><p>Please confirm your new email address by clicking the link below:</p><p><a href='{{appointment_link}}'>Confirm Email</a></p>", category: "auth", tags: ["client_name", "appointment_link"], sampleData: { client_name: "Jane Smith", appointment_link: "https://notardex.com/confirm" } },
  { id: "invite", name: "team_invite", label: "Team Invite", subject: "You're Invited to Join NotaryDex", bodyHtml: "<h2>You're Invited!</h2><p>Hi,</p><p>{{notary_name}} has invited you to join NotaryDex as a notary. Click below to accept:</p><p><a href='{{appointment_link}}'>Accept Invitation</a></p>", category: "auth", tags: ["notary_name", "appointment_link"], sampleData: { notary_name: "Shane Goble", appointment_link: "https://notardex.com/join" } },
  { id: "reauth", name: "reauthentication", label: "Reauthentication Code", subject: "Your Verification Code — NotaryDex", bodyHtml: "<h2>Verification Code</h2><p>Hi {{client_name}},</p><p>Your verification code is:</p><h1 style='text-align:center;letter-spacing:8px;font-size:32px'>123456</h1><p>This code expires in 10 minutes.</p>", category: "auth", tags: ["client_name"], sampleData: { client_name: "Jane Smith" } },
  { id: "lead-confirm", name: "lead_confirmation", label: "Lead Contact Confirmation", subject: "Thanks for Reaching Out — NotaryDex", bodyHtml: "<h2>We Received Your Message</h2><p>Dear {{client_name}},</p><p>Thank you for contacting NotaryDex! We'll review your inquiry about {{service_type}} and respond within 24 hours.</p>", category: "lead", tags: ["client_name", "service_type"], sampleData: { client_name: "Jane Smith", service_type: "Loan Signing" } },
  { id: "booking-receipt", name: "booking_receipt", label: "Booking Receipt", subject: "Payment Receipt — {{confirmation_number}}", bodyHtml: "<h2>Payment Receipt</h2><p>Dear {{client_name}},</p><p>Payment of <strong>{{fee_amount}}</strong> received for {{service_type}}.</p><p>Confirmation: {{confirmation_number}}</p><p>Date: {{date}} at {{time}}</p>", category: "appointment", tags: ["client_name", "fee_amount", "service_type", "confirmation_number", "date", "time"], sampleData: { client_name: "Jane Smith", fee_amount: "$25.00", service_type: "Notarization", confirmation_number: "NTR-20260401-a1b2c3", date: "April 1, 2026", time: "2:30 PM" } },
  { id: "doc-ready", name: "document_ready", label: "Document Ready Notification", subject: "Your Document is Ready — NotaryDex", bodyHtml: "<h2>Document Ready</h2><p>Hi {{client_name}},</p><p>Your document <strong>{{document_name}}</strong> has been processed and is ready for download.</p><p><a href='{{portal_link}}'>View Document</a></p>", category: "notification", tags: ["client_name", "document_name", "portal_link"], sampleData: { client_name: "Jane Smith", document_name: "Power of Attorney", portal_link: "https://notardex.com/portal" } },
  { id: "ron-link", name: "ron_session_link", label: "RON Session Link", subject: "Your RON Session Link — NotaryDex", bodyHtml: "<h2>RON Session Ready</h2><p>Hi {{client_name}},</p><p>Your Remote Online Notarization session is ready. Click below to join:</p><p><a href='{{session_link}}'>Join RON Session</a></p><p>Please have your government-issued photo ID ready.</p>", category: "notification", tags: ["client_name", "session_link"], sampleData: { client_name: "Jane Smith", session_link: "https://notardex.com/ron-session/abc123" } },
];

type MasterTemplate = {
  headerColor: string;
  accentColor: string;
  footerColor: string;
  bodyBg: string;
  fontFamily: string;
  logoUrl: string;
  footerText: string;
  senderEmail: string;
};

const DEFAULT_MASTER: MasterTemplate = {
  headerColor: "#1a1a2e",
  accentColor: "#d4a853",
  footerColor: "#f5f5f5",
  bodyBg: "#ffffff",
  fontFamily: "'Space Grotesk', Arial, sans-serif",
  logoUrl: "",
  footerText: "NotaryDex · Ohio Online Notary Services · notify@notardex.com",
  senderEmail: "notify@notardex.com",
};

function useEmailSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["email-template-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("platform_settings").select("*").eq("setting_key", "email_templates").maybeSingle();
      if (error && !error.message?.includes("does not exist")) throw error;
      return (data?.value ?? null) as { master: MasterTemplate; templates: Record<string, { subject: string; bodyHtml: string }> } | null;
    },
  });

  const save = useMutation({
    mutationFn: async (settings: { master: MasterTemplate; templates: Record<string, { subject: string; bodyHtml: string }> }) => {
      const { error } = await (supabase as any).from("platform_settings").upsert({ setting_key: "email_templates", value: settings }, { onConflict: "setting_key" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-template-settings"] }); toast.success("Email templates saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { data, isLoading, save };
}

function renderPreview(bodyHtml: string, sampleData: Record<string, string>, master: MasterTemplate): string {
  let html = bodyHtml;
  for (const t of AVAILABLE_TAGS) {
    const key = t.tag.replace(/\{\{|\}\}/g, "");
    const value = sampleData[key] || t.sample;
    html = html.replace(new RegExp(t.tag.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  return `
    <div style="font-family:${master.fontFamily};max-width:600px;margin:0 auto;background:${master.bodyBg};">
      <div style="background:${master.headerColor};padding:20px 24px;text-align:center;">
        <h1 style="color:${master.accentColor};margin:0;font-size:20px;">NotaryDex</h1>
      </div>
      <div style="padding:24px;">${html}</div>
      <div style="background:${master.footerColor};padding:16px 24px;text-align:center;font-size:12px;color:#666;">
        ${master.footerText}
      </div>
    </div>`;
}

export default function EmailTemplatesTab() {
  const { data: saved, isLoading, save } = useEmailSettings();
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATES[0].id);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, { subject: string; bodyHtml: string }>>({});
  const [master, setMaster] = useState<MasterTemplate>(DEFAULT_MASTER);
  const [subTab, setSubTab] = useState<"templates" | "master">("templates");
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(0);

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Load saved data — useEffect instead of useMemo for side effects
  useEffect(() => {
    if (saved) {
      if (saved.master) setMaster(saved.master);
      if (saved.templates) setEditedTemplates(saved.templates);
    }
  }, [saved]);

  const current = DEFAULT_TEMPLATES.find(t => t.id === activeTemplate) || DEFAULT_TEMPLATES[0];
  const edited = editedTemplates[current.id];
  const currentSubject = edited?.subject ?? current.subject;
  const currentBody = edited?.bodyHtml ?? current.bodyHtml;

  const updateTemplate = (field: "subject" | "bodyHtml", value: string) => {
    setIsDirty(true);
    setEditedTemplates(prev => ({
      ...prev,
      [current.id]: { subject: field === "subject" ? value : (prev[current.id]?.subject ?? current.subject), bodyHtml: field === "bodyHtml" ? value : (prev[current.id]?.bodyHtml ?? current.bodyHtml) },
    }));
  };

  const insertTag = useCallback((tag: string) => {
    const el = editorRef.current;
    if (!el) return;
    // Use the ref for stored cursor position
    const start = el.selectionStart ?? cursorPosRef.current;
    const end = el.selectionEnd ?? start;
    const currentVal = el.value;
    const before = currentVal.slice(0, start);
    const after = currentVal.slice(end);
    const newBody = before + tag + after;
    updateTemplate("bodyHtml", newBody);
    const newPos = start + tag.length;
    cursorPosRef.current = newPos;
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = newPos;
    }, 0);
  }, [current.id]);

  const handleSave = () => {
    // Validate: check at least subject is non-empty for edited templates
    const hasEmpty = Object.entries(editedTemplates).some(([, t]) => !t.subject?.trim());
    if (hasEmpty) {
      toast.warning("Some templates have empty subject lines");
    }
    save.mutate({ master, templates: editedTemplates });
    setIsDirty(false);
  };

  const preview = useMemo(() => renderPreview(currentBody, current.sampleData, master), [currentBody, current.sampleData, master]);

  const categoryColors: Record<string, string> = {
    auth: "bg-blue-500/10 text-blue-700",
    appointment: "bg-green-500/10 text-green-700",
    notification: "bg-purple-500/10 text-purple-700",
    lead: "bg-orange-500/10 text-orange-700",
  };

  // Track cursor position on blur/click
  const handleEditorInteraction = () => {
    if (editorRef.current) {
      cursorPosRef.current = editorRef.current.selectionStart;
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage all {DEFAULT_TEMPLATES.length} automated email templates with live preview and tag insertion.</p>
        <div className="flex items-center gap-2">
          {isDirty && <Badge variant="outline" className="text-xs text-yellow-600">Unsaved changes</Badge>}
          <Button onClick={handleSave} disabled={save.isPending}><Save className="h-3.5 w-3.5 mr-1" /> Save All</Button>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={v => setSubTab(v as any)}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-1"><FileEdit className="h-4 w-4" /> Per-Template Editor</TabsTrigger>
          <TabsTrigger value="master" className="gap-1"><Layout className="h-4 w-4" /> Master Template</TabsTrigger>
        </TabsList>

        <TabsContent value="master">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Master Template Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">These settings apply to ALL automated emails as a shared wrapper.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Header Color", key: "headerColor" as const },
                  { label: "Accent Color", key: "accentColor" as const },
                  { label: "Footer BG", key: "footerColor" as const },
                  { label: "Body BG", key: "bodyBg" as const },
                ].map(c => (
                  <div key={c.key}>
                    <Label className="text-xs">{c.label}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={master[c.key]} onChange={e => { setMaster(prev => ({ ...prev, [c.key]: e.target.value })); setIsDirty(true); }} className="w-8 h-8 rounded cursor-pointer" />
                      <Input value={master[c.key]} onChange={e => { setMaster(prev => ({ ...prev, [c.key]: e.target.value })); setIsDirty(true); }} className="text-xs h-8 font-mono" />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-xs">Font Family</Label>
                <Input value={master.fontFamily} onChange={e => { setMaster(prev => ({ ...prev, fontFamily: e.target.value })); setIsDirty(true); }} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Footer Text</Label>
                <Input value={master.footerText} onChange={e => { setMaster(prev => ({ ...prev, footerText: e.target.value })); setIsDirty(true); }} className="mt-1" />
              </div>
              <div className="border rounded-lg p-2 mt-4">
                <p className="text-xs font-medium mb-2">Preview (Master Template with sample content)</p>
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderPreview("<p>This is sample email content with <strong>bold text</strong> and a <a href='#'>link</a>.</p>", {}, master)) }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-12 gap-4">
            {/* Template List */}
            <div className="col-span-3 space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {DEFAULT_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`w-full text-left p-2 rounded-md text-xs transition-colors ${activeTemplate === t.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}
                >
                  <div className="font-medium truncate">{t.label}</div>
                  <Badge className={`text-[9px] mt-0.5 ${categoryColors[t.category] || ""}`}>{t.category}</Badge>
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="col-span-5 space-y-3">
              <div>
                <Label className="text-xs">Subject Line</Label>
                <Input value={currentSubject} onChange={e => updateTemplate("subject", e.target.value)} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Body HTML</Label>
                <Textarea
                  ref={editorRef}
                  value={currentBody}
                  onChange={e => updateTemplate("bodyHtml", e.target.value)}
                  onBlur={handleEditorInteraction}
                  onClick={handleEditorInteraction}
                  className="mt-1 font-mono text-xs min-h-[300px]"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Click a tag to insert at cursor</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {AVAILABLE_TAGS.map(t => (
                    <button
                      key={t.tag}
                      onClick={() => insertTag(t.tag)}
                      className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-[10px] font-mono hover:bg-accent/20 transition-colors border border-accent/20"
                      title={t.label}
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="col-span-4">
              <div className="sticky top-0">
                <div className="flex items-center gap-1 mb-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview) }} className="text-sm" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
