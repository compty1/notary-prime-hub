import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Palette, Type, Layout, Eye, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplateDesignerProps {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
}

const FONT_OPTIONS = [
  { label: "System Default", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const DEFAULT_CONFIG = {
  logo_url: "",
  header_bg: "#1a1a2e",
  header_text: "#ffffff",
  accent_color: "#6366f1",
  body_bg: "#ffffff",
  body_text: "#333333",
  footer_bg: "#f4f4f5",
  footer_text: "#71717a",
  font_family: "Arial, Helvetica, sans-serif",
  border_radius: "8",
  padding: "24",
};

export default function EmailTemplateDesigner({ settings, onSave }: EmailTemplateDesignerProps) {
  const stored = settings.email_template_config ? JSON.parse(settings.email_template_config) : {};
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG, ...stored });
  const [uploading, setUploading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<"confirmation" | "reminder" | "followup">("confirmation");
  const { toast } = useToast();

  const update = (key: string, value: string) => {
    setConfig((prev: typeof config) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave("email_template_config", JSON.stringify(config));
    toast({ title: "Template design saved" });
  };

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
    const { data } = await supabase.storage.from("documents").getPublicUrl(path);
    if (data?.publicUrl) {
      update("logo_url", data.publicUrl);
    } else {
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(path, 31536000);
      if (signed?.signedUrl) update("logo_url", signed.signedUrl);
    }
    toast({ title: "Logo uploaded" });
    setUploading(false);
  };

  const sampleData: Record<string, Record<string, string>> = {
    confirmation: {
      subject: "Appointment Confirmed",
      client_name: "Sarah Johnson",
      date: "April 15, 2026",
      time: "2:00 PM ET",
      service_type: "Remote Online Notarization",
      location: "Video Call (link will be sent)",
    },
    reminder: {
      subject: "Appointment Reminder — Tomorrow",
      client_name: "Sarah Johnson",
      date: "April 15, 2026",
      time: "2:00 PM ET",
      service_type: "Remote Online Notarization",
      location: "Video Call",
    },
    followup: {
      subject: "Thank You — Your Notarization is Complete",
      client_name: "Sarah Johnson",
      date: "April 14, 2026",
      time: "2:00 PM ET",
      service_type: "Remote Online Notarization",
      location: "Video Call",
    },
  };

  const templateContent = useMemo(() => {
    const raw = settings[`email_template_${previewTemplate}`] || "";
    const d = sampleData[previewTemplate];
    let html = raw || `<p>Dear {{client_name}},</p><p>Your ${previewTemplate} details:</p><p><strong>Service:</strong> {{service_type}}<br/><strong>Date:</strong> {{date}}<br/><strong>Time:</strong> {{time}}</p><p>Thank you for choosing Notar.</p>`;
    Object.entries(d).forEach(([k, v]) => {
      html = html.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
    });
    return html;
  }, [previewTemplate, settings, config]);

  const previewHtml = useMemo(() => {
    const c = config;
    const r = `${c.border_radius}px`;
    const p = `${c.padding}px`;
    return `
      <div style="background:${c.body_bg};font-family:${c.font_family};max-width:600px;margin:0 auto;border-radius:${r};overflow:hidden;border:1px solid #e5e5e5;">
        <div style="background:${c.header_bg};padding:${p};text-align:center;">
          ${c.logo_url ? `<img src="${c.logo_url}" alt="Logo" style="max-height:48px;margin-bottom:12px;" />` : ""}
          <h1 style="color:${c.header_text};font-size:20px;margin:0;">${sampleData[previewTemplate].subject}</h1>
        </div>
        <div style="padding:${p};color:${c.body_text};font-size:14px;line-height:1.6;">
          ${templateContent}
          <div style="text-align:center;margin-top:24px;">
            <a href="#" style="display:inline-block;background:${c.accent_color};color:#fff;padding:12px 32px;border-radius:${r};text-decoration:none;font-weight:600;">View Details</a>
          </div>
        </div>
        <div style="background:${c.footer_bg};padding:16px ${p};text-align:center;font-size:12px;color:${c.footer_text};">
          <p style="margin:0;">Notar — Ohio Notary & Document Services</p>
          <p style="margin:4px 0 0;">(614) 300-6890 • contact@notardex.com</p>
        </div>
      </div>
    `;
  }, [config, templateContent, previewTemplate]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <div className="space-y-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              {config.logo_url && <img src={config.logo_url} alt="Email logo" className="h-10 rounded border border-border" />}
              <label className="cursor-pointer">
                <input type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span>{uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} {config.logo_url ? "Change" : "Upload"}</span>
                </Button>
              </label>
              {config.logo_url && <Button variant="ghost" size="sm" onClick={() => update("logo_url", "")}>Remove</Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { key: "header_bg", label: "Header BG" },
              { key: "header_text", label: "Header Text" },
              { key: "accent_color", label: "Accent / Button" },
              { key: "body_bg", label: "Body BG" },
              { key: "body_text", label: "Body Text" },
              { key: "footer_bg", label: "Footer BG" },
              { key: "footer_text", label: "Footer Text" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input type="color" value={(config as any)[key]} onChange={(e) => update(key, e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-border" />
                <Label className="text-xs">{label}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Type className="h-4 w-4" /> Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs">Font Family</Label>
            <Select value={config.font_family} onValueChange={(v) => update("font_family", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Layout className="h-4 w-4" /> Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Border Radius: {config.border_radius}px</Label>
              <Slider value={[parseInt(config.border_radius)]} onValueChange={([v]) => update("border_radius", String(v))} min={0} max={24} step={2} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs">Padding: {config.padding}px</Label>
              <Slider value={[parseInt(config.padding)]} onValueChange={([v]) => update("padding", String(v))} min={12} max={48} step={4} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">Save Template Design</Button>
      </div>

      {/* Live Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4" /> Live Preview</h3>
          <Select value={previewTemplate} onValueChange={(v: any) => setPreviewTemplate(v)}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmation">Confirmation</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="followup">Follow-Up</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-4 bg-muted/30">
            <div className="rounded-lg bg-background p-2 shadow-sm" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
