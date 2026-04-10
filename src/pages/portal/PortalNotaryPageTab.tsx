import { useEffect, useState, useRef } from "react";
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
import {
  Loader2, Copy, Save, Globe, Eye, Upload, Plus, Trash2, Image as ImageIcon,
  Award, Shield, CheckCircle, MapPin, Facebook, Linkedin, Twitter, Search,
} from "lucide-react";

interface ServiceItem {
  name: string;
  description: string;
  price: string;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { name: "Acknowledgments", description: "Standard notarization for deeds, powers of attorney", price: "$5/seal" },
  { name: "Jurats & Sworn Statements", description: "Oath-based notarizations for affidavits", price: "$5/seal" },
  { name: "Remote Online Notarization (RON)", description: "Secure video-based notarization", price: "$25/session" },
  { name: "Loan Signing Services", description: "NNA-certified signing agent", price: "Contact for quote" },
  { name: "Apostille Facilitation", description: "Document authentication for international use", price: "Starting at $50" },
  { name: "Mobile Notary Services", description: "On-site notarization at your location", price: "$5/seal + travel" },
  { name: "Document Preparation", description: "Professional document formatting", price: "Starting at $25" },
  { name: "ID Verification & KBA", description: "Knowledge-based authentication", price: "Included with RON" },
];

export default function PortalNotaryPageTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPage, setHasPage] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notary_pages").select("*").eq("user_id", user.id).maybeSingle();
      if (data) { setPage(data); setHasPage(true); }
      setLoading(false);
    })();
  }, [user]);

  const updateField = (field: string, value: any) => setPage((prev: any) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (file: File, type: "profile" | "cover") => {
    if (!user || !page) return;
    const setter = type === "profile" ? setUploadingProfile : setUploadingCover;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `notary-pages/${page.id}/${type}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setter(false);
      return;
    }
    // Use signed URL (10-year expiry) since bucket is private
    const { data: signedData } = await supabase.storage.from("documents").createSignedUrl(path, 315360000);
    const field = type === "profile" ? "profile_photo_path" : "cover_photo_path";
    if (signedData?.signedUrl) {
      updateField(field, signedData.signedUrl);
    }
    setter(false);
    toast({ title: `${type === "profile" ? "Profile" : "Cover"} photo uploaded` });
  };

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
      profile_photo_path: page.profile_photo_path,
      cover_photo_path: page.cover_photo_path,
      signing_platform_url: page.signing_platform_url,
      use_platform_booking: page.use_platform_booking,
      external_booking_url: page.external_booking_url,
      services_offered: page.services_offered,
      service_areas: page.service_areas,
      credentials: page.credentials,
      social_links: page.social_links,
      seo_title: page.seo_title,
      seo_description: page.seo_description,
      theme_color: page.theme_color,
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

  // Services helpers
  const services: ServiceItem[] = Array.isArray(page?.services_offered) ? page.services_offered : [];
  const addService = () => updateField("services_offered", [...services, { name: "", description: "", price: "" }]);
  const removeService = (i: number) => updateField("services_offered", services.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: string, value: string) => {
    const updated = [...services];
    (updated[i] as any)[field] = value;
    updateField("services_offered", updated);
  };
  const loadDefaultServices = () => updateField("services_offered", DEFAULT_SERVICES);

  // Service areas helpers
  const areas: string[] = Array.isArray(page?.service_areas) ? page.service_areas : [];
  const [newArea, setNewArea] = useState("");
  const addArea = () => {
    if (newArea.trim() && !areas.includes(newArea.trim())) {
      updateField("service_areas", [...areas, newArea.trim()]);
      setNewArea("");
    }
  };
  const removeArea = (i: number) => updateField("service_areas", areas.filter((_, idx) => idx !== i));

  // Credentials helpers
  const creds = page?.credentials || {};
  const updateCred = (key: string, value: any) => updateField("credentials", { ...creds, [key]: value });

  // Social links helpers
  const socials = page?.social_links || {};
  const updateSocial = (key: string, value: string) => updateField("social_links", { ...socials, [key]: value });

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
      {/* Header */}
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

      {/* Photos */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Photos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Profile Photo</Label>
              <div className="mt-1 flex items-center gap-3">
                {page.profile_photo_path ? (
                  <img src={page.profile_photo_path} alt="Profile" className="h-16 w-16 rounded-full object-cover border" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted text-xl font-bold text-muted-foreground">
                    {page.display_name?.charAt(0)?.toUpperCase() || "N"}
                  </div>
                )}
                <div>
                  <input ref={profileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "profile")} />
                  <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}>
                    {uploadingProfile ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                    Upload
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Cover Photo</Label>
              <div className="mt-1">
                {page.cover_photo_path ? (
                  <img src={page.cover_photo_path} alt="Cover" className="h-24 w-full rounded-lg object-cover border" />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">No cover photo</div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "cover")} />
                <Button variant="outline" size="sm" className="mt-2" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                  {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  Upload Cover
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Display Name</Label><Input value={page.display_name || ""} onChange={e => updateField("display_name", e.target.value)} /></div>
            <div><Label>Title</Label><Input value={page.title || ""} onChange={e => updateField("title", e.target.value)} /></div>
          </div>
          <div><Label>Tagline</Label><Input value={page.tagline || ""} onChange={e => updateField("tagline", e.target.value)} /></div>
          <div><Label>Bio</Label><Textarea rows={5} value={page.bio || ""} onChange={e => updateField("bio", e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Theme Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={page.theme_color || "#eab308"} onChange={e => updateField("theme_color", e.target.value)} className="h-10 w-14 p-1" />
                <Input value={page.theme_color || "#eab308"} onChange={e => updateField("theme_color", e.target.value)} className="flex-1 font-mono" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
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

      {/* Credentials */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Professional Credentials</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Commission Number</Label><Input value={creds.commission_number || ""} onChange={e => updateCred("commission_number", e.target.value)} /></div>
            <div><Label>Commission Expiration</Label><Input type="date" value={creds.commission_expiration || ""} onChange={e => updateCred("commission_expiration", e.target.value)} /></div>
            <div><Label>Commissioned State</Label><Input value={creds.commissioned_state || ""} onChange={e => updateCred("commissioned_state", e.target.value)} /></div>
            <div><Label>Bond Information</Label><Input value={creds.bond_info || ""} onChange={e => updateCred("bond_info", e.target.value)} /></div>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={creds.nna_certified || false} onCheckedChange={v => updateCred("nna_certified", v)} />
              <Label className="flex items-center gap-1"><Award className="h-3 w-3" /> NNA Certified</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={creds.ron_certified || false} onCheckedChange={v => updateCred("ron_certified", v)} />
              <Label className="flex items-center gap-1"><Shield className="h-3 w-3" /> RON Certified</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={creds.eo_insured || false} onCheckedChange={v => updateCred("eo_insured", v)} />
              <Label className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> E&O Insured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={creds.bonded || false} onCheckedChange={v => updateCred("bonded", v)} />
              <Label className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Bonded</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Services Offered</CardTitle>
            <div className="flex gap-2">
              {services.length === 0 && (
                <Button variant="outline" size="sm" onClick={loadDefaultServices}>Load Defaults</Button>
              )}
              <Button variant="outline" size="sm" onClick={addService} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No services added yet. Click "Load Defaults" for Ohio notary services.</p>
          )}
          {services.map((svc, i) => (
            <div key={i} className="flex gap-2 items-start rounded-lg border p-3">
              <div className="flex-1 grid gap-2 sm:grid-cols-3">
                <Input placeholder="Service name" value={svc.name || ""} onChange={e => updateService(i, "name", e.target.value)} />
                <Input placeholder="Description" value={svc.description || ""} onChange={e => updateService(i, "description", e.target.value)} />
                <Input placeholder="Price" value={svc.price || ""} onChange={e => updateService(i, "price", e.target.value)} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeService(i)} className="shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Service Areas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Add county or city..." value={newArea} onChange={e => setNewArea(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArea())} />
            <Button variant="outline" size="sm" onClick={addArea} className="shrink-0">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map((area, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                <MapPin className="h-3 w-3" /> {area}
                <button onClick={() => removeArea(i)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2"><Facebook className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="Facebook URL" value={socials.facebook || ""} onChange={e => updateSocial("facebook", e.target.value)} /></div>
            <div className="flex items-center gap-2"><Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="LinkedIn URL" value={socials.linkedin || ""} onChange={e => updateSocial("linkedin", e.target.value)} /></div>
            <div className="flex items-center gap-2"><Twitter className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="Twitter/X URL" value={socials.twitter || ""} onChange={e => updateSocial("twitter", e.target.value)} /></div>
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="Other URL" value={socials.other || ""} onChange={e => updateSocial("other", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Signing & Booking */}
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

      {/* SEO */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> SEO Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>SEO Title</Label><Input value={page.seo_title || ""} onChange={e => updateField("seo_title", e.target.value)} placeholder={`${page.display_name} — Ohio Notary Public`} />
            <p className="mt-1 text-xs text-muted-foreground">{(page.seo_title || "").length}/60 characters</p>
          </div>
          <div><Label>SEO Description</Label><Textarea rows={2} value={page.seo_description || ""} onChange={e => updateField("seo_description", e.target.value)} placeholder="Professional Ohio notary services..." />
            <p className="mt-1 text-xs text-muted-foreground">{(page.seo_description || "").length}/160 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Publish */}
      <Card>
        <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={page.is_published ?? false} onCheckedChange={v => updateField("is_published", v)} />
            <Label>Make page publicly visible</Label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your page will be accessible at <span className="font-mono">{window.location.origin}/n/{page.slug}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
