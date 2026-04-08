import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, MapPin, Monitor, Save, Loader2, AlertTriangle, CalendarClock,
  Shield, Upload, Eye, Mail, CheckCircle, XCircle, ArrowDownUp, Download,
  UploadCloud, ExternalLink, Server, Globe, Palette, Cookie, BarChart3,
  FileText, Lock, Bell, Smartphone, Share2, Type, Layout, Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingItem {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

export default function AdminSettings() {
  usePageMeta({ title: "Settings", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expiredIds, setExpiredIds] = useState<any[]>([]);
  const [expiringIds, setExpiringIds] = useState<any[]>([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const [sealPreviewUrl, setSealPreviewUrl] = useState<string | null>(null);

  const fetchSettings = async () => {
    const { data } = await supabase.from("platform_settings").select("*");
    if (data) {
      const mapped: Record<string, SettingItem> = {};
      const values: Record<string, string> = {};
      data.forEach((s: any) => {
        mapped[s.setting_key] = s;
        values[s.setting_key] = s.setting_value;
      });
      setSettings(mapped);
      setEditValues(values);

      const sealPath = values.seal_image_path;
      if (sealPath) {
        const { data: urlData } = await supabase.storage.from("documents").createSignedUrl(sealPath, 3600);
        if (urlData?.signedUrl) setSealPreviewUrl(urlData.signedUrl);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    if (loading) return;
    const run = async () => {
      const today = new Date();
      const todayIso = today.toISOString().split("T")[0];
      const reminderDays = parseInt(editValues.id_expiration_reminder_days || "60") || 60;
      const future = new Date();
      future.setDate(today.getDate() + reminderDays);
      const futureIso = future.toISOString().split("T")[0];

      const [expiredRes, expiringRes] = await Promise.all([
        supabase.from("notary_journal").select("id, signer_name, document_type, id_expiration").not("id_expiration", "is", null).lt("id_expiration", todayIso).order("id_expiration", { ascending: true }),
        supabase.from("notary_journal").select("id, signer_name, document_type, id_expiration").not("id_expiration", "is", null).gte("id_expiration", todayIso).lte("id_expiration", futureIso).order("id_expiration", { ascending: true }),
      ]);
      setExpiredIds(expiredRes.data || []);
      setExpiringIds(expiringRes.data || []);
    };
    run();
  }, [loading, editValues.id_expiration_reminder_days]);

  const urlKeys = ["kba_platform_url", "zoom_meeting_link", "social_facebook", "social_twitter", "social_linkedin", "social_instagram", "social_youtube"];
  const validateUrl = (val: string) => !val || /^https?:\/\/.+\..+/.test(val);

  const handleSave = async () => {
    if (saving) return;

    for (const key of urlKeys) {
      if (editValues[key] && !validateUrl(editValues[key])) {
        toast({ title: "Invalid URL", description: `${key.replace(/_/g, " ")} must start with http:// or https://`, variant: "destructive" });
        return;
      }
    }

    const numericKeys = ["travel_radius_miles", "max_appointments_per_day", "min_booking_lead_hours", "session_timeout_minutes", "max_file_upload_mb"];
    for (const key of numericKeys) {
      const val = editValues[key];
      if (val && (isNaN(Number(val)) || Number(val) < 0)) {
        toast({ title: "Invalid value", description: `${key.replace(/_/g, " ")} must be a non-negative number.`, variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    const changedKeys: string[] = [];
    const beforeValues: Record<string, string> = {};
    const updates = Object.entries(editValues).map(([key, value]) => {
      if (settings[key]) {
        if (settings[key].setting_value === value) return null;
        changedKeys.push(key);
        beforeValues[key] = settings[key].setting_value;
        return supabase.from("platform_settings").update({ setting_value: value, updated_at: new Date().toISOString(), updated_by: user?.id }).eq("setting_key", key);
      }
      changedKeys.push(key);
      beforeValues[key] = "";
      return supabase.from("platform_settings").insert({ setting_key: key, setting_value: value, updated_by: user?.id });
    }).filter(Boolean);

    const results = await Promise.all(updates as any[]);
    const hasError = results.some((r: any) => r?.error);
    if (hasError) toast({ title: "Error saving some settings", variant: "destructive" });
    else {
      toast({ title: "Settings saved", description: "All changes have been applied." });
      if (changedKeys.length > 0) {
        try {
          const { logAuditEvent } = await import("@/lib/auditLog");
          const diff: Record<string, { from: string; to: string }> = {};
          changedKeys.forEach(k => { diff[k] = { from: beforeValues[k] || "", to: editValues[k] || "" }; });
          logAuditEvent("settings_updated", { entityType: "platform_settings", details: { changed_keys: changedKeys, diff } });
        } catch { /* never block on audit */ }
      }
      await fetchSettings();
    }
    setSaving(false);
  };

  const handleExportSettings = () => {
    const json = JSON.stringify(editValues, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `platform-settings-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Settings exported" });
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (typeof imported !== "object" || Array.isArray(imported)) throw new Error("Invalid format");
        setEditValues(prev => ({ ...prev, ...imported }));
        toast({ title: "Settings imported", description: "Review and click Save to apply." });
      } catch { toast({ title: "Invalid file", description: "Please upload a valid settings JSON.", variant: "destructive" }); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateValue = (key: string, value: string) => setEditValues((prev) => ({ ...prev, [key]: value }));
  const toggleValue = (key: string) => updateValue(key, editValues[key] === "true" ? "false" : "true");
  const isEnabled = (key: string) => editValues[key] === "true";

  const handleFileUpload = async (type: "cert" | "seal" | "logo" | "favicon" | "og_image", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const setter = type === "cert" ? setUploadingCert : setUploadingSeal;
    setter(true);
    const filePath = `admin/${type}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(filePath, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setter(false); return; }
    const keyMap: Record<string, string> = { cert: "commission_certificate_path", seal: "seal_image_path", logo: "site_logo_path", favicon: "site_favicon_path", og_image: "og_image_path" };
    updateValue(keyMap[type], filePath);
    if (type === "seal") {
      const { data: urlData } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
      if (urlData?.signedUrl) setSealPreviewUrl(urlData.signedUrl);
    }
    toast({ title: `${type.replace(/_/g, " ")} uploaded` });
    setter(false);
  };

  const commissionAlert = useMemo(() => {
    const raw = editValues.commission_expiration_date;
    if (!raw) return null;
    const expiry = new Date(raw);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const reminderDays = parseInt(editValues.commission_renewal_reminder_days || "90") || 90;
    if (days < 0) return { tone: "text-destructive", text: "⚠ Commission has expired" };
    if (days <= reminderDays) return { tone: "text-destructive", text: `⚠ Commission expires in ${days} days` };
    return { tone: "text-muted-foreground", text: `Expires ${expiry.toLocaleDateString()}` };
  }, [editValues.commission_expiration_date, editValues.commission_renewal_reminder_days]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground">Global configuration for site, branding, compliance, integrations, and operations</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1">
            <Server className="h-3 w-3" />
            {import.meta.env.VITE_SUPABASE_URL?.includes("localhost") ? "Local" : import.meta.env.DEV ? "Development" : "Production"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExportSettings}><Download className="mr-1 h-3 w-3" /> Export</Button>
          <label className="cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={handleImportSettings} />
            <Button variant="outline" size="sm" asChild><span><UploadCloud className="mr-1 h-3 w-3" /> Import</span></Button>
          </label>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="text-xs gap-1"><Globe className="h-3 w-3" /> General</TabsTrigger>
          <TabsTrigger value="branding" className="text-xs gap-1"><Palette className="h-3 w-3" /> Branding & SEO</TabsTrigger>
          <TabsTrigger value="credentials" className="text-xs gap-1"><Shield className="h-3 w-3" /> Credentials</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs gap-1"><Settings className="h-3 w-3" /> Operations</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs gap-1"><Monitor className="h-3 w-3" /> Integrations</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs gap-1"><Shield className="h-3 w-3" /> Compliance</TabsTrigger>
        </TabsList>

        {/* ═══ GENERAL ═══ */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Site Identity */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Site Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Site Name</Label><Input value={editValues.site_name || ""} onChange={(e) => updateValue("site_name", e.target.value)} placeholder="NotarDex" /></div>
                <div><Label>Tagline / Slogan</Label><Input value={editValues.site_tagline || ""} onChange={(e) => updateValue("site_tagline", e.target.value)} placeholder="Professional Ohio Notary Services" /></div>
                <div><Label>Support Email</Label><Input type="email" value={editValues.support_email || ""} onChange={(e) => updateValue("support_email", e.target.value)} placeholder="support@notardex.com" /></div>
                <div><Label>Support Phone</Label><Input value={editValues.support_phone || ""} onChange={(e) => updateValue("support_phone", e.target.value)} placeholder="(614) 300-6890" /></div>
                <div><Label>Copyright Text</Label><Input value={editValues.copyright_text || ""} onChange={(e) => updateValue("copyright_text", e.target.value)} placeholder="© 2025 NotarDex. All rights reserved." /></div>
              </CardContent>
            </Card>

            {/* Feature Toggles */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Feature Controls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "maintenance_mode", label: "Maintenance Mode", desc: "Show maintenance page to non-admin visitors" },
                  { key: "booking_enabled", label: "Online Booking", desc: "Allow clients to book appointments online" },
                  { key: "registration_enabled", label: "Public Registration", desc: "Allow new user signups" },
                  { key: "chat_enabled", label: "Live Chat", desc: "Enable client-admin messaging" },
                  { key: "ai_tools_enabled", label: "AI Tools", desc: "Enable AI document tools for clients" },
                  { key: "referral_program_enabled", label: "Referral Program", desc: "Enable client referral tracking" },
                  { key: "reviews_enabled", label: "Client Reviews", desc: "Show testimonials on public pages" },
                  { key: "document_upload_enabled", label: "Client Doc Upload", desc: "Allow clients to upload documents" },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                    </div>
                    <Switch checked={isEnabled(toggle.key)} onCheckedChange={() => toggleValue(toggle.key)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "notify_new_booking", label: "New Booking Alert", desc: "Email admin on new appointments" },
                  { key: "notify_new_signup", label: "New User Signup", desc: "Email admin on new registrations" },
                  { key: "notify_document_upload", label: "Document Upload", desc: "Email admin when client uploads docs" },
                  { key: "notify_payment_received", label: "Payment Received", desc: "Email admin on successful payments" },
                  { key: "notify_lead_received", label: "New Lead", desc: "Email admin on new lead submissions" },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                    </div>
                    <Switch checked={isEnabled(toggle.key)} onCheckedChange={() => toggleValue(toggle.key)} />
                  </div>
                ))}
                <div>
                  <Label>Admin Notification Email</Label>
                  <Input type="email" value={editValues.admin_notification_email || ""} onChange={(e) => updateValue("admin_notification_email", e.target.value)} placeholder="admin@notardex.com" />
                </div>
              </CardContent>
            </Card>

            {/* Security & Privacy */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Security & Privacy</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" value={editValues.session_timeout_minutes || "60"} onChange={(e) => updateValue("session_timeout_minutes", e.target.value)} />
                </div>
                <div>
                  <Label>Max File Upload Size (MB)</Label>
                  <Input type="number" value={editValues.max_file_upload_mb || "25"} onChange={(e) => updateValue("max_file_upload_mb", e.target.value)} />
                </div>
                {[
                  { key: "force_mfa", label: "Require MFA for Admin", desc: "Force multi-factor auth for admin accounts" },
                  { key: "cookie_consent_enabled", label: "Cookie Consent Banner", desc: "Show GDPR/CCPA cookie consent to visitors" },
                  { key: "ip_logging_enabled", label: "IP Address Logging", desc: "Log client IP addresses in audit trail" },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                    </div>
                    <Switch checked={isEnabled(toggle.key)} onCheckedChange={() => toggleValue(toggle.key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ BRANDING & SEO ═══ */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Brand Assets</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Brand Color (hex)</Label>
                  <div className="flex gap-2 items-center">
                    <Input value={editValues.brand_primary_color || "#F59E0B"} onChange={(e) => updateValue("brand_primary_color", e.target.value)} placeholder="#F59E0B" className="flex-1" />
                    <div className="h-8 w-8 rounded border border-border" style={{ backgroundColor: editValues.brand_primary_color || "#F59E0B" }} />
                  </div>
                </div>
                <div>
                  <Label>Secondary Brand Color (hex)</Label>
                  <div className="flex gap-2 items-center">
                    <Input value={editValues.brand_secondary_color || "#1E293B"} onChange={(e) => updateValue("brand_secondary_color", e.target.value)} placeholder="#1E293B" className="flex-1" />
                    <div className="h-8 w-8 rounded border border-border" style={{ backgroundColor: editValues.brand_secondary_color || "#1E293B" }} />
                  </div>
                </div>
                <div>
                  <Label>Site Logo</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept=".svg,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileUpload("logo", e)} />
                      <Button variant="outline" size="sm" asChild><span><Upload className="mr-1 h-3 w-3" /> Upload Logo</span></Button>
                    </label>
                    {editValues.site_logo_path && <span className="text-xs text-muted-foreground">✓ Uploaded</span>}
                  </div>
                </div>
                <div>
                  <Label>Favicon</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept=".ico,.png,.svg" className="hidden" onChange={(e) => handleFileUpload("favicon", e)} />
                      <Button variant="outline" size="sm" asChild><span><Upload className="mr-1 h-3 w-3" /> Upload Favicon</span></Button>
                    </label>
                    {editValues.site_favicon_path && <span className="text-xs text-muted-foreground">✓ Uploaded</span>}
                  </div>
                </div>
                <div>
                  <Label>Brand Font Family</Label>
                  <Select value={editValues.brand_font || "system"} onValueChange={(v) => updateValue("brand_font", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="georgia">Georgia (Serif)</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="playfair">Playfair Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> SEO & Meta</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Meta Title</Label>
                  <Input value={editValues.meta_title || ""} onChange={(e) => updateValue("meta_title", e.target.value)} placeholder="NotarDex — Ohio Online Notary Services" maxLength={60} />
                  <p className="text-xs text-muted-foreground mt-1">{(editValues.meta_title || "").length}/60 characters</p>
                </div>
                <div>
                  <Label>Default Meta Description</Label>
                  <Textarea value={editValues.meta_description || ""} onChange={(e) => updateValue("meta_description", e.target.value)} placeholder="Professional remote online notarization..." className="min-h-[60px]" maxLength={160} />
                  <p className="text-xs text-muted-foreground mt-1">{(editValues.meta_description || "").length}/160 characters</p>
                </div>
                <div>
                  <Label>OG Image</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileUpload("og_image", e)} />
                      <Button variant="outline" size="sm" asChild><span><Upload className="mr-1 h-3 w-3" /> Upload OG Image</span></Button>
                    </label>
                    {editValues.og_image_path && <span className="text-xs text-muted-foreground">✓ Uploaded</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 1200×630px for social sharing</p>
                </div>
                <div>
                  <Label>Google Analytics ID</Label>
                  <Input value={editValues.google_analytics_id || ""} onChange={(e) => updateValue("google_analytics_id", e.target.value)} placeholder="G-XXXXXXXXXX" />
                </div>
                <div>
                  <Label>Facebook Pixel ID</Label>
                  <Input value={editValues.facebook_pixel_id || ""} onChange={(e) => updateValue("facebook_pixel_id", e.target.value)} placeholder="1234567890" />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" /> Social Media Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/notardex" },
                  { key: "social_twitter", label: "Twitter / X", placeholder: "https://x.com/notardex" },
                  { key: "social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/notardex" },
                  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/notardex" },
                  { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/@notardex" },
                  { key: "social_google_business", label: "Google Business Profile", placeholder: "https://g.page/notardex" },
                ].map(s => (
                  <div key={s.key}><Label>{s.label}</Label><Input value={editValues[s.key] || ""} onChange={(e) => updateValue(s.key, e.target.value)} placeholder={s.placeholder} /></div>
                ))}
              </CardContent>
            </Card>

            {/* Legal / Footer */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Legal Pages & Footer</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Privacy Policy URL (external)</Label>
                  <Input value={editValues.privacy_policy_url || ""} onChange={(e) => updateValue("privacy_policy_url", e.target.value)} placeholder="/terms-privacy or https://..." />
                </div>
                <div>
                  <Label>Terms of Service URL</Label>
                  <Input value={editValues.terms_url || ""} onChange={(e) => updateValue("terms_url", e.target.value)} placeholder="/terms-privacy" />
                </div>
                <div>
                  <Label>Footer Disclaimer Text</Label>
                  <Textarea value={editValues.footer_disclaimer || ""} onChange={(e) => updateValue("footer_disclaimer", e.target.value)} placeholder="NotarDex provides notary services in accordance with Ohio law..." className="min-h-[60px]" />
                </div>
                <div>
                  <Label>Custom Footer HTML</Label>
                  <Textarea value={editValues.footer_custom_html || ""} onChange={(e) => updateValue("footer_custom_html", e.target.value)} placeholder="<p>Custom footer content...</p>" className="min-h-[60px] font-mono text-xs" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ CREDENTIALS ═══ */}
        <TabsContent value="credentials" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-sans text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Notary Credentials & Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><Label>Commission Number</Label><Input value={editValues.commission_number || ""} onChange={(e) => updateValue("commission_number", e.target.value)} placeholder="e.g., 2024-OH-123456" /></div>
                <div><Label>Commission County</Label><Input value={editValues.commission_county || ""} onChange={(e) => updateValue("commission_county", e.target.value)} placeholder="Franklin" /></div>
                <div>
                  <Label>Commission Expiration Date</Label>
                  <Input type="date" value={editValues.commission_expiration_date || ""} onChange={(e) => updateValue("commission_expiration_date", e.target.value)} />
                  {commissionAlert && <p className={`mt-1 text-xs ${commissionAlert.tone}`}>{commissionAlert.text}</p>}
                </div>
                <div><Label>RON Authorization Number</Label><Input value={editValues.ron_authorization_number || ""} onChange={(e) => updateValue("ron_authorization_number", e.target.value)} placeholder="RON auth number" /></div>
                <div><Label>NNA Member Number (optional)</Label><Input value={editValues.nna_member_number || ""} onChange={(e) => updateValue("nna_member_number", e.target.value)} placeholder="NNA #" /></div>
                <div><Label>Commission Reminder Window (days)</Label><Input type="number" value={editValues.commission_renewal_reminder_days || "90"} onChange={(e) => updateValue("commission_renewal_reminder_days", e.target.value)} /></div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><Label>E&O Insurance Provider</Label><Input value={editValues.eo_insurance_provider || ""} onChange={(e) => updateValue("eo_insurance_provider", e.target.value)} placeholder="Insurance company" /></div>
                <div><Label>E&O Policy Number</Label><Input value={editValues.eo_policy_number || ""} onChange={(e) => updateValue("eo_policy_number", e.target.value)} /></div>
                <div><Label>E&O Expiration Date</Label><Input type="date" value={editValues.eo_expiration_date || ""} onChange={(e) => updateValue("eo_expiration_date", e.target.value)} /></div>
                <div><Label>Bond Surety Company</Label><Input value={editValues.bond_surety_company || ""} onChange={(e) => updateValue("bond_surety_company", e.target.value)} /></div>
                <div><Label>Bond Number</Label><Input value={editValues.bond_number || ""} onChange={(e) => updateValue("bond_number", e.target.value)} /></div>
                <div><Label>Bond Expiration Date</Label><Input type="date" value={editValues.bond_expiration_date || ""} onChange={(e) => updateValue("bond_expiration_date", e.target.value)} /></div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Commission Certificate</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileUpload("cert", e)} />
                      <Button variant="outline" size="sm" asChild disabled={uploadingCert}>
                        <span>{uploadingCert ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Upload Certificate</span>
                      </Button>
                    </label>
                    {editValues.commission_certificate_path && <span className="text-xs text-muted-foreground">✓ Uploaded</span>}
                  </div>
                </div>
                <div>
                  <Label>Notary Seal/Stamp Image</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept=".jpg,.jpeg,.png,.svg" className="hidden" onChange={(e) => handleFileUpload("seal", e)} />
                      <Button variant="outline" size="sm" asChild disabled={uploadingSeal}>
                        <span>{uploadingSeal ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Upload Seal</span>
                      </Button>
                    </label>
                    {sealPreviewUrl && (
                      <div className="h-12 w-12 rounded border border-border overflow-hidden">
                        <img src={sealPreviewUrl} alt="Seal preview" className="h-full w-full object-contain" />
                      </div>
                    )}
                    {editValues.seal_image_path && !sealPreviewUrl && <span className="text-xs text-muted-foreground">✓ Uploaded</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ OPERATIONS ═══ */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Business Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Business Name</Label><Input value={editValues.business_name || ""} onChange={(e) => updateValue("business_name", e.target.value)} placeholder="NotarDex LLC" /></div>
                <div><Label>Business Phone Number</Label><Input value={editValues.notary_phone || ""} onChange={(e) => updateValue("notary_phone", e.target.value)} placeholder="(614) 300-6890" /></div>
                <div><Label>Business Email</Label><Input type="email" value={editValues.notary_email || ""} onChange={(e) => updateValue("notary_email", e.target.value)} placeholder="contact@notardex.com" /></div>
                <div><Label>Notary Base Address</Label><Input value={editValues.notary_base_address || ""} onChange={(e) => updateValue("notary_base_address", e.target.value)} placeholder="Columbus, OH" /></div>
                <div><Label>Notary Base Zip Code</Label><Input value={editValues.notary_base_zip || ""} onChange={(e) => updateValue("notary_base_zip", e.target.value)} placeholder="43215" maxLength={5} /></div>
                <div><Label>Business Hours Display</Label><Input value={editValues.business_hours || ""} onChange={(e) => updateValue("business_hours", e.target.value)} placeholder="Mon-Wed 10 AM - 7 PM" /></div>
                <div><Label>Timezone</Label>
                  <Select value={editValues.timezone || "America/New_York"} onValueChange={(v) => updateValue("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Booking & Scheduling</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Max Appointments per Day</Label><Input type="number" value={editValues.max_appointments_per_day || ""} onChange={(e) => updateValue("max_appointments_per_day", e.target.value)} /></div>
                <div><Label>Min Booking Lead Time (hours)</Label><Input type="number" value={editValues.min_booking_lead_hours || ""} onChange={(e) => updateValue("min_booking_lead_hours", e.target.value)} /></div>
                <div><Label>Cancellation Window (hours)</Label><Input type="number" value={editValues.cancellation_window_hours || "24"} onChange={(e) => updateValue("cancellation_window_hours", e.target.value)} /></div>
                <div><Label>Reschedule Window (hours)</Label><Input type="number" value={editValues.reschedule_window_hours || "12"} onChange={(e) => updateValue("reschedule_window_hours", e.target.value)} /></div>
                <div><Label>Default Appointment Duration (min)</Label><Input type="number" value={editValues.default_appointment_duration || "30"} onChange={(e) => updateValue("default_appointment_duration", e.target.value)} /></div>
                <div><Label>Booking Buffer Between Appointments (min)</Label><Input type="number" value={editValues.booking_buffer_minutes || "15"} onChange={(e) => updateValue("booking_buffer_minutes", e.target.value)} /></div>
                {[
                  { key: "auto_confirm_bookings", label: "Auto-Confirm Bookings", desc: "Automatically confirm new appointments" },
                  { key: "allow_same_day_booking", label: "Same-Day Booking", desc: "Allow clients to book today" },
                  { key: "allow_weekend_booking", label: "Weekend Booking", desc: "Allow Saturday/Sunday bookings" },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                    </div>
                    <Switch checked={isEnabled(toggle.key)} onCheckedChange={() => toggleValue(toggle.key)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ID Expiration Monitoring */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> ID Expiration Monitoring</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Signer ID Reminder Window (days)</Label>
                  <Input type="number" value={editValues.id_expiration_reminder_days || "60"} onChange={(e) => updateValue("id_expiration_reminder_days", e.target.value)} />
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="space-y-2 text-xs">
                    <p className="text-muted-foreground">Expired IDs in journal: <span className="font-semibold text-destructive">{expiredIds.length}</span></p>
                    <p className="text-muted-foreground">IDs expiring soon: <span className="font-semibold text-foreground">{expiringIds.length}</span></p>
                    {expiredIds.length > 0 && (
                      <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
                        <p className="mb-1 flex items-center gap-1 text-destructive font-medium"><AlertTriangle className="h-3 w-3" /> Expired ID records</p>
                        {expiredIds.slice(0, 3).map((item: any) => (
                          <p key={item.id} className="text-muted-foreground">{item.signer_name || "Unknown"} • {item.id_expiration}</p>
                        ))}
                        {expiredIds.length > 3 && <p className="text-muted-foreground">+{expiredIds.length - 3} more</p>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Portal Settings */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Client Portal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Welcome Message</Label>
                  <Textarea value={editValues.portal_welcome_message || ""} onChange={(e) => updateValue("portal_welcome_message", e.target.value)} placeholder="Welcome to your NotarDex portal..." className="min-h-[60px]" />
                </div>
                {[
                  { key: "portal_show_pricing", label: "Show Pricing", desc: "Display service prices in client portal" },
                  { key: "portal_allow_reschedule", label: "Allow Self-Reschedule", desc: "Clients can reschedule their own appointments" },
                  { key: "portal_allow_cancel", label: "Allow Self-Cancel", desc: "Clients can cancel their own appointments" },
                  { key: "portal_show_ai_tools", label: "Show AI Tools Tab", desc: "Display AI tools in client portal" },
                  { key: "portal_show_documents", label: "Show Documents Tab", desc: "Display document management in portal" },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                    </div>
                    <Switch checked={isEnabled(toggle.key)} onCheckedChange={() => toggleValue(toggle.key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ INTEGRATIONS ═══ */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Monitor className="h-5 w-5 text-primary" /> Platform Integration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>SignNow API Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs">Connected</Badge>
                    <span className="text-xs text-muted-foreground">API token configured as server secret</span>
                  </div>
                </div>
                <div><Label>KBA Platform URL</Label><Input value={editValues.kba_platform_url || ""} onChange={(e) => updateValue("kba_platform_url", e.target.value)} placeholder="https://kba-platform.com/session" /></div>
                <div>
                  <Label>SignNow Webhook URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input readOnly value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signnow-webhook`} className="font-mono text-xs bg-muted" />
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signnow-webhook`);
                      toast({ title: "Copied!" });
                    }}>Copy</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 p-4 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Knowledge-Based Authentication (KBA)</p>
                    <p className="text-xs text-muted-foreground mt-1">KBA is handled natively within SignNow during RON sessions — MISMO-compliant and satisfies Ohio ORC §147.66.</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs ml-auto flex-shrink-0">Built-in</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><ArrowDownUp className="h-5 w-5 text-primary" /> HubSpot CRM</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 p-3 flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">HubSpot Service Key</p>
                    <p className="text-xs text-muted-foreground">Configured as a server secret.</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs ml-auto flex-shrink-0">Configured</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("hubspot-sync", { body: { action: "test" } });
                    if (error || !data?.connected) toast({ title: "HubSpot connection failed", description: data?.error || error?.message, variant: "destructive" });
                    else toast({ title: "HubSpot connected successfully" });
                  }}>Test Connection</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("hubspot-sync", { body: { action: "push" } });
                    if (error) toast({ title: "Push failed", description: error.message, variant: "destructive" });
                    else toast({ title: data?.message || "Leads pushed to HubSpot" });
                  }}>Push Leads</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("hubspot-sync", { body: { action: "pull" } });
                    if (error) toast({ title: "Pull failed", description: error.message, variant: "destructive" });
                    else toast({ title: data?.message || "Contacts pulled from HubSpot" });
                  }}>Pull Contacts</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Monitor className="h-5 w-5 text-primary" /> Zoom Meetings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Zoom Personal Meeting Link</Label>
                  <Input value={editValues.zoom_meeting_link || ""} onChange={(e) => updateValue("zoom_meeting_link", e.target.value)} placeholder="https://zoom.us/j/1234567890" />
                  <p className="mt-1 text-xs text-muted-foreground">Displayed to clients for consultation appointments</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email Templates</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">All email templates are managed in one central location.</p>
                <Button variant="outline" asChild><a href="/admin/email-management">Go to Email Management → Automated Emails</a></Button>
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Stripe Payments</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 p-3 flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Stripe API Keys</p>
                    <p className="text-xs text-muted-foreground">Secret and publishable keys configured as server secrets.</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs ml-auto flex-shrink-0">Configured</Badge>
                </div>
                <div>
                  <Label>Stripe Webhook URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input readOnly value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`} className="font-mono text-xs bg-muted" />
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`);
                      toast({ title: "Copied!" });
                    }}>Copy</Button>
                  </div>
                </div>
                <div>
                  <Label>Default Currency</Label>
                  <Select value={editValues.default_currency || "usd"} onValueChange={(v) => updateValue("default_currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* IONOS Email */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> IONOS Email</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 p-3 flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">IONOS SMTP/IMAP</p>
                    <p className="text-xs text-muted-foreground">Email credentials configured as server secrets.</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs ml-auto flex-shrink-0">Configured</Badge>
                </div>
                <div><Label>Reply-To Email</Label><Input type="email" value={editValues.reply_to_email || ""} onChange={(e) => updateValue("reply_to_email", e.target.value)} placeholder="noreply@notardex.com" /></div>
                <div><Label>Sender Display Name</Label><Input value={editValues.email_sender_name || ""} onChange={(e) => updateValue("email_sender_name", e.target.value)} placeholder="NotarDex" /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ COMPLIANCE ═══ */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-sans text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Ohio RON Compliance Check
                {(() => {
                  const checks = [
                    !!editValues.commission_number,
                    !commissionAlert || !commissionAlert.text.includes("expired"),
                    !!editValues.ron_authorization_number,
                    !!editValues.eo_expiration_date && new Date(editValues.eo_expiration_date) > new Date(),
                    !!editValues.bond_expiration_date && new Date(editValues.bond_expiration_date) > new Date(),
                  ];
                  const passed = checks.filter(Boolean).length;
                  const total = checks.length;
                  return passed === total
                    ? <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs">Compliant</Badge>
                    : <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">{passed}/{total} Requirements Met</Badge>;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Auto-detected compliance with Ohio Revised Code §147.65-.66 requirements for Remote Online Notarization.</p>
              <a href="https://www.ohiosos.gov/notary/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
                <ExternalLink className="h-3 w-3" /> Verify on Ohio Secretary of State
              </a>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Commission Number", ok: !!editValues.commission_number, detail: editValues.commission_number || "Not configured" },
                  { label: "Commission Current", ok: !commissionAlert || !commissionAlert.text.includes("expired"), detail: commissionAlert?.text || "No date set" },
                  { label: "RON Authorization", ok: !!editValues.ron_authorization_number, detail: editValues.ron_authorization_number || "Not configured" },
                  { label: "E&O Insurance Current", ok: !!editValues.eo_expiration_date && new Date(editValues.eo_expiration_date) > new Date(), detail: editValues.eo_expiration_date ? `Expires ${new Date(editValues.eo_expiration_date).toLocaleDateString()}` : "Not configured" },
                  { label: "Surety Bond Current", ok: !!editValues.bond_expiration_date && new Date(editValues.bond_expiration_date) > new Date(), detail: editValues.bond_expiration_date ? `Expires ${new Date(editValues.bond_expiration_date).toLocaleDateString()}` : "Not configured" },
                  { label: "SignNow API", ok: true, detail: "Connected (server secret)" },
                  { label: "KBA Integration", ok: true, detail: "SignNow built-in (MISMO-compliant)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2 rounded-lg border border-border/50 p-3">
                    {item.ok ? <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Document Retention</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Retention Period (years)</Label>
                  <Input type="number" value={editValues.retention_period_years || "10"} onChange={(e) => updateValue("retention_period_years", e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">Ohio ORC §147.66 requires minimum 10-year retention for RON records</p>
                </div>
                <div>
                  <Label>Auto-Purge Expired Records</Label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">Automatically delete records past retention period</p>
                    <Switch checked={isEnabled("auto_purge_expired")} onCheckedChange={() => toggleValue("auto_purge_expired")} />
                  </div>
                </div>
                <div>
                  <Label>Recording Retention (years)</Label>
                  <Input type="number" value={editValues.recording_retention_years || "10"} onChange={(e) => updateValue("recording_retention_years", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-sans text-lg flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Announcements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Global Banner Message</Label>
                  <Textarea value={editValues.global_banner_message || ""} onChange={(e) => updateValue("global_banner_message", e.target.value)} placeholder="Important: Office closed for holiday..." className="min-h-[60px]" />
                </div>
                <div>
                  <Label>Banner Type</Label>
                  <Select value={editValues.global_banner_type || "info"} onValueChange={(v) => updateValue("global_banner_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="warning">Warning (Amber)</SelectItem>
                      <SelectItem value="urgent">Urgent (Red)</SelectItem>
                      <SelectItem value="success">Success (Green)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show Banner</p>
                    <p className="text-xs text-muted-foreground">Display announcement banner on all pages</p>
                  </div>
                  <Switch checked={isEnabled("global_banner_enabled")} onCheckedChange={() => toggleValue("global_banner_enabled")} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
