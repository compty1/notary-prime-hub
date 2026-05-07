import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Sparkles } from "lucide-react";

const ANIMATIONS = [
  { key: "notarization_complete", label: "Notarization Complete", description: "Confetti success after notarization" },
  { key: "document_upload", label: "Document Upload", description: "Progress + success on file upload" },
  { key: "payment_confirmed", label: "Payment Confirmed", description: "Receipt success animation" },
  { key: "identity_verified", label: "Identity Verified", description: "KBA / ID success ring" },
  { key: "session_joined", label: "Session Joined", description: "RON room entry animation" },
  { key: "century_club", label: "Century Club", description: "100-notarization milestone" },
  { key: "upload_failed", label: "Upload Failed", description: "File error shake" },
  { key: "session_disconnected", label: "Session Disconnected", description: "RON drop reconnection state" },
  { key: "business_plan_upgrade", label: "Business Plan Upgrade", description: "Tier upgrade celebration" },
  { key: "skeleton_loading", label: "Skeleton Loading", description: "Page-level loading shimmer" },
  { key: "toast_notification", label: "Toast Notification", description: "Slide-in alert pulse" },
  { key: "button_loading_state", label: "Button Loading", description: "Inline button spinner" },
  { key: "form_error", label: "Form Error", description: "Field error shake" },
  { key: "milestone_rating", label: "Milestone Rating", description: "Star rating bounce" },
];

const SETTING_KEY = "active_animations";

export default function AdminAnimations() {
  usePageMeta({ title: "Animations | Admin", noIndex: true });
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ANIMATIONS.map((a) => [a.key, true]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", SETTING_KEY)
        .maybeSingle();
      if (data?.setting_value) {
        try {
          const parsed = typeof data.setting_value === "string"
            ? JSON.parse(data.setting_value)
            : data.setting_value;
          setEnabled((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const save = async (next: Record<string, boolean>) => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .upsert(
        { setting_key: SETTING_KEY, setting_value: JSON.stringify(next) },
        { onConflict: "setting_key" }
      );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Animation settings updated." });
    }
  };

  const toggle = (key: string) => {
    const next = { ...enabled, [key]: !enabled[key] };
    setEnabled(next);
    save(next);
  };

  const enableAll = () => {
    const next = Object.fromEntries(ANIMATIONS.map((a) => [a.key, true]));
    setEnabled(next);
    save(next);
  };
  const disableAll = () => {
    const next = Object.fromEntries(ANIMATIONS.map((a) => [a.key, false]));
    setEnabled(next);
    save(next);
  };

  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> Active Animations
          </h1>
          <p className="text-sm text-muted-foreground">
            Toggle which brand animations are active site-wide. Preview them in the public gallery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{activeCount}/{ANIMATIONS.length} active</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/animations" target="_blank">
              <ExternalLink className="h-4 w-4 mr-1" /> Preview gallery
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={enableAll} disabled={saving}>Enable all</Button>
          <Button variant="outline" size="sm" onClick={disableAll} disabled={saving}>Disable all</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ANIMATIONS.map((a) => (
            <Card key={a.key} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
              <Switch checked={!!enabled[a.key]} onCheckedChange={() => toggle(a.key)} disabled={saving} />
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-muted/40">
        <p className="text-sm">
          <strong>Note:</strong> Toggles are stored in <code>platform_settings.active_animations</code>.
          Components can read this via <code>useSettings()</code> to gate rendering.
          Uploading new Lottie files: drop JSON into <code>src/components/animations/</code> and register in
          the gallery — full custom-upload UI is on the roadmap.
        </p>
      </Card>
    </div>
  );
}
