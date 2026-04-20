import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CharCounter } from "@/components/CharCounter";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import {
  Loader2, Copy, Save, Globe, Eye, Upload, Plus, Trash2, Image as ImageIcon,
  Award, Shield, CheckCircle, MapPin, Facebook, Linkedin, Twitter, Search,
  DollarSign, TrendingUp, Palette, Type, LayoutList, AlertTriangle,
  Link as LinkIcon, QrCode, Download, History,
} from "lucide-react";
import { ALLOWED_IMAGE_MIMES } from "@/lib/fileValidation";
import { ensureHex } from "@/lib/colorUtils";

interface ServiceItem {
  name: string;
  description: string;
  price: string;
}

interface PlatformService {
  id: string;
  name: string;
  category: string;
  price_from: number | null;
  price_to: number | null;
  short_description: string | null;
}

interface ProfitTransaction {
  id?: string;
  gross_amount: number;
  platform_fee: number;
  professional_share: number;
  status: string;
  created_at?: string;
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

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Modern)" },
  { value: "Merriweather", label: "Merriweather (Serif)" },
  { value: "Roboto", label: "Roboto (Clean)" },
  { value: "Playfair Display", label: "Playfair Display (Elegant)" },
  { value: "Open Sans", label: "Open Sans (Friendly)" },
];

const PROFESSIONAL_TYPES = [
  { value: "notary", label: "Commissioned Notary Public" },
  { value: "signing_agent", label: "Signing Agent" },
  { value: "doc_preparer", label: "Document Preparer" },
  { value: "virtual_assistant", label: "Virtual Assistant" },
  { value: "mobile_notary", label: "Mobile Notary" },
  { value: "other", label: "Other Professional" },
];

export default function PortalNotaryPageTab() {
  const { user } = useAuth();
  const { get: getSetting } = useSettings();
  const { toast } = useToast();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPage, setHasPage] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Resolved signed URLs for previews
  const [resolvedProfileUrl, setResolvedProfileUrl] = useState<string | null>(null);
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(null);
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string | null>(null);
  const [resolvedGalleryUrls, setResolvedGalleryUrls] = useState<string[]>([]);

  const resolveUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  };

  // Platform services for enrollment
  const [platformServices, setPlatformServices] = useState<PlatformService[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [profitStats, setProfitStats] = useState({ total: 0, fees: 0, profit: 0, pending: 0 });
  const [profitHistory, setProfitHistory] = useState<ProfitTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pageRes, svcRes, enrollRes, profitRes] = await Promise.all([
        supabase.from("notary_pages").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("services").select("id, name, category, price_from, price_to, short_description").eq("is_active", true).order("display_order"),
        supabase.from("professional_service_enrollments").select("*").eq("professional_user_id", user.id),
        supabase.from("profit_share_transactions").select("id, gross_amount, platform_fee, professional_share, status, created_at").eq("professional_user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (pageRes.data) {
        setPage(pageRes.data);
        setHasPage(true);
        // Resolve photo URLs for preview
        const [pUrl, cUrl, lUrl] = await Promise.all([
          resolveUrl(pageRes.data.profile_photo_path),
          resolveUrl(pageRes.data.cover_photo_path),
          resolveUrl(pageRes.data.logo_path),
        ]);
        setResolvedProfileUrl(pUrl);
        setResolvedCoverUrl(cUrl);
        setResolvedLogoUrl(lUrl);
        const gallery = Array.isArray(pageRes.data.gallery_photos) ? pageRes.data.gallery_photos : [];
        if (gallery.length > 0) {
          const urls = await Promise.all(gallery.map((p: string) => resolveUrl(p)));
          setResolvedGalleryUrls(urls.filter((u): u is string => !!u));
        }
      }
      if (svcRes.data) setPlatformServices(svcRes.data as PlatformService[]);
      if (enrollRes.data) setEnrollments(enrollRes.data);
      if (profitRes.data) {
        const txns = profitRes.data as ProfitTransaction[];
        setProfitHistory(txns);
        setProfitStats({
          total: txns.reduce((s, t) => s + (t.gross_amount || 0), 0),
          fees: txns.reduce((s, t) => s + (t.platform_fee || 0), 0),
          profit: txns.filter(t => t.status === "paid").reduce((s, t) => s + (t.professional_share || 0), 0),
          pending: txns.filter(t => t.status === "pending").reduce((s, t) => s + (t.professional_share || 0), 0),
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const updateField = (field: string, value: any) => setPage((prev: any) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (file: File, type: "profile" | "cover" | "logo") => {
    if (!user || !page) return;
    if (!ALLOWED_IMAGE_MIMES.has(file.type)) { toast({ title: "Invalid file type. Only JPG, PNG, WebP allowed.", variant: "destructive" }); return; }
    const setter = type === "profile" ? setUploadingProfile : type === "cover" ? setUploadingCover : setUploadingLogo;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `notary-pages/${page.id}/${type}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setter(false);
      return;
    }
    const fieldMap: Record<string, string> = { profile: "profile_photo_path", cover: "cover_photo_path", logo: "logo_path" };
    updateField(fieldMap[type], path);
    // Resolve the new URL for preview
    const signedUrl = await resolveUrl(path);
    if (type === "profile") setResolvedProfileUrl(signedUrl);
    else if (type === "cover") setResolvedCoverUrl(signedUrl);
    else setResolvedLogoUrl(signedUrl);
    setter(false);
    toast({ title: `${type === "profile" ? "Profile photo" : type === "cover" ? "Cover photo" : "Logo"} uploaded` });
  };

  const handleGalleryUpload = async (file: File) => {
    if (!user || !page) return;
    if (!ALLOWED_IMAGE_MIMES.has(file.type)) { toast({ title: "Invalid file type. Only JPG, PNG, WebP allowed.", variant: "destructive" }); return; }
    const gallery: string[] = Array.isArray(page.gallery_photos) ? page.gallery_photos : [];
    if (gallery.length >= 6) { toast({ title: "Max 6 gallery photos", variant: "destructive" }); return; }
    setUploadingGallery(true);
    const ext = file.name.split(".").pop();
    const path = `notary-pages/${page.id}/gallery-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setUploadingGallery(false); return; }
    // S002/DI002: Store path, not signed URL
    updateField("gallery_photos", [...gallery, path]);
    // Resolve and add to preview URLs
    const signedUrl = await resolveUrl(path);
    if (signedUrl) setResolvedGalleryUrls(prev => [...prev, signedUrl]);
    setUploadingGallery(false);
    toast({ title: "Gallery photo added" });
  };

  const removeGalleryPhoto = (index: number) => {
    const gallery: string[] = Array.isArray(page.gallery_photos) ? page.gallery_photos : [];
    updateField("gallery_photos", gallery.filter((_, i) => i !== index));
    setResolvedGalleryUrls(prev => prev.filter((_, i) => i !== index));
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
      logo_path: page.logo_path,
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
      accent_color: page.accent_color,
      font_family: page.font_family,
      nav_services: page.nav_services,
      gallery_photos: page.gallery_photos,
      professional_type: page.professional_type,
      is_published: page.is_published,
    } as never).eq("id", page.id);
    if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
    else toast({ title: "Page saved!" });
    setSaving(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/n/${page?.slug}`);
    toast({ title: "Link copied!" });
  };

  // Nav services helpers
  const navServices: string[] = Array.isArray(page?.nav_services) ? page.nav_services : [];
  const toggleNavService = (name: string) => {
    if (navServices.includes(name)) {
      updateField("nav_services", navServices.filter(n => n !== name));
    } else if (navServices.length < 6) {
      updateField("nav_services", [...navServices, name]);
    } else {
      toast({ title: "Max 6 nav items", variant: "destructive" });
    }
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

  // Enrollment management
  // UX005: Loading state for enrollment toggle
  const [enrollingServiceId, setEnrollingServiceId] = useState<string | null>(null);
  const handleEnrollService = async (serviceId: string) => {
    if (!user) return;
    setEnrollingServiceId(serviceId);
    const existing = enrollments.find(e => e.service_id === serviceId);
    if (existing) {
      await supabase.from("professional_service_enrollments").delete().eq("id", existing.id);
      setEnrollments(enrollments.filter(e => e.service_id !== serviceId));
      toast({ title: "Service removed from enrollment" });
    } else {
      const { data, error } = await supabase.from("professional_service_enrollments").insert({
        professional_user_id: user.id,
        service_id: serviceId,
        is_active: false,
        show_on_site: true,
      } as never).select().single();
      if (error) { toast({ title: "Enrollment failed", description: error.message, variant: "destructive" }); setEnrollingServiceId(null); return; }
      if (data) setEnrollments([...enrollments, data]);
      toast({ title: "Service enrollment requested", description: "Pending admin approval." });
    }
    setEnrollingServiceId(null);
  };

  // P005: Auto-save every 30s
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  useEffect(() => {
    if (!hasPage || !page || loading) return;
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("notary_pages").update({
        display_name: page.display_name, title: page.title, tagline: page.tagline,
        bio: page.bio, phone: page.phone, email: page.email, website_url: page.website_url,
        services_offered: page.services_offered, service_areas: page.service_areas,
        credentials: page.credentials, social_links: page.social_links,
        seo_title: page.seo_title, seo_description: page.seo_description,
        theme_color: page.theme_color, accent_color: page.accent_color,
        font_family: page.font_family, nav_services: page.nav_services,
        gallery_photos: page.gallery_photos, professional_type: page.professional_type,
        logo_path: page.logo_path,
      } as never).eq("id", page.id);
      if (!error) setLastAutoSave(new Date());
    }, 30000);
    return () => clearTimeout(timer);
  }, [page, hasPage, loading]);

  // P001: Self-service page creation
  const [creatingPage, setCreatingPage] = useState(false);
  const handleCreateOwnPage = async () => {
    if (!user) return;
    setCreatingPage(true);
    const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", user.id).single();
    const slug = (profile?.full_name || "my-page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
    const serviceArea = getSetting("service_area", "");
    const { data, error } = await supabase.from("notary_pages").insert({
      user_id: user.id,
      slug,
      display_name: profile?.full_name || "My Professional Page",
      email: profile?.email || user.email || "",
      phone: getSetting("notary_phone", ""),
      service_areas: serviceArea ? [serviceArea] : [],
      credentials: {
        commissioned_state: "Ohio",
        commissioned_county: getSetting("commission_county", ""),
      },
      is_published: false,
    } as never).select().single();
    if (error) {
      toast({ title: "Could not create page", description: error.message, variant: "destructive" });
    } else if (data) {
      setPage(data);
      setHasPage(true);
      toast({ title: "Page created! Customize it below, then publish when ready." });
    }
    setCreatingPage(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!hasPage) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="py-12 text-center">
          <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Personal Page Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your personal service page to start attracting clients and earning through the platform.
          </p>
          <Button className="mt-4 gap-2" onClick={handleCreateOwnPage} disabled={creatingPage}>
            {creatingPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create My Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  const professionalLabel = PROFESSIONAL_TYPES.find(t => t.value === page.professional_type)?.label || "Professional";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My {professionalLabel} Page</h2>
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
      {lastAutoSave && (
        <p className="text-[10px] text-muted-foreground">Auto-saved {lastAutoSave.toLocaleTimeString()}</p>
      )}

      {/* P002: Editable slug */}
      <div className="flex items-center gap-3">
        <Badge variant={page.is_published ? "default" : "secondary"}>
          {page.is_published ? "Published" : "Draft"}
        </Badge>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">/n/</span>
          <Input
            value={page.slug || ""}
            onChange={e => {
              const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-/, "").substring(0, 50);
              updateField("slug", sanitized);
            }}
            className="h-7 w-40 font-mono text-sm px-2"
            maxLength={50}
          />
        </div>
      </div>

      {/* Profit Dashboard */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Earnings Dashboard</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-xs font-medium uppercase text-muted-foreground">Gross Revenue</p>
              <p className="text-2xl font-bold">${profitStats.total.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase text-muted-foreground">Platform Fees</p>
              <p className="text-2xl font-bold text-muted-foreground">${profitStats.fees.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase text-muted-foreground">Your Profit</p>
              <p className="text-2xl font-bold text-success">${profitStats.profit.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase text-muted-foreground">Pending Payout</p>
              <p className="text-2xl font-bold text-warning">${profitStats.pending.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Earnings from bookings made through your personal page. Platform fees cover processing, technology, and compliance.
          </p>
        </CardContent>
      </Card>

      {/* Referral Link & QR Code */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Referral Link & QR Code</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-3">
              <div>
                <Label>Your Referral Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input readOnly value={`${window.location.origin}/n/${page?.slug}`} className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-1 shrink-0"><Copy className="h-3 w-3" /> Copy</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Share this link — bookings made through it are tracked for your profit share.</p>
              </div>
              <div>
                <Label>Direct Booking Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input readOnly value={`${window.location.origin}/book?ref=${page?.slug}`} className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/book?ref=${page?.slug}`);
                    toast({ title: "Booking link copied!" });
                  }} className="gap-1 shrink-0"><Copy className="h-3 w-3" /> Copy</Button>
                </div>
              </div>
            </div>
            {/* W005: Downloadable QR code */}
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border p-3 bg-card" id="qr-code-container">
                <QRCodeSVG value={`${window.location.origin}/n/${page?.slug}`} size={120} />
              </div>
              <p className="text-xs text-muted-foreground">Scan to visit your page</p>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => {
                const svg = document.querySelector("#qr-code-container svg");
                if (!svg) return;
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement("canvas");
                canvas.width = 240; canvas.height = 240;
                const ctx = canvas.getContext("2d");
                const img = new Image();
                img.onload = () => {
                  ctx?.drawImage(img, 0, 0, 240, 240);
                  const link = document.createElement("a");
                  link.download = `${page?.slug || "qr"}-qr-code.png`;
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                };
                img.src = "data:image/svg+xml;base64," + btoa(svgData);
              }}>
                <Download className="h-3 w-3" /> Download QR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit History */}
      {profitHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Profit History</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Your Share</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitHistory.slice(0, 20).map((txn, i) => (
                    <TableRow key={txn.id || i}>
                      <TableCell className="text-sm">{txn.created_at ? format(new Date(txn.created_at), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>${txn.gross_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">${txn.platform_fee.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-success">${txn.professional_share.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={txn.status === "paid" ? "default" : txn.status === "disputed" ? "destructive" : "secondary"}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {profitHistory.length > 20 && (
              <p className="mt-2 text-xs text-muted-foreground text-center">Showing 20 of {profitHistory.length} transactions</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fee Breakdown Info */}
      <Card className="border-warning/30 bg-warning/50">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-warning" /> Platform Fee Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between rounded border bg-background px-3 py-2">
              <span className="text-muted-foreground">Notarization (per act)</span>
              <span className="font-semibold">$5.00 (Ohio ORC §147.08)</span>
            </div>
            <div className="flex justify-between rounded border bg-background px-3 py-2">
              <span className="text-muted-foreground">RON Session Fee</span>
              <span className="font-semibold">$25.00 minimum</span>
            </div>
            <div className="flex justify-between rounded border bg-background px-3 py-2">
              <span className="text-muted-foreground">KBA Verification</span>
              <span className="font-semibold">$15.00 minimum</span>
            </div>
            <div className="flex justify-between rounded border bg-background px-3 py-2">
              <span className="text-muted-foreground">Payment Processing</span>
              <span className="font-semibold">2.9% + $0.30</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">These fees are set by the platform and cannot be reduced below minimums. Your custom pricing must cover these costs.</p>
        </CardContent>
      </Card>

      {/* Theme & Branding */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Theme & Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Professional Type</Label>
              <Select value={page.professional_type || "notary"} onValueChange={v => updateField("professional_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFESSIONAL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={ensureHex(page.theme_color)} onChange={e => updateField("theme_color", e.target.value)} className="h-10 w-14 p-1" />
                <Input value={page.theme_color || "#C9A227"} onChange={e => updateField("theme_color", e.target.value)} className="flex-1 font-mono" />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={ensureHex(page.accent_color, "#1e40af")} onChange={e => updateField("accent_color", e.target.value)} className="h-10 w-14 p-1" />
                <Input value={page.accent_color || "#1e40af"} onChange={e => updateField("accent_color", e.target.value)} className="flex-1 font-mono" />
              </div>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1"><Type className="h-3 w-3" /> Font Family</Label>
            <Select value={page.font_family || "Inter"} onValueChange={v => updateField("font_family", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Photos & Logo */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Photos & Logo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label>Business Logo</Label>
            <p className="text-[10px] text-muted-foreground mb-1">Upload your business logo. Displayed in the header of your public page. PNG/SVG recommended, transparent background preferred.</p>
            <div className="mt-1 flex items-center gap-3">
              {resolvedLogoUrl || page.logo_path ? (
                <img src={resolvedLogoUrl || page.logo_path} alt="Logo" className="h-16 w-auto max-w-[120px] rounded-lg object-contain border p-1" />
              ) : (
                <div className="flex h-16 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-xs text-muted-foreground">No logo</div>
              )}
              <div className="flex flex-col gap-1">
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "logo")} />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  {page.logo_path ? "Replace Logo" : "Upload Logo"}
                </Button>
                {page.logo_path && (
                  <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => { updateField("logo_path", null); setResolvedLogoUrl(null); }}>
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Profile Photo</Label>
              <p className="text-[10px] text-muted-foreground mb-1">Square image, min 200×200px. JPG/PNG/WebP.</p>
              <div className="mt-1 flex items-center gap-3">
                {resolvedProfileUrl || page.profile_photo_path ? (
                  <img src={resolvedProfileUrl || page.profile_photo_path} alt="Profile" className="h-16 w-16 rounded-full object-cover border" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted text-xl font-bold text-muted-foreground">
                    {page.display_name?.charAt(0)?.toUpperCase() || "N"}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input ref={profileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "profile")} />
                  <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}>
                    {uploadingProfile ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                    {page.profile_photo_path ? "Replace" : "Upload"}
                  </Button>
                  {page.profile_photo_path && (
                    <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => { updateField("profile_photo_path", null); setResolvedProfileUrl(null); }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Cover Photo</Label>
              <p className="text-[10px] text-muted-foreground mb-1">Recommended 1200×400px landscape. JPG/PNG/WebP.</p>
              <div className="mt-1">
                {resolvedCoverUrl || page.cover_photo_path ? (
                  <img src={resolvedCoverUrl || page.cover_photo_path} alt="Cover" className="h-24 w-full rounded-lg object-cover border" />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">No cover photo</div>
                )}
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "cover")} />
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                    {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                    {page.cover_photo_path ? "Replace Cover" : "Upload Cover"}
                  </Button>
                  {page.cover_photo_path && (
                    <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => { updateField("cover_photo_path", null); setResolvedCoverUrl(null); }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Photos */}
          <Separator />
          <div>
            <Label className="flex items-center gap-2 mb-2">Gallery Photos <Badge variant="secondary">{(Array.isArray(page.gallery_photos) ? page.gallery_photos : []).length}/6</Badge></Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {resolvedGalleryUrls.map((url: string, i: number) => (
                <div key={i} className="group relative aspect-square rounded-lg border overflow-hidden">
                  <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                  <button onClick={() => removeGalleryPhoto(i)}
                    className="absolute top-1 right-1 rounded-full bg-destructive/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3 text-primary-foreground" />
                  </button>
                </div>
              ))}
              {(Array.isArray(page.gallery_photos) ? page.gallery_photos : []).length < 6 && (
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  {uploadingGallery ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                </button>
              )}
            </div>
            <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => e.target.files?.[0] && handleGalleryUpload(e.target.files[0])} />
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
          <div>
            <Label>Tagline</Label>
            <Input value={page.tagline || ""} onChange={e => updateField("tagline", e.target.value)} maxLength={120} />
            <div className="mt-1 text-right"><CharCounter current={(page.tagline || "").length} max={120} /></div>
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={5} value={page.bio || ""} onChange={e => updateField("bio", e.target.value)} maxLength={2000} />
            <div className="mt-1 text-right"><CharCounter current={(page.bio || "").length} max={2000} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Nav Service Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LayoutList className="h-4 w-4" /> Header Navigation Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Select up to 6 services to show in your public page's navigation bar. Visitors can quick-jump to these sections.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={navServices.includes(svc.name)}
                  onCheckedChange={() => toggleNavService(svc.name)}
                />
                <span className="text-sm font-medium truncate">{svc.name}</span>
              </label>
            ))}
          </div>
          {navServices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground mr-1">Nav items:</span>
              {navServices.map(n => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)}
            </div>
          )}
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
              <div className="flex-1 space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Service name" value={svc.name || ""} onChange={e => updateService(i, "name", e.target.value)} />
                  <Input placeholder="Price" value={svc.price || ""} onChange={e => updateService(i, "price", e.target.value)} />
                </div>
                <Textarea placeholder="Service description — explain what's included, requirements, etc."
                  value={svc.description || ""} onChange={e => updateService(i, "description", e.target.value)}
                  rows={2} className="text-sm" maxLength={500} />
                <div className="text-right"><CharCounter current={(svc.description || "").length} max={500} /></div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeService(i)} aria-label="Action" className="shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-xs text-warning">
                <p className="font-medium">Platform Fee Floors</p>
                <p>Notarization: $5/act (Ohio ORC §147.08) • RON session: $25 • KBA: $15 • Prices cannot be set below platform minimums.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Service Enrollment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Platform Service Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Enroll in platform services to offer them on your personal page. Pending enrollments require admin approval.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {platformServices.map(svc => {
              const enrollment = enrollments.find(e => e.service_id === svc.id);
              return (
                <div key={svc.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{svc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{svc.category} • {svc.price_from != null ? `$${svc.price_from}` : "Quote"}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {enrollment?.is_active && <Badge variant="default" className="text-xs">Active</Badge>}
                    {enrollment && !enrollment.is_active && <Badge variant="secondary" className="text-xs">Pending</Badge>}
                    {enrollingServiceId === svc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Checkbox
                        checked={!!enrollment}
                        onCheckedChange={() => handleEnrollService(svc.id)}
                        disabled={enrollingServiceId !== null}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
            <Label>Use Notar booking system</Label>
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
          <div>
            <Label>SEO Title</Label>
            <Input value={page.seo_title || ""} onChange={e => updateField("seo_title", e.target.value)} placeholder={`${page.display_name} — Ohio Notary Public`} maxLength={60} />
            <div className="mt-1 text-right"><CharCounter current={(page.seo_title || "").length} max={60} /></div>
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea rows={2} value={page.seo_description || ""} onChange={e => updateField("seo_description", e.target.value)} placeholder="Professional Ohio notary services..." maxLength={160} />
            <div className="mt-1 text-right"><CharCounter current={(page.seo_description || "").length} max={160} /></div>
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
