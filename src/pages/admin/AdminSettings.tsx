import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, DollarSign, MapPin, Monitor, Save, Loader2 } from "lucide-react";

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

  useEffect(() => {
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
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(editValues).map(([key, value]) => {
      if (settings[key] && settings[key].setting_value !== value) {
        return supabase
          .from("platform_settings")
          .update({ setting_value: value, updated_at: new Date().toISOString(), updated_by: user?.id })
          .eq("setting_key", key);
      }
      return null;
    }).filter(Boolean);

    const results = await Promise.all(updates as any[]);
    const hasError = results.some((r: any) => r?.error);

    if (hasError) {
      toast({ title: "Error saving some settings", variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "All changes have been applied." });
      // Refresh settings
      const { data } = await supabase.from("platform_settings").select("*");
      if (data) {
        const mapped: Record<string, SettingItem> = {};
        data.forEach((s: any) => { mapped[s.setting_key] = s; });
        setSettings(mapped);
      }
    }
    setSaving(false);
  };

  const updateValue = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground">Configure pricing, platform integrations, and business settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-gold-dark">
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pricing */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Pricing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Base Fee per Signature ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={editValues.base_fee_per_signature || ""}
                onChange={(e) => updateValue("base_fee_per_signature", e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">ORC §147.08 standard fee</p>
            </div>
            <div>
              <Label>Travel Fee per Mile ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={editValues.travel_fee_per_mile || ""}
                onChange={(e) => updateValue("travel_fee_per_mile", e.target.value)}
              />
            </div>
            <div>
              <Label>Minimum Travel Fee ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={editValues.travel_fee_minimum || ""}
                onChange={(e) => updateValue("travel_fee_minimum", e.target.value)}
              />
            </div>
            <div>
              <Label>Maximum Travel Radius (miles)</Label>
              <Input
                type="number"
                value={editValues.travel_radius_miles || ""}
                onChange={(e) => updateValue("travel_radius_miles", e.target.value)}
              />
            </div>
            <div>
              <Label>RON Platform Fee ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={editValues.ron_platform_fee || ""}
                onChange={(e) => updateValue("ron_platform_fee", e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">BlueNotary session cost</p>
            </div>
            <div>
              <Label>KBA Fee ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={editValues.kba_fee || ""}
                onChange={(e) => updateValue("kba_fee", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform Integration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-accent" />
              Platform Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>BlueNotary Iframe URL</Label>
              <Input
                value={editValues.bluenotary_iframe_url || ""}
                onChange={(e) => updateValue("bluenotary_iframe_url", e.target.value)}
                placeholder="https://app.bluenotary.us/your-session"
              />
              <p className="mt-1 text-xs text-muted-foreground">Embed URL for RON session iframe</p>
            </div>
            <div>
              <Label>BlueNotary API Key</Label>
              <Input
                type="password"
                value={editValues.bluenotary_api_key || ""}
                onChange={(e) => updateValue("bluenotary_api_key", e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
            <div>
              <Label>KBA Platform URL</Label>
              <Input
                value={editValues.kba_platform_url || ""}
                onChange={(e) => updateValue("kba_platform_url", e.target.value)}
                placeholder="https://kba-platform.com/session"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              Business Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Notary Base Address</Label>
              <Input
                value={editValues.notary_base_address || ""}
                onChange={(e) => updateValue("notary_base_address", e.target.value)}
                placeholder="Columbus, OH"
              />
            </div>
            <div>
              <Label>Notary Base Zip Code</Label>
              <Input
                value={editValues.notary_base_zip || ""}
                onChange={(e) => updateValue("notary_base_zip", e.target.value)}
                placeholder="43215"
                maxLength={5}
              />
            </div>
            <div>
              <Label>Max Appointments per Day</Label>
              <Input
                type="number"
                value={editValues.max_appointments_per_day || ""}
                onChange={(e) => updateValue("max_appointments_per_day", e.target.value)}
              />
            </div>
            <div>
              <Label>Min Booking Lead Time (hours)</Label>
              <Input
                type="number"
                value={editValues.min_booking_lead_hours || ""}
                onChange={(e) => updateValue("min_booking_lead_hours", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Commission */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              Commission Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Commission Expiration Date</Label>
              <Input
                type="date"
                value={editValues.commission_expiration_date || ""}
                onChange={(e) => updateValue("commission_expiration_date", e.target.value)}
              />
              {editValues.commission_expiration_date && (
                <p className={`mt-1 text-xs ${
                  new Date(editValues.commission_expiration_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                }`}>
                  {new Date(editValues.commission_expiration_date) < new Date()
                    ? "⚠ Commission has expired!"
                    : new Date(editValues.commission_expiration_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    ? "⚠ Commission expires within 90 days"
                    : `Expires ${new Date(editValues.commission_expiration_date).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
