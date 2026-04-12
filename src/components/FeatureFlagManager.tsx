/**
 * F-101+: Feature flag admin toggle component.
 * Allows admins to enable/disable platform features without code deploys.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/auditLogger";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: string;
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: "booking.enabled", label: "Booking Engine", description: "Allow clients to book appointments online", enabled: true, category: "Core" },
  { key: "ron.enabled", label: "RON Sessions", description: "Remote Online Notarization availability", enabled: true, category: "Core" },
  { key: "ai_chatbot.enabled", label: "AI Chatbot", description: "Show AI assistant chatbot on public pages", enabled: true, category: "AI" },
  { key: "ai_writer.enabled", label: "AI Writer", description: "AI document writing tools", enabled: true, category: "AI" },
  { key: "document_vault.enabled", label: "Document Vault", description: "Secure document storage for clients", enabled: true, category: "Documents" },
  { key: "eseal_verification.enabled", label: "E-Seal Verification", description: "Public e-seal verification portal", enabled: true, category: "Documents" },
  { key: "notary_directory.enabled", label: "Notary Directory", description: "Public notary directory listing", enabled: true, category: "Marketing" },
  { key: "referral_program.enabled", label: "Referral Program", description: "Client referral tracking and rewards", enabled: false, category: "Marketing" },
  { key: "stripe_payments.enabled", label: "Stripe Payments", description: "Online payment processing", enabled: true, category: "Payments" },
  { key: "sms_notifications.enabled", label: "SMS Notifications", description: "Send SMS appointment reminders", enabled: false, category: "Notifications" },
  { key: "review_collection.enabled", label: "Review Collection", description: "Automated review request emails", enabled: true, category: "Marketing" },
  { key: "live_chat.enabled", label: "Live Chat", description: "Real-time chat between clients and admin", enabled: true, category: "Communication" },
  { key: "design_studio.enabled", label: "Design Studio", description: "Custom print design tool", enabled: false, category: "Services" },
  { key: "resume_builder.enabled", label: "Resume Builder", description: "AI-powered resume builder", enabled: false, category: "Services" },
  { key: "grant_dashboard.enabled", label: "Grant Dashboard", description: "Grant research and tracking", enabled: false, category: "Services" },
  { key: "bulk_notarization.enabled", label: "Bulk Notarization", description: "Batch notarization for businesses", enabled: true, category: "Services" },
  { key: "apostille_tracking.enabled", label: "Apostille Tracking", description: "Client-facing apostille status tracking", enabled: true, category: "Services" },
  { key: "compliance_reports.enabled", label: "Compliance Reports", description: "Automated compliance report generation", enabled: true, category: "Admin" },
  { key: "contractor_management.enabled", label: "Contractor Management", description: "Manage external notary contractors", enabled: true, category: "Admin" },
  { key: "email_campaigns.enabled", label: "Email Campaigns", description: "Bulk email marketing campaigns", enabled: false, category: "Marketing" },
];

export function FeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value")
        .like("setting_key", "feature_%");

      if (data) {
        setFlags(prev =>
          prev.map(flag => {
            const dbVal = data.find(d => d.setting_key === `feature_${flag.key}`);
            return dbVal ? { ...flag, enabled: dbVal.setting_value === "true" } : flag;
          })
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleFlag = async (flag: FeatureFlag) => {
    const newValue = !flag.enabled;
    setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, enabled: newValue } : f));

    const { error } = await supabase.from("platform_settings").upsert({
      setting_key: `feature_${flag.key}`,
      setting_value: String(newValue),
    }, { onConflict: "setting_key" });

    if (error) {
      setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, enabled: !newValue } : f));
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await logAdminAction({
      action: `feature_flag_${newValue ? "enabled" : "disabled"}`,
      entityType: "feature_flag",
      details: { flag: flag.key, enabled: newValue },
    });

    toast({ title: `${flag.label} ${newValue ? "enabled" : "disabled"}` });
  };

  const filteredFlags = flags.filter(f =>
    !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredFlags.map(f => f.category))];

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="rounded-2xl border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black">
          <Settings className="h-5 w-5 text-primary" />
          Feature Flags
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(cat => (
          <div key={cat}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{cat}</h3>
            <div className="space-y-2">
              {filteredFlags.filter(f => f.category === cat).map(flag => (
                <div key={flag.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{flag.label}</span>
                      <Badge variant={flag.enabled ? "default" : "outline"} className="text-[10px]">
                        {flag.enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                  </div>
                  <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
