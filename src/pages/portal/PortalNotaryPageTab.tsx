import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, ExternalLink, Save, Globe, Eye } from "lucide-react";

export default function PortalNotaryPageTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPage, setHasPage] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notary_pages").select("*").eq("user_id", user.id).maybeSingle();
      if (data) { setPage(data); setHasPage(true); }
      setLoading(false);
    })();
  }, [user]);

  const updateField = (field: string, value: any) => setPage((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    const { error } = await supabase.from("notary_pages").update({
      display_name: page.display_name,
      title: page.title,
      tagline: page.tagline,
      bio: page.bio,
      phone: page.phone,
      email: page.email,
      website_url: page.website_url,
      signing_platform_url: page.signing_platform_url,
      use_platform_booking: page.use_platform_booking,
      external_booking_url: page.external_booking_url,
      services_offered: page.services_offered,
      service_areas: page.service_areas,
      credentials: page.credentials,
      social_links: page.social_links,
      seo_title: page.seo_title,
      seo_description: page.seo_description,
      is_published: page.is_published,
    } as any).eq("id", page.id);
    if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
    else toast({ title: "Page saved!" });
    setSaving(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/n/${page?.slug}`);
    toast({ title: "Link copied!" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!hasPage) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="py-12 text-center">
          <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Personal Page Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your personal notary service page hasn't been set up yet. Contact your admin to create one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Notary Page</h2>
          <p className="text-sm text-muted-foreground">Customize your public-facing service page</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1">
            <Copy className="h-3 w-3" /> Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/n/${page?.slug}`, "_blank")} className="gap-1">
            <Eye className="h-3 w-3" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={page.is_published ? "default" : "secondary"}>
          {page.is_published ? "Published" : "Draft"}
        </Badge>
        <span className="font-mono text-sm text-muted-foreground">/n/{page.slug}</span>
      </div>

      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Display Name</Label><Input value={page.display_name || ""} onChange={e => updateField("display_name", e.target.value)} /></div>
            <div><Label>Title</Label><Input value={page.title || ""} onChange={e => updateField("title", e.target.value)} /></div>
          </div>
          <div><Label>Tagline</Label><Input value={page.tagline || ""} onChange={e => updateField("tagline", e.target.value)} /></div>
          <div><Label>Bio</Label><Textarea rows={4} value={page.bio || ""} onChange={e => updateField("bio", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Phone</Label><Input value={page.phone || ""} onChange={e => updateField("phone", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={page.email || ""} onChange={e => updateField("email", e.target.value)} /></div>
          </div>
          <div><Label>Website</Label><Input value={page.website_url || ""} onChange={e => updateField("website_url", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Signing & Booking</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Signing Platform URL (paste SignNow or other link)</Label><Input value={page.signing_platform_url || ""} onChange={e => updateField("signing_platform_url", e.target.value)} /></div>
          <div className="flex items-center gap-3">
            <Switch checked={page.use_platform_booking ?? true} onCheckedChange={v => updateField("use_platform_booking", v)} />
            <Label>Use NotarDex booking system</Label>
          </div>
          {!page.use_platform_booking && (
            <div><Label>External Booking URL</Label><Input value={page.external_booking_url || ""} onChange={e => updateField("external_booking_url", e.target.value)} /></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={page.is_published ?? false} onCheckedChange={v => updateField("is_published", v)} />
            <Label>Make page publicly visible</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
