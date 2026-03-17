import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, DollarSign, MapPin, Monitor, Save, Loader2, AlertTriangle, CalendarClock, Shield, Upload, Eye, Mail } from "lucide-react";

interface SettingItem {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

export default function AdminSettings() {
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

      // Load seal preview if path exists
      const sealPath = values.seal_image_path;
      if (sealPath) {
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(sealPath);
        if (urlData) setSealPreviewUrl(urlData.publicUrl);
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

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(editValues).map(([key, value]) => {
      if (settings[key]) {
        if (settings[key].setting_value === value) return null;
        return supabase.from("platform_settings").update({ setting_value: value, updated_at: new Date().toISOString(), updated_by: user?.id }).eq("setting_key", key);
      }
      return supabase.from("platform_settings").insert({ setting_key: key, setting_value: value, updated_by: user?.id });
    }).filter(Boolean);

    const results = await Promise.all(updates as any[]);
    const hasError = results.some((r: any) => r?.error);
    if (hasError) toast({ title: "Error saving some settings", variant: "destructive" });
    else { toast({ title: "Settings saved", description: "All changes have been applied." }); await fetchSettings(); }
    setSaving(false);
  };

  const updateValue = (key: string, value: string) => setEditValues((prev) => ({ ...prev, [key]: value }));

  const handleFileUpload = async (type: "cert" | "seal", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const setter = type === "cert" ? setUploadingCert : setUploadingSeal;
    setter(true);
    const filePath = `admin/${type}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(filePath, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setter(false); return; }
    const key = type === "cert" ? "commission_certificate_path" : "seal_image_path";
    updateValue(key, filePath);
    if (type === "seal") {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      if (urlData) setSealPreviewUrl(urlData.publicUrl);
    }
    toast({ title: `${type === "cert" ? "Certificate" : "Seal image"} uploaded` });
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground">Configure pricing, credentials, platform integrations, and compliance reminders</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-gold-dark">
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notary Credentials Card */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" /> Notary Credentials & Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Commission Number</Label>
                <Input value={editValues.commission_number || ""} onChange={(e) => updateValue("commission_number", e.target.value)} placeholder="e.g., 2024-OH-123456" />
              </div>
              <div>
                <Label>Commission County</Label>
                <Input value={editValues.commission_county || ""} onChange={(e) => updateValue("commission_county", e.target.value)} placeholder="Franklin" />
              </div>
              <div>
                <Label>Commission Expiration Date</Label>
                <Input type="date" value={editValues.commission_expiration_date || ""} onChange={(e) => updateValue("commission_expiration_date", e.target.value)} />
                {commissionAlert && <p className={`mt-1 text-xs ${commissionAlert.tone}`}>{commissionAlert.text}</p>}
              </div>
              <div>
                <Label>RON Authorization Number</Label>
                <Input value={editValues.ron_authorization_number || ""} onChange={(e) => updateValue("ron_authorization_number", e.target.value)} placeholder="RON auth number" />
              </div>
              <div>
                <Label>NNA Member Number (optional)</Label>
                <Input value={editValues.nna_member_number || ""} onChange={(e) => updateValue("nna_member_number", e.target.value)} placeholder="NNA #" />
              </div>
              <div>
                <Label>Commission Reminder Window (days)</Label>
                <Input type="number" value={editValues.commission_renewal_reminder_days || "90"} onChange={(e) => updateValue("commission_renewal_reminder_days", e.target.value)} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>E&O Insurance Provider</Label>
                <Input value={editValues.eo_insurance_provider || ""} onChange={(e) => updateValue("eo_insurance_provider", e.target.value)} placeholder="Insurance company" />
              </div>
              <div>
                <Label>E&O Policy Number</Label>
                <Input value={editValues.eo_policy_number || ""} onChange={(e) => updateValue("eo_policy_number", e.target.value)} />
              </div>
              <div>
                <Label>E&O Expiration Date</Label>
                <Input type="date" value={editValues.eo_expiration_date || ""} onChange={(e) => updateValue("eo_expiration_date", e.target.value)} />
              </div>
              <div>
                <Label>Bond Surety Company</Label>
                <Input value={editValues.bond_surety_company || ""} onChange={(e) => updateValue("bond_surety_company", e.target.value)} />
              </div>
              <div>
                <Label>Bond Number</Label>
                <Input value={editValues.bond_number || ""} onChange={(e) => updateValue("bond_number", e.target.value)} />
              </div>
              <div>
                <Label>Bond Expiration Date</Label>
                <Input type="date" value={editValues.bond_expiration_date || ""} onChange={(e) => updateValue("bond_expiration_date", e.target.value)} />
              </div>
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

        {/* Pricing Configuration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" /> Pricing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Base Fee per Signature ($)</Label><Input type="number" step="0.01" value={editValues.base_fee_per_signature || ""} onChange={(e) => updateValue("base_fee_per_signature", e.target.value)} /><p className="mt-1 text-xs text-muted-foreground">ORC §147.08 standard fee</p></div>
            <div><Label>Travel Fee per Mile ($)</Label><Input type="number" step="0.01" value={editValues.travel_fee_per_mile || ""} onChange={(e) => updateValue("travel_fee_per_mile", e.target.value)} /></div>
            <div><Label>Minimum Travel Fee ($)</Label><Input type="number" step="0.01" value={editValues.travel_fee_minimum || ""} onChange={(e) => updateValue("travel_fee_minimum", e.target.value)} /></div>
            <div><Label>Maximum Travel Radius (miles)</Label><Input type="number" value={editValues.travel_radius_miles || ""} onChange={(e) => updateValue("travel_radius_miles", e.target.value)} /></div>
            <div><Label>RON Platform Fee ($)</Label><Input type="number" step="0.01" value={editValues.ron_platform_fee || ""} onChange={(e) => updateValue("ron_platform_fee", e.target.value)} /></div>
            <div><Label>KBA Fee ($)</Label><Input type="number" step="0.01" value={editValues.kba_fee || ""} onChange={(e) => updateValue("kba_fee", e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Platform Integration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-accent" /> Platform Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>BlueNotary Iframe URL</Label><Input value={editValues.bluenotary_iframe_url || ""} onChange={(e) => updateValue("bluenotary_iframe_url", e.target.value)} placeholder="https://app.bluenotary.us/your-session" /></div>
            <div><Label>BlueNotary API Key</Label><Input type="password" value={editValues.bluenotary_api_key || ""} onChange={(e) => updateValue("bluenotary_api_key", e.target.value)} placeholder="Enter your API key" /></div>
            <div><Label>KBA Platform URL</Label><Input value={editValues.kba_platform_url || ""} onChange={(e) => updateValue("kba_platform_url", e.target.value)} placeholder="https://kba-platform.com/session" /></div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" /> Business Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Notary Base Address</Label><Input value={editValues.notary_base_address || ""} onChange={(e) => updateValue("notary_base_address", e.target.value)} placeholder="Columbus, OH" /></div>
            <div><Label>Notary Base Zip Code</Label><Input value={editValues.notary_base_zip || ""} onChange={(e) => updateValue("notary_base_zip", e.target.value)} placeholder="43215" maxLength={5} /></div>
            <div><Label>Max Appointments per Day</Label><Input type="number" value={editValues.max_appointments_per_day || ""} onChange={(e) => updateValue("max_appointments_per_day", e.target.value)} /></div>
            <div><Label>Min Booking Lead Time (hours)</Label><Input type="number" value={editValues.min_booking_lead_hours || ""} onChange={(e) => updateValue("min_booking_lead_hours", e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* ID Expiration Monitoring */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-accent" /> ID Expiration Monitoring
            </CardTitle>
          </CardHeader>
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
                    {expiredIds.slice(0, 3).map((item) => (
                      <p key={item.id} className="text-muted-foreground">{item.signer_name || "Unknown"} • {item.id_expiration}</p>
                    ))}
                    {expiredIds.length > 3 && <p className="text-muted-foreground">+{expiredIds.length - 3} more</p>}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
