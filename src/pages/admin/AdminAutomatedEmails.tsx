import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2, Save, Wand2, Mail, MailCheck, Clock, CheckCircle2,
  RefreshCw, Eye, Palette, FileEdit, Layout, Tag, Upload,
  Settings, CreditCard, PenTool, Users, Calendar, Shield,
  ArrowRight, ExternalLink, Zap, AlertCircle, Server, Copy,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ═══════════════════════════════════════════
   SHARED TYPES & CONSTANTS
   ═══════════════════════════════════════════ */

// --- Per-service template types ---
interface EmailTemplate {
  enabled: boolean;
  subject: string;
  body: string;
}

interface ServiceEmailTemplates {
  booking_confirmation: EmailTemplate;
  reminder: EmailTemplate;
  follow_up: EmailTemplate;
  completion: EmailTemplate;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  email_templates: ServiceEmailTemplates | null;
}

const SERVICE_TEMPLATE_KEYS: { key: keyof ServiceEmailTemplates; label: string; icon: React.ElementType }[] = [
  { key: "booking_confirmation", label: "Booking Confirmation", icon: MailCheck },
  { key: "reminder", label: "Appointment Reminder", icon: Clock },
  { key: "follow_up", label: "Follow-Up", icon: Mail },
  { key: "completion", label: "Completion / Thank You", icon: CheckCircle2 },
];

const DEFAULT_SERVICE_TEMPLATE: EmailTemplate = { enabled: false, subject: "", body: "" };

function defaultServiceTemplates(serviceName?: string): ServiceEmailTemplates {
  if (!serviceName) {
    return {
      booking_confirmation: { ...DEFAULT_SERVICE_TEMPLATE },
      reminder: { ...DEFAULT_SERVICE_TEMPLATE },
      follow_up: { ...DEFAULT_SERVICE_TEMPLATE },
      completion: { ...DEFAULT_SERVICE_TEMPLATE },
    };
  }
  // Generate smart defaults based on service name
  return {
    booking_confirmation: {
      enabled: true,
      subject: `Your ${serviceName} Appointment is Confirmed — {{confirmation_number}}`,
      body: `<h2>Appointment Confirmed</h2><p>Dear {{client_name}},</p><p>Your <strong>${serviceName}</strong> appointment has been confirmed.</p><ul><li><strong>Date:</strong> {{date}}</li><li><strong>Time:</strong> {{time}}</li><li><strong>Confirmation #:</strong> {{confirmation_number}}</li><li><strong>Location:</strong> {{location}}</li></ul><p>Please have a valid government-issued photo ID ready for your appointment.</p><p>If you need to reschedule, please do so at least 24 hours in advance through your <a href="{{portal_link}}">client portal</a>.</p><p>Thank you for choosing NotaryDex!</p>`,
    },
    reminder: {
      enabled: true,
      subject: `Reminder: Your ${serviceName} Appointment Tomorrow — {{date}}`,
      body: `<h2>Appointment Reminder</h2><p>Hi {{client_name}},</p><p>This is a friendly reminder that your <strong>${serviceName}</strong> appointment is scheduled for:</p><ul><li><strong>Date:</strong> {{date}}</li><li><strong>Time:</strong> {{time}}</li><li><strong>Location:</strong> {{location}}</li></ul><p><strong>What to bring:</strong></p><ul><li>Valid government-issued photo ID (driver's license, passport, or state ID)</li><li>Any documents that need to be notarized</li><li>Payment method</li></ul><p>Need to reschedule? Visit your <a href="{{portal_link}}">client portal</a> or contact us as soon as possible.</p>`,
    },
    follow_up: {
      enabled: true,
      subject: `How Was Your ${serviceName} Experience? — NotaryDex`,
      body: `<h2>We Value Your Feedback</h2><p>Hi {{client_name}},</p><p>Thank you for using NotaryDex for your <strong>${serviceName}</strong> on {{date}}.</p><p>We'd love to hear about your experience! Your feedback helps us improve our services for everyone.</p><p>How would you rate your experience? Please take a moment to share your thoughts in your <a href="{{portal_link}}">client portal</a>.</p><p>If you were satisfied with our service, we'd appreciate it if you'd consider referring us to friends, family, or colleagues who may need notary services.</p><p>Thank you again for choosing NotaryDex!</p>`,
    },
    completion: {
      enabled: true,
      subject: `Your ${serviceName} is Complete — NotaryDex`,
      body: `<h2>Notarization Complete</h2><p>Dear {{client_name}},</p><p>Your <strong>${serviceName}</strong> has been successfully completed.</p><p>Your notarized documents are now available for download in your <a href="{{portal_link}}">client portal</a>.</p><p><strong>Important:</strong> Please review your documents for accuracy. Notarized documents are legally binding records. If you have any questions or concerns, please contact us within 24 hours.</p><p>Thank you for choosing NotaryDex for your notarization needs. We look forward to serving you again!</p>`,
    },
  };
}

// --- Global template types ---
type GlobalTemplate = {
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

const DEFAULT_GLOBAL_TEMPLATES: GlobalTemplate[] = [
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
  { id: "signnow-invite", name: "signnow_invite", label: "SignNow — Signing Invitation (External)", subject: "Sent by SignNow: Document Ready for Signing", bodyHtml: "<h2>SignNow Signing Invitation</h2><p><em>This email is sent automatically by SignNow when a document is uploaded for e-signing.</em></p><p>The signer receives a direct link to review and sign the document on SignNow's platform. Notar tracks the invite via webhook.</p><p><strong>Note:</strong> This template is informational — the actual email content is controlled by SignNow.</p>", category: "notification", tags: ["client_name", "document_name"], sampleData: { client_name: "Jane Smith", document_name: "Power of Attorney" } },
  { id: "signnow-reminder", name: "signnow_reminder", label: "SignNow — Signing Reminder (External)", subject: "Sent by SignNow: Reminder to Sign Document", bodyHtml: "<h2>SignNow Signing Reminder</h2><p><em>SignNow automatically sends reminders to signers who haven't completed signing.</em></p><p>Reminder frequency is configured in your SignNow account settings. Notar tracks these events for status visibility.</p>", category: "notification", tags: ["client_name", "document_name"], sampleData: { client_name: "Jane Smith", document_name: "Affidavit" } },
  { id: "signnow-completed", name: "signnow_completion", label: "SignNow — Document Completed (External)", subject: "Sent by SignNow: Document Signed Successfully", bodyHtml: "<h2>SignNow Completion Notification</h2><p><em>SignNow sends this email to all parties when a document is fully signed.</em></p><p>The completed, signed document is attached or linked in SignNow's email. Notar captures the completion event and updates the appointment status.</p>", category: "notification", tags: ["client_name", "document_name"], sampleData: { client_name: "Jane Smith", document_name: "Deed of Trust" } },
];

// --- Master template branding ---
type MasterTemplate = {
  headerColor: string;
  accentColor: string;
  footerColor: string;
  bodyBg: string;
  fontFamily: string;
  logoUrl: string;
  footerText: string;
  senderEmail: string;
  borderRadius: string;
  padding: string;
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
  borderRadius: "8",
  padding: "24",
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-700",
  appointment: "bg-green-500/10 text-green-700",
  notification: "bg-purple-500/10 text-purple-700",
  lead: "bg-orange-500/10 text-orange-700",
};

/* ═══════════════════════════════════════════
   SHARED HOOKS
   ═══════════════════════════════════════════ */

function useGlobalEmailSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["email-template-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").eq("setting_key", "email_templates").maybeSingle();
      if (error && !error.message?.includes("does not exist")) throw error;
      return (data?.setting_value ? (typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value) : null) as { master: MasterTemplate; templates: Record<string, { subject: string; bodyHtml: string }> } | null;
    },
  });

  const save = useMutation({
    mutationFn: async (settings: { master: MasterTemplate; templates: Record<string, { subject: string; bodyHtml: string }> }) => {
      const { error } = await supabase.from("platform_settings").upsert(
        { setting_key: "email_templates", setting_value: JSON.stringify(settings) },
        { onConflict: "setting_key" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-template-settings"] }),
  });

  return { data, isLoading, save };
}

function renderPreview(bodyHtml: string, sampleData: Record<string, string>, master: MasterTemplate, subject?: string): string {
  let html = bodyHtml;
  let resolvedSubject = subject || "";
  for (const t of AVAILABLE_TAGS) {
    const key = t.tag.replace(/\{\{|\}\}/g, "");
    const value = sampleData[key] || t.sample;
    html = html.replace(new RegExp(t.tag.replace(/[{}]/g, "\\$&"), "g"), value);
    resolvedSubject = resolvedSubject.replace(new RegExp(t.tag.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  const senderEmail = master.senderEmail || "notify@notardex.com";
  const recipientEmail = sampleData["client_email"] || "jane.smith@example.com";
  const r = `${master.borderRadius || 8}px`;
  const p = `${master.padding || 24}px`;
  return `
    <div style="font-family:${master.fontFamily};max-width:600px;margin:0 auto;background:#f0f0f0;border-radius:${r};overflow:hidden;">
      <div style="background:#e8e8e8;padding:12px 16px;font-size:12px;color:#444;border-bottom:1px solid #ddd;">
        <div style="margin-bottom:4px;"><strong>From:</strong> NotaryDex &lt;${senderEmail}&gt;</div>
        <div style="margin-bottom:4px;"><strong>To:</strong> ${sampleData["client_name"] || "Jane Smith"} &lt;${recipientEmail}&gt;</div>
        ${resolvedSubject ? `<div><strong>Subject:</strong> ${resolvedSubject}</div>` : ""}
      </div>
      <div style="background:${master.bodyBg};">
        <div style="background:${master.headerColor};padding:${p};text-align:center;">
          ${master.logoUrl ? `<img src="${master.logoUrl}" alt="Logo" style="max-height:48px;margin-bottom:12px;" />` : ""}
          <h1 style="color:${master.accentColor};margin:0;font-size:20px;">NotaryDex</h1>
        </div>
        <div style="padding:${p};">${html}</div>
        <div style="background:${master.footerColor};padding:16px ${p};text-align:center;font-size:12px;color:#666;">
          ${master.footerText}
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════
   TAB 1: MASTER TEMPLATE / BRANDING
   ═══════════════════════════════════════════ */

function MasterBrandingTab({ master, setMaster, onSave, saving, uploading, setUploading }: {
  master: MasterTemplate;
  setMaster: React.Dispatch<React.SetStateAction<MasterTemplate>>;
  onSave: () => void;
  saving: boolean;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const { toast } = useToast();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `email-assets/logo_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 31536000);
    if (data?.signedUrl) setMaster(prev => ({ ...prev, logoUrl: data.signedUrl }));
    toast({ title: "Logo uploaded" });
    setUploading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        {/* Logo */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {master.logoUrl && <img src={master.logoUrl} alt="Email logo" className="h-10 rounded border border-border" />}
              <label className="cursor-pointer">
                <input type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span>{uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} {master.logoUrl ? "Change" : "Upload"}</span>
                </Button>
              </label>
              {master.logoUrl && <Button variant="ghost" size="sm" onClick={() => setMaster(p => ({ ...p, logoUrl: "" }))}>Remove</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {([
              { label: "Header BG", key: "headerColor" as const },
              { label: "Accent / Brand", key: "accentColor" as const },
              { label: "Footer BG", key: "footerColor" as const },
              { label: "Body BG", key: "bodyBg" as const },
            ]).map(c => (
              <div key={c.key} className="flex items-center gap-2">
                <input type="color" value={master[c.key]} onChange={e => setMaster(p => ({ ...p, [c.key]: e.target.value }))} className="h-8 w-8 cursor-pointer rounded border border-border" />
                <div>
                  <Label className="text-xs">{c.label}</Label>
                  <Input value={master[c.key]} onChange={e => setMaster(p => ({ ...p, [c.key]: e.target.value }))} className="text-xs h-7 font-mono w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Typography & Layout */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Layout className="h-4 w-4" /> Typography & Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Font Family</Label>
              <Input value={master.fontFamily} onChange={e => setMaster(p => ({ ...p, fontFamily: e.target.value }))} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Sender Email</Label>
              <Input value={master.senderEmail} onChange={e => setMaster(p => ({ ...p, senderEmail: e.target.value }))} className="mt-1" placeholder="notify@notardex.com" />
            </div>
            <div>
              <Label className="text-xs">Footer Text</Label>
              <Input value={master.footerText} onChange={e => setMaster(p => ({ ...p, footerText: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Border Radius: {master.borderRadius}px</Label>
              <Slider value={[parseInt(master.borderRadius)]} onValueChange={([v]) => setMaster(p => ({ ...p, borderRadius: String(v) }))} min={0} max={24} step={2} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs">Padding: {master.padding}px</Label>
              <Slider value={[parseInt(master.padding)]} onValueChange={([v]) => setMaster(p => ({ ...p, padding: String(v) }))} min={12} max={48} step={4} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Save Master Template
        </Button>
      </div>

      {/* Live Preview */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
        </div>
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-4 bg-muted/30">
            <div className="rounded-lg bg-background p-2 shadow-sm" dangerouslySetInnerHTML={{
              __html: sanitizeHtml(renderPreview(
                "<p>This is sample email content with <strong>bold text</strong> and a <a href='#'>link</a>.</p><p>Your appointment is confirmed for <strong>April 1, 2026</strong>.</p>",
                { client_name: "Jane Smith" },
                master,
                "Sample Email Subject"
              ))
            }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 2: GLOBAL TEMPLATES (Auth, Notification, Lead)
   ═══════════════════════════════════════════ */

function GlobalTemplatesTab({ master, editedTemplates, setEditedTemplates, onSave, saving }: {
  master: MasterTemplate;
  editedTemplates: Record<string, { subject: string; bodyHtml: string }>;
  setEditedTemplates: React.Dispatch<React.SetStateAction<Record<string, { subject: string; bodyHtml: string }>>>;
  onSave: () => void;
  saving: boolean;
}) {
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_GLOBAL_TEMPLATES[0].id);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(0);

  const current = DEFAULT_GLOBAL_TEMPLATES.find(t => t.id === activeTemplate) || DEFAULT_GLOBAL_TEMPLATES[0];
  const edited = editedTemplates[current.id];
  const currentSubject = edited?.subject ?? current.subject;
  const currentBody = edited?.bodyHtml ?? current.bodyHtml;

  const updateTemplate = (field: "subject" | "bodyHtml", value: string) => {
    setEditedTemplates(prev => ({
      ...prev,
      [current.id]: {
        subject: field === "subject" ? value : (prev[current.id]?.subject ?? current.subject),
        bodyHtml: field === "bodyHtml" ? value : (prev[current.id]?.bodyHtml ?? current.bodyHtml),
      },
    }));
  };

  const insertTag = useCallback((tag: string) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? cursorPosRef.current;
    const end = el.selectionEnd ?? start;
    const newBody = el.value.slice(0, start) + tag + el.value.slice(end);
    updateTemplate("bodyHtml", newBody);
    const newPos = start + tag.length;
    cursorPosRef.current = newPos;
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = newPos; }, 0);
  }, [current.id]);

  const preview = useMemo(() => renderPreview(currentBody, current.sampleData, master, currentSubject), [currentBody, current.sampleData, master, currentSubject]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Edit all {DEFAULT_GLOBAL_TEMPLATES.length} global email templates with live preview and tag insertion.</p>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save All
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Template List */}
        <div className="col-span-12 md:col-span-3 space-y-1 max-h-[600px] overflow-y-auto pr-1">
          {DEFAULT_GLOBAL_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id)}
              className={`w-full text-left p-2 rounded-md text-xs transition-colors ${activeTemplate === t.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}
            >
              <div className="font-medium truncate">{t.label}</div>
              <Badge className={`text-[9px] mt-0.5 ${CATEGORY_COLORS[t.category] || ""}`}>{t.category}</Badge>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="col-span-12 md:col-span-5 space-y-3">
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
              onBlur={() => { if (editorRef.current) cursorPosRef.current = editorRef.current.selectionStart; }}
              onClick={() => { if (editorRef.current) cursorPosRef.current = editorRef.current.selectionStart; }}
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
        <div className="col-span-12 md:col-span-4">
          <div className="sticky top-0">
            <div className="flex items-center gap-1 mb-2">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
            </div>
            <div className="border rounded-lg overflow-hidden bg-card">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview) }} className="text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 3: PER-SERVICE TEMPLATES
   ═══════════════════════════════════════════ */

function ServiceTemplatesTab() {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, category, is_active, email_templates")
      .order("display_order");
    if (error) {
      toast({ title: "Error loading services", description: error.message, variant: "destructive" });
    } else {
      setServices(
        (data || []).map((s: any) => ({
          ...s,
          email_templates: s.email_templates && Object.keys(s.email_templates).length > 0 ? s.email_templates : null,
        }))
      );
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const getTemplates = (s: ServiceRow): ServiceEmailTemplates => s.email_templates ?? defaultServiceTemplates(s.name);

  const updateLocal = (id: string, templates: ServiceEmailTemplates) => {
    setServices(prev => prev.map(s => (s.id === id ? { ...s, email_templates: templates } : s)));
  };

  const saveService = async (id: string, templates: ServiceEmailTemplates) => {
    setSaving(prev => new Set(prev).add(id));
    const { error } = await supabase.from("services").update({ email_templates: templates as unknown as import("@/integrations/supabase/types").Json }).eq("id", id);
    setSaving(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: "Email templates updated." });
  };

  const toggleTemplateEnabled = (serviceId: string, key: keyof ServiceEmailTemplates, value: boolean) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const t = { ...getTemplates(svc), [key]: { ...getTemplates(svc)[key], enabled: value } };
    updateLocal(serviceId, t);
  };

  const updateTemplateField = (serviceId: string, key: keyof ServiceEmailTemplates, field: "subject" | "body", value: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const t = { ...getTemplates(svc), [key]: { ...getTemplates(svc)[key], [field]: value } };
    updateLocal(serviceId, t);
  };

  const generateForService = async (serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    setGenerating(prev => new Set(prev).add(serviceId));
    try {
      const { data, error } = await supabase.functions.invoke("notary-assistant", {
        body: {
          prompt: `Generate 4 professional email templates for the notary service "${svc.name}" (category: ${svc.category}). Return a JSON object with keys: booking_confirmation, reminder, follow_up, completion. Each should have "subject" (string) and "body" (HTML string). Return ONLY JSON, no markdown fences.`,
        },
      });
      if (error) throw error;
      const text = typeof data === "string" ? data : data?.text || data?.response || JSON.stringify(data);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");
      const parsed = JSON.parse(jsonMatch[0]);
      const templates = getTemplates(svc);
      for (const tk of SERVICE_TEMPLATE_KEYS) {
        if (parsed[tk.key]) {
          templates[tk.key] = {
            enabled: true,
            subject: parsed[tk.key].subject || templates[tk.key].subject,
            body: sanitizeHtml(parsed[tk.key].body || templates[tk.key].body),
          };
        }
      }
      updateLocal(serviceId, templates);
      toast({ title: "Templates generated", description: `AI templates ready for "${svc.name}". Review and save.` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
    setGenerating(prev => { const n = new Set(prev); n.delete(serviceId); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === services.length) setSelected(new Set());
    else setSelected(new Set(services.map(s => s.id)));
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const bulkEnable = async (enable: boolean) => {
    for (const id of selected) {
      const svc = services.find(s => s.id === id);
      if (!svc) continue;
      const t = getTemplates(svc);
      for (const tk of SERVICE_TEMPLATE_KEYS) t[tk.key].enabled = enable;
      updateLocal(id, t);
      await saveService(id, t);
    }
    toast({ title: enable ? "All enabled" : "All disabled" });
  };

  const bulkGenerate = async () => {
    setBulkGenerating(true);
    for (const id of selected) await generateForService(id);
    setBulkGenerating(false);
    toast({ title: "Bulk generation complete" });
  };

  const bulkReset = async () => {
    for (const id of selected) {
      const t = defaultServiceTemplates();
      updateLocal(id, t);
      await saveService(id, t);
    }
    toast({ title: "Templates reset to defaults" });
  };

  const openPreview = (html: string, subject: string) => {
    setPreviewHtml(`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="margin-bottom:8px;">Subject: ${subject}</h2><hr style="margin-bottom:16px;"/>${html}</div>`);
    setPreviewOpen(true);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 p-3">
            <span className="text-sm font-medium">{selected.size} service{selected.size > 1 ? "s" : ""} selected</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkEnable(true)}><MailCheck className="mr-1 h-3 w-3" /> Enable All</Button>
              <Button size="sm" variant="outline" onClick={() => bulkEnable(false)}>Disable All</Button>
              <Button size="sm" variant="outline" onClick={bulkGenerate} disabled={bulkGenerating}>
                {bulkGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />} Generate All with AI
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={bulkReset}><RefreshCw className="mr-1 h-3 w-3" /> Reset</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 px-1">
        <Checkbox checked={selected.size === services.length && services.length > 0} onCheckedChange={toggleSelectAll} aria-label="Select all services" />
        <span className="text-sm text-muted-foreground">{services.length} service{services.length !== 1 ? "s" : ""}</span>
      </div>

      {services.map(svc => {
        const templates = getTemplates(svc);
        const enabledCount = SERVICE_TEMPLATE_KEYS.filter(tk => templates[tk.key].enabled).length;
        return (
          <Card key={svc.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Checkbox checked={selected.has(svc.id)} onCheckedChange={() => toggleSelect(svc.id)} aria-label={`Select ${svc.name}`} />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {svc.name}
                    <Badge variant="outline" className="text-xs capitalize">{svc.category.replace(/_/g, " ")}</Badge>
                    {!svc.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{enabledCount}/{SERVICE_TEMPLATE_KEYS.length} email types enabled</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => generateForService(svc.id)} disabled={generating.has(svc.id)}>
                    {generating.has(svc.id) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />} Generate
                  </Button>
                  <Button size="sm" onClick={() => saveService(svc.id, templates)} disabled={saving.has(svc.id)}>
                    {saving.has(svc.id) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {SERVICE_TEMPLATE_KEYS.map(({ key, label, icon: Icon }) => {
                  const tpl = templates[key];
                  return (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger className="py-2 text-sm hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{label}</span>
                          {tpl.enabled ? <Badge className="bg-primary/10 text-primary text-[10px]">Active</Badge> : <Badge variant="outline" className="text-[10px] text-muted-foreground">Off</Badge>}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-6">
                          <div className="flex items-center gap-2">
                            <Switch checked={tpl.enabled} onCheckedChange={v => toggleTemplateEnabled(svc.id, key, v)} />
                            <Label className="text-sm">{tpl.enabled ? "Enabled" : "Disabled"}</Label>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Subject Line</Label>
                            <input
                              type="text"
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                              value={tpl.subject}
                              onChange={e => updateTemplateField(svc.id, key, "subject", e.target.value)}
                              placeholder={`e.g. Your ${svc.name} appointment is confirmed`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Email Body</Label>
                            <RichTextEditor value={tpl.body} onChange={v => updateTemplateField(svc.id, key, "body", v)} placeholder="Compose your email template..." minHeight="120px" />
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openPreview(tpl.body, tpl.subject)} disabled={!tpl.body}>
                            <Eye className="mr-1 h-3 w-3" /> Preview
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {services.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">No services found. Add services in the Services management page first.</CardContent>
        </Card>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Email Preview</DialogTitle></DialogHeader>
          <div className="border rounded-lg p-4 bg-card text-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB 4: SETUP & INTEGRATIONS
   ═══════════════════════════════════════════ */

const SUPABASE_URL_DISPLAY = "https://svrebvbcsxaoluafblnq.supabase.co";

interface IntegrationSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  requiredSecrets: string[];
  secretLabels: Record<string, string>;
  edgeFunctions: string[];
  setupSteps: string[];
  webhookUrl?: string;
  notes?: string[];
}

const INTEGRATIONS: IntegrationSection[] = [
  {
    id: "ionos",
    title: "IONOS SMTP — Primary Email Provider",
    icon: Mail,
    description: "All outgoing platform emails (appointment confirmations, reminders, follow-ups, document notifications, correspondence) are sent through IONOS SMTP. This is the primary email delivery channel.",
    requiredSecrets: ["IONOS_EMAIL_ADDRESS", "IONOS_EMAIL_PASSWORD", "IONOS_SMTP_HOST"],
    secretLabels: {
      IONOS_EMAIL_ADDRESS: "Sender email address (e.g. notify@notardex.com)",
      IONOS_EMAIL_PASSWORD: "SMTP password from IONOS account settings",
      IONOS_SMTP_HOST: "SMTP server hostname (typically smtp.ionos.com)",
    },
    edgeFunctions: [
      "send-appointment-emails — Sends booking confirmations & reminders",
      "send-correspondence — Admin-to-client direct emails",
      "send-document-notification — Document status change alerts",
      "send-followup-sequence — Post-appointment follow-up series (3 emails)",
      "send-welcome-sequence — New user onboarding series (3 emails)",
      "send-appointment-reminders — Automated 24hr/30min reminders",
      "ionos-email — Direct IONOS email sending utility",
      "ionos-email-sync — IMAP inbox sync for the Mailbox tab",
    ],
    setupSteps: [
      "1. Log in to your IONOS account at https://my.ionos.com",
      "2. Navigate to Email → Email Accounts → Settings",
      "3. Note your email address and create an app-specific password if available",
      "4. SMTP Host: smtp.ionos.com (default) | IMAP Host: imap.ionos.com",
      "5. SMTP Port: 587 (TLS) | IMAP Port: 993 (SSL)",
      "6. Add the 3 secrets listed above with correct values",
      "7. Optionally add IONOS_IMAP_HOST for Mailbox sync functionality",
    ],
    notes: [
      "If IONOS SMTP fails, the system automatically falls back to Resend API (if configured)",
      "The IMAP sync powers the Admin Mailbox (/admin/mailbox) for viewing incoming emails",
      "All emails are wrapped with the Master Branding template before sending",
    ],
  },
  {
    id: "stripe",
    title: "Stripe — Payments & Invoicing",
    icon: CreditCard,
    description: "Handles client payments for notary services, generates receipts, and processes refunds. Stripe webhooks track payment status changes and trigger automated receipt emails.",
    requiredSecrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    secretLabels: {
      STRIPE_SECRET_KEY: "Secret key from Stripe Dashboard → Developers → API Keys",
      STRIPE_WEBHOOK_SECRET: "Webhook signing secret from Stripe Dashboard → Webhooks",
    },
    edgeFunctions: [
      "create-payment-intent — Creates Stripe PaymentIntents for client checkout",
      "stripe-webhook — Receives payment.succeeded, payment.failed events",
      "process-refund — Initiates refunds via Stripe Refunds API",
      "get-stripe-config — Returns publishable key to the frontend",
    ],
    webhookUrl: `${SUPABASE_URL_DISPLAY}/functions/v1/stripe-webhook`,
    setupSteps: [
      "1. Log in to Stripe Dashboard → https://dashboard.stripe.com",
      "2. Navigate to Developers → API Keys → Copy Secret Key",
      "3. Navigate to Developers → Webhooks → Add Endpoint",
      "4. Set the endpoint URL to the webhook URL shown below",
      "5. Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded",
      "6. Copy the Webhook Signing Secret after creating the endpoint",
      "7. Add both secrets listed above",
    ],
    notes: [
      "The publishable key (STRIPE_PUBLISHABLE_KEY) is stored as a secret but is safe to expose in the frontend",
      "Payment flow: Client fills PaymentForm → create-payment-intent → Stripe checkout → stripe-webhook → receipt email",
      "Refunds are processed via the Admin Revenue page and call the process-refund edge function",
    ],
  },
  {
    id: "signnow",
    title: "SignNow — E-Signing & Document Workflow",
    icon: PenTool,
    description: "Enables electronic signature collection on documents. SignNow handles document uploads, signing invitations, and completion tracking with automated webhook notifications.",
    requiredSecrets: ["SIGNNOW_API_KEY", "SIGNNOW_API_TOKEN", "SIGNNOW_WEBHOOK_SECRET"],
    secretLabels: {
      SIGNNOW_API_KEY: "API Key from SignNow Developer Portal → Apps",
      SIGNNOW_API_TOKEN: "Bearer token for API authentication",
      SIGNNOW_WEBHOOK_SECRET: "HMAC-SHA256 secret for webhook validation",
    },
    edgeFunctions: [
      "signnow — Document upload, invite creation, and status queries",
      "signnow-webhook — Receives document.complete, document.update, invite events",
    ],
    webhookUrl: `${SUPABASE_URL_DISPLAY}/functions/v1/signnow-webhook`,
    setupSteps: [
      "1. Create a SignNow Developer account at https://www.signnow.com/developers",
      "2. Create an Application to get your API Key and Token",
      "3. Configure webhook subscriptions for your application",
      "4. Set the callback URL to the webhook URL shown below",
      "5. Enable events: document.complete, document.update, document.delete, invite.sent, invite.signed",
      "6. Copy the webhook secret for HMAC signature validation",
      "7. Add all 3 secrets listed above",
    ],
    notes: [
      "Document-level webhooks are automatically registered during upload for session integrity",
      "The admin Integration Hub (/admin/integrations) shows real-time SignNow diagnostic status",
      "HMAC-SHA256 signature verification ensures webhook authenticity",
    ],
  },
  {
    id: "hubspot",
    title: "HubSpot — CRM & Lead Sync",
    icon: Users,
    description: "Synchronizes leads, contacts, and deals between the platform and HubSpot CRM. Enables two-way data flow for pipeline management and marketing automation.",
    requiredSecrets: ["HubSpot_Developer_Key", "HubSpot_Service_Key"],
    secretLabels: {
      HubSpot_Developer_Key: "Developer API Key from HubSpot Settings → Integrations → API Key",
      HubSpot_Service_Key: "Private App access token from HubSpot Settings → Integrations → Private Apps",
    },
    edgeFunctions: [
      "hubspot-sync — Bidirectional contact/deal synchronization",
      "discover-leads — Uses HubSpot data for lead scoring",
    ],
    setupSteps: [
      "1. Log in to HubSpot at https://app.hubspot.com",
      "2. Navigate to Settings → Integrations → API Key → Generate if needed",
      "3. For enhanced access: Settings → Integrations → Private Apps → Create Private App",
      "4. Grant scopes: crm.objects.contacts.read/write, crm.objects.deals.read/write",
      "5. Copy the access token as the Service Key",
      "6. Add both secrets listed above",
    ],
    notes: [
      "Lead sync maps: full_name → firstname/lastname, email → email, phone → phone, service_type → dealname",
      "Deals are synced with the pipeline stage mapping defined in the hubspot-sync function",
      "The CRM Activities table logs all sync operations for audit compliance",
    ],
  },
  {
    id: "google-calendar",
    title: "Google Calendar — Scheduling Sync",
    icon: Calendar,
    description: "Syncs confirmed appointments to Google Calendar for scheduling visibility. Enables real-time availability checks and calendar event creation.",
    requiredSecrets: [],
    secretLabels: {},
    edgeFunctions: [
      "google-calendar-sync — Creates/updates/deletes calendar events for appointments",
    ],
    setupSteps: [
      "1. Go to Google Cloud Console → https://console.cloud.google.com",
      "2. Create a project or select existing → Enable Google Calendar API",
      "3. Create OAuth 2.0 credentials (Web Application type)",
      "4. Add authorized redirect URI for your domain",
      "5. Configure the OAuth consent screen with calendar scopes",
      "6. Store the client ID and client secret as secrets if implementing server-side sync",
      "7. Currently uses client-side OAuth flow via the Google Calendar widget",
    ],
    notes: [
      "The platform includes a Google Calendar widget on the admin dashboard for quick viewing",
      "Appointment status changes (confirmed/cancelled/rescheduled) trigger calendar event updates",
      "Currently uses a link-only integration — notaries can manually add events via .ICS downloads",
    ],
  },
  {
    id: "onenotary",
    title: "OneNotary — Compliance & RON Verification",
    icon: Shield,
    description: "Connects to OneNotary for Remote Online Notarization compliance checks, notary credential verification, and session audit trail reporting per Ohio ORC §147.66.",
    requiredSecrets: ["ONENOTARY_API_TOKEN"],
    secretLabels: {
      ONENOTARY_API_TOKEN: "API Token from OneNotary platform settings",
    },
    edgeFunctions: [
      "ai-compliance-scan — Uses OneNotary data for compliance verification",
    ],
    setupSteps: [
      "1. Log in to your OneNotary account",
      "2. Navigate to Settings → API Access → Generate Token",
      "3. Copy the API token and add it as the secret listed above",
      "4. Ensure your notary commission details are up to date in OneNotary",
    ],
    notes: [
      "Compliance data supplements the platform's built-in Ohio RON compliance checks",
      "The Compliance Report page (/admin/compliance) aggregates OneNotary data",
      "All compliance checks are logged to the audit_log table for record retention",
    ],
  },
];

const EMAIL_PIPELINE_MAP: { emailType: string; trigger: string; edgeFunction: string; provider: string; source: "notardex" | "signnow" | "lovable" | "stripe" | "google" }[] = [
  // --- Notar Internal Emails ---
  { emailType: "Booking Confirmation", trigger: "New appointment created", edgeFunction: "send-appointment-emails", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "24hr Reminder", trigger: "Scheduled (cron)", edgeFunction: "send-appointment-reminders", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "30min Reminder", trigger: "Scheduled (cron)", edgeFunction: "send-appointment-reminders", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Completion / Thank You", trigger: "Appointment status → completed", edgeFunction: "send-followup-sequence", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Feedback Request (NPS)", trigger: "Completion +2 days", edgeFunction: "send-followup-sequence", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Referral Invitation", trigger: "Completion +5 days", edgeFunction: "send-followup-sequence", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Welcome Onboarding (3-part)", trigger: "New user signup", edgeFunction: "send-welcome-sequence", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Document Status Update", trigger: "Document status change", edgeFunction: "send-document-notification", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Direct Correspondence", trigger: "Admin sends from CRM", edgeFunction: "send-correspondence", provider: "IONOS SMTP → Resend fallback", source: "notardex" },
  { emailType: "Payment Receipt", trigger: "Stripe payment.succeeded", edgeFunction: "stripe-webhook", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Lead Confirmation", trigger: "Contact form submission", edgeFunction: "submit-lead", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "RON Session Link", trigger: "Session ready / notary sends", edgeFunction: "send-appointment-emails", provider: "IONOS SMTP", source: "notardex" },
  { emailType: "Document Ready for Download", trigger: "Document status → notarized", edgeFunction: "send-document-notification", provider: "IONOS SMTP", source: "notardex" },
  // --- Auth Emails (Lovable Email Queue) ---
  { emailType: "Signup Confirmation", trigger: "Auth: new signup", edgeFunction: "auth-email-hook → process-email-queue", provider: "Lovable Email Queue", source: "lovable" },
  { emailType: "Password Recovery", trigger: "Auth: forgot password", edgeFunction: "auth-email-hook → process-email-queue", provider: "Lovable Email Queue", source: "lovable" },
  { emailType: "Magic Link Login", trigger: "Auth: magic link request", edgeFunction: "auth-email-hook → process-email-queue", provider: "Lovable Email Queue", source: "lovable" },
  { emailType: "Email Change Verification", trigger: "Auth: email change", edgeFunction: "auth-email-hook → process-email-queue", provider: "Lovable Email Queue", source: "lovable" },
  { emailType: "Team / Notary Invite", trigger: "Auth: admin invites user", edgeFunction: "auth-email-hook → process-email-queue", provider: "Lovable Email Queue", source: "lovable" },
  { emailType: "Reauthentication Code", trigger: "Auth: sensitive action", edgeFunction: "auth-email-hook → process-email-queue", provider: "Lovable Email Queue", source: "lovable" },
  // --- SignNow External Emails ---
  { emailType: "Signing Invitation", trigger: "Document uploaded + invite sent via SignNow", edgeFunction: "signnow (action: send_invite)", provider: "SignNow Platform", source: "signnow" },
  { emailType: "Signing Reminder", trigger: "Auto-scheduled by SignNow for unsigned docs", edgeFunction: "N/A (SignNow internal)", provider: "SignNow Platform", source: "signnow" },
  { emailType: "Document Completed", trigger: "All parties have signed", edgeFunction: "signnow-webhook (event: document.complete)", provider: "SignNow Platform", source: "signnow" },
  { emailType: "Invite Viewed", trigger: "Signer opens document link", edgeFunction: "signnow-webhook (event: document.update)", provider: "SignNow Platform", source: "signnow" },
  { emailType: "Invite Cancelled", trigger: "Admin cancels signing invitation", edgeFunction: "signnow (action: cancel_invite)", provider: "SignNow Platform", source: "signnow" },
  // --- Stripe External Emails ---
  { emailType: "Payment Receipt", trigger: "Successful charge / payment_intent.succeeded", edgeFunction: "stripe-webhook (idempotency logged)", provider: "Stripe Platform", source: "stripe" },
  { emailType: "Refund Confirmation", trigger: "charge.refunded event", edgeFunction: "stripe-webhook (status → refunded)", provider: "Stripe Platform", source: "stripe" },
  { emailType: "Payment Failed Notice", trigger: "payment_intent.payment_failed", edgeFunction: "stripe-webhook (status → failed)", provider: "Stripe Platform", source: "stripe" },
  { emailType: "Subscription Confirmation", trigger: "customer.subscription.created", edgeFunction: "stripe-webhook (plan updated)", provider: "Stripe Platform", source: "stripe" },
  { emailType: "Subscription Cancelled", trigger: "customer.subscription.deleted", edgeFunction: "stripe-webhook (plan → free)", provider: "Stripe Platform", source: "stripe" },
  { emailType: "Invoice / Upcoming Payment", trigger: "invoice.upcoming / invoice.payment_succeeded", edgeFunction: "N/A (Stripe internal)", provider: "Stripe Platform", source: "stripe" },
  // --- Google Calendar External Emails ---
  { emailType: "Calendar Invite (ICS)", trigger: "Appointment booked + calendar sync", edgeFunction: "google-calendar-sync", provider: "Google Calendar", source: "google" },
  { emailType: "Event Reminder", trigger: "Auto-scheduled by Google (default 30min)", edgeFunction: "N/A (Google internal)", provider: "Google Calendar", source: "google" },
  { emailType: "Event Updated", trigger: "Appointment rescheduled", edgeFunction: "google-calendar-sync (update)", provider: "Google Calendar", source: "google" },
  { emailType: "Event Cancelled", trigger: "Appointment cancelled", edgeFunction: "google-calendar-sync (delete)", provider: "Google Calendar", source: "google" },
];

function IntegrationSetupTab() {
  const [healthChecks, setHealthChecks] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-check");
      if (error) throw error;
      setHealthChecks(data?.checks || {});
    } catch (e: any) {
      toast({ title: "Health check failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkHealth(); }, []);

  const getSecretStatus = (secretName: string): "configured" | "unknown" => {
    if (!healthChecks) return "unknown";
    const keyMap: Record<string, string> = {
      STRIPE_SECRET_KEY: "stripe_configured",
      IONOS_EMAIL_ADDRESS: "ionos_configured",
    };
    const healthKey = keyMap[secretName];
    if (healthKey && healthChecks[healthKey] !== undefined) {
      return healthChecks[healthKey] ? "configured" : "unknown";
    }
    return "unknown";
  };

  const testCorrespondence = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-correspondence", {
        body: { dry_run: true },
      });
      if (error) throw error;
      toast({ title: "Connection test passed", description: "Correspondence function is responding correctly." });
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Integration Setup & Configuration Guide</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Detailed instructions for configuring all API connections and verifying they work correctly.</p>
        </div>
        <Button size="sm" variant="outline" onClick={checkHealth} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Refresh Status
        </Button>
      </div>

      {/* Integration Sections */}
      <Accordion type="multiple" className="w-full space-y-2">
        {INTEGRATIONS.map(integration => {
          const Icon = integration.icon;
          const allConfigured = integration.requiredSecrets.length === 0 || integration.requiredSecrets.every(s => getSecretStatus(s) === "configured");

          return (
            <AccordionItem key={integration.id} value={integration.id} className="border rounded-lg px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    allConfigured ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{integration.title}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {integration.requiredSecrets.length > 0
                        ? `${integration.requiredSecrets.length} secret${integration.requiredSecrets.length !== 1 ? "s" : ""} required`
                        : "No secrets required"
                      }
                    </div>
                  </div>
                  <div className="ml-auto mr-2">
                    {integration.requiredSecrets.length === 0 ? (
                      <Badge className="bg-blue-500/10 text-blue-700 text-[10px]">Client-side</Badge>
                    ) : allConfigured ? (
                      <Badge className="bg-green-500/10 text-green-700 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Configured</Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-700 text-[10px]"><AlertCircle className="h-3 w-3 mr-1" /> Check Secrets</Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-2">
                  {/* Description */}
                  <p className="text-xs text-muted-foreground">{integration.description}</p>

                  {/* Required Secrets */}
                  {integration.requiredSecrets.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Required Secrets</h4>
                      <div className="space-y-1.5">
                        {integration.requiredSecrets.map(secret => (
                          <div key={secret} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5">
                            <code className="text-[11px] font-mono font-medium">{secret}</code>
                            <span className="text-[10px] text-muted-foreground flex-1">— {integration.secretLabels[secret]}</span>
                            {getSecretStatus(secret) === "configured" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edge Functions */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Connected Backend Functions</h4>
                    <div className="space-y-1">
                      {integration.edgeFunctions.map((fn, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3 shrink-0 text-primary/60" />
                          <span>{fn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Webhook URL */}
                  {integration.webhookUrl && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Webhook Endpoint</h4>
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded border border-border flex-1 break-all">{integration.webhookUrl}</code>
                        <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => { navigator.clipboard.writeText(integration.webhookUrl!); toast({ title: "Copied to clipboard" }); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Setup Steps */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Settings className="h-3 w-3" /> Setup Instructions</h4>
                    <ol className="space-y-1">
                      {integration.setupSteps.map((step, i) => (
                        <li key={i} className="text-xs text-muted-foreground pl-1">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Notes */}
                  {integration.notes && integration.notes.length > 0 && (
                    <div className="rounded-md bg-blue-500/5 border border-blue-500/10 p-3">
                      <h4 className="text-xs font-semibold mb-1.5 text-blue-700 dark:text-blue-400">Important Notes</h4>
                      <ul className="space-y-1">
                        {integration.notes.map((note, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Test buttons */}
                  {integration.id === "ionos" && (
                    <Button size="sm" variant="outline" onClick={testCorrespondence} className="text-xs">
                      <Mail className="h-3 w-3 mr-1" /> Test Email Connection (Dry Run)
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}

        {/* Email Delivery Pipeline */}
        <AccordionItem value="pipeline" className="border rounded-lg px-4">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-600">
                <Server className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">Email Delivery Pipeline Overview</div>
                <div className="text-[10px] text-muted-foreground">How emails flow from templates to client inboxes</div>
              </div>
              <Badge className="ml-auto mr-2 bg-purple-500/10 text-purple-700 text-[10px]">Reference</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2">
              {/* Flow diagram */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {["Template Hub", "Edge Function", "IONOS SMTP / Email Queue", "Client Inbox"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="rounded-md bg-muted px-2.5 py-1 font-medium border border-border">{step}</span>
                    {i < 3 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                ))}
              </div>

              {/* Mapping table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Source</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Email Type</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Trigger</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Backend Function</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EMAIL_PIPELINE_MAP.map((row, i) => {
                      const sourceColors: Record<string, string> = {
                        notardex: "bg-primary/10 text-primary",
                        signnow: "bg-orange-500/10 text-orange-700",
                        lovable: "bg-blue-500/10 text-blue-700",
                        stripe: "bg-violet-500/10 text-violet-700",
                        google: "bg-emerald-500/10 text-emerald-700",
                      };
                      const sourceLabels: Record<string, string> = {
                        notardex: "Notar",
                        signnow: "SignNow",
                        lovable: "Auth System",
                        stripe: "Stripe",
                        google: "Google",
                      };
                      return (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5 pr-4">
                            <Badge className={`${sourceColors[row.source]} text-[9px] font-bold`}>{sourceLabels[row.source]}</Badge>
                          </td>
                          <td className="py-1.5 pr-4 font-medium">{row.emailType}</td>
                          <td className="py-1.5 pr-4 text-muted-foreground">{row.trigger}</td>
                          <td className="py-1.5 pr-4 font-mono text-[10px]">{row.edgeFunction}</td>
                          <td className="py-1.5 text-muted-foreground">{row.provider}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SignNow External Emails Explainer */}
              <div className="rounded-md bg-orange-500/5 border border-orange-500/10 p-3 space-y-2">
                <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                  <PenTool className="h-3 w-3" /> SignNow External Emails
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  The emails marked <Badge className="bg-orange-500/10 text-orange-700 text-[8px] font-bold mx-0.5">SignNow</Badge> are
                  sent <strong>directly by SignNow's platform</strong>, not by Notar. Their content, branding, and delivery schedule are
                  controlled in your <a href="https://app.signnow.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">SignNow account settings</a>.
                  Notar receives webhook events for these emails and tracks them in the CRM timeline and <code className="bg-muted px-1 py-0.5 rounded text-[9px]">signnow_documents</code> table.
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  <li>• <strong>Signing invitations</strong> — sent when you use "Send Invite" in RON Session; customizable in SignNow → Settings → Notifications</li>
                  <li>• <strong>Auto-reminders</strong> — frequency set in SignNow → Settings → Notifications → Reminder Schedule</li>
                  <li>• <strong>Completion emails</strong> — sent to all parties with signed PDF attached; configured in SignNow account</li>
                  <li>• <strong>Webhook tracking</strong> — all SignNow email events are logged to <code className="bg-muted px-1 py-0.5 rounded text-[9px]">webhook_events</code> and <code className="bg-muted px-1 py-0.5 rounded text-[9px]">crm_activities</code></li>
                </ul>
              </div>

              {/* Stripe External Emails Explainer */}
              <div className="rounded-md bg-violet-500/5 border border-violet-500/10 p-3 space-y-2">
                <h4 className="text-xs font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Stripe External Emails
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  The emails marked <Badge className="bg-violet-500/10 text-violet-700 text-[8px] font-bold mx-0.5">Stripe</Badge> are
                  sent <strong>directly by Stripe's platform</strong>, not by Notar. Their content and delivery are controlled in your{" "}
                  <a href="https://dashboard.stripe.com/settings/emails" target="_blank" rel="noopener noreferrer" className="underline text-primary">Stripe Dashboard → Settings → Emails</a>.
                  Notar receives webhook events for payment lifecycle changes and updates payment status accordingly.
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  <li>• <strong>Payment receipts</strong> — Stripe sends automatic receipts on successful charges; enable/disable in Stripe → Settings → Customer emails</li>
                  <li>• <strong>Refund confirmations</strong> — sent when a refund is processed; tracked via <code className="bg-muted px-1 py-0.5 rounded text-[9px]">charge.refunded</code> webhook</li>
                  <li>• <strong>Failed payment notices</strong> — Stripe notifies customers of failed charges; tracked via <code className="bg-muted px-1 py-0.5 rounded text-[9px]">payment_intent.payment_failed</code></li>
                  <li>• <strong>Subscription emails</strong> — invoices, upcoming payments, and cancellation notices are sent by Stripe Billing</li>
                  <li>• <strong>Webhook tracking</strong> — all Stripe events are logged to <code className="bg-muted px-1 py-0.5 rounded text-[9px]">webhook_events</code> and <code className="bg-muted px-1 py-0.5 rounded text-[9px]">audit_log</code> with idempotency checks</li>
                </ul>
              </div>

              {/* Google Calendar External Emails Explainer */}
              <div className="rounded-md bg-emerald-500/5 border border-emerald-500/10 p-3 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Google Calendar Emails
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  The emails marked <Badge className="bg-emerald-500/10 text-emerald-700 text-[8px] font-bold mx-0.5">Google</Badge> are
                  sent <strong>directly by Google Calendar</strong> when events are created, updated, or deleted through the calendar sync.
                  Calendar invite formatting and reminder schedules are managed by Google.
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  <li>• <strong>Calendar invites (ICS)</strong> — Google sends invitations with .ics attachments when an appointment syncs to calendar via <code className="bg-muted px-1 py-0.5 rounded text-[9px]">google-calendar-sync</code></li>
                  <li>• <strong>Event reminders</strong> — Google sends default reminders (30 min before); configurable per-calendar in Google Calendar settings</li>
                  <li>• <strong>Reschedule notifications</strong> — Google automatically notifies attendees when appointment times change</li>
                  <li>• <strong>Cancellation emails</strong> — sent when an appointment is cancelled and the calendar event is deleted</li>
                </ul>
              </div>

              <div className="rounded-md bg-muted/50 border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold">Retry & Delivery Logic</h4>
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  <li>• <strong>Primary:</strong> IONOS SMTP (port 587, TLS) for all transactional emails</li>
                  <li>• <strong>Fallback:</strong> Resend API is used when IONOS fails (if RESEND_API_KEY is set)</li>
                  <li>• <strong>Auth emails:</strong> Processed through a durable pgmq queue with automatic retries (max 5 attempts)</li>
                  <li>• <strong>Rate limiting:</strong> On 429 responses, the dispatcher backs off using the Retry-After header</li>
                  <li>• <strong>Dead letter queue:</strong> After 5 failures, messages move to DLQ and are logged as 'dlq' in email_send_log</li>
                  <li>• <strong>TTL:</strong> Auth emails expire after 15 min; transactional emails expire after 60 min</li>
                  <li>• <strong>Branding:</strong> All outgoing emails are wrapped with the Master Branding template (Tab 1)</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function AdminAutomatedEmails() {
  const { toast } = useToast();
  const { data: savedSettings, isLoading: settingsLoading, save: saveSettings } = useGlobalEmailSettings();
  const [master, setMaster] = useState<MasterTemplate>(DEFAULT_MASTER);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, { subject: string; bodyHtml: string }>>({});
  const [uploading, setUploading] = useState(false);

  // Load saved settings
  useEffect(() => {
    if (savedSettings) {
      try {
        const parsed = typeof savedSettings === "string" ? JSON.parse(savedSettings) : savedSettings;
        if (parsed.master) setMaster({ ...DEFAULT_MASTER, ...parsed.master });
        if (parsed.templates) setEditedTemplates(parsed.templates);
      } catch {
        // Use defaults
      }
    }
  }, [savedSettings]);

  const handleSaveGlobal = () => {
    saveSettings.mutate(
      { master, templates: editedTemplates },
      {
        onSuccess: () => toast({ title: "Saved", description: "All global email templates and branding saved." }),
        onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  if (settingsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-3 mb-2">
        <p className="text-xs text-muted-foreground">
          <strong>Central Email Template Hub</strong> — All email templates are managed here. The Master Branding tab controls the global wrapper (colors, logo, footer) applied to every outgoing email. Global Templates cover auth, notifications, and system emails. Service Templates provide per-service overrides for booking workflows. The Setup & Integrations tab provides detailed configuration instructions for all connected services.
        </p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="branding" className="flex items-center gap-1.5 text-xs">
            <Palette className="h-3.5 w-3.5" /> Master Branding
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-1.5 text-xs">
            <FileEdit className="h-3.5 w-3.5" /> Global Templates
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5" /> Service Templates
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1.5 text-xs">
            <Settings className="h-3.5 w-3.5" /> Setup & Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-4">
          <MasterBrandingTab
            master={master}
            setMaster={setMaster}
            onSave={handleSaveGlobal}
            saving={saveSettings.isPending}
            uploading={uploading}
            setUploading={setUploading}
          />
        </TabsContent>

        <TabsContent value="global" className="mt-4">
          <GlobalTemplatesTab
            master={master}
            editedTemplates={editedTemplates}
            setEditedTemplates={setEditedTemplates}
            onSave={handleSaveGlobal}
            saving={saveSettings.isPending}
          />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServiceTemplatesTab />
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <IntegrationSetupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
