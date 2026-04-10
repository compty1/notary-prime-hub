import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Eye, Globe, Star, Copy, Loader2, Search, Upload,
  Image as ImageIcon, Award, Shield, CheckCircle, MapPin, Facebook, Linkedin,
  Twitter, DollarSign, Palette, Type,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ALLOWED_IMAGE_MIMES } from "@/lib/fileValidation";

interface NotaryPage {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  title: string;
  tagline: string;
  bio: string;
  phone: string;
  email: string;
  website_url: string;
  service_areas: any[];
  services_offered: any[];
  credentials: Record<string, any>;
  theme_color: string;
  accent_color: string;
  font_family: string;
  professional_type: string;
  signing_platform_url: string;
  use_platform_booking: boolean;
  external_booking_url: string;
  social_links: Record<string, any>;
  profile_photo_path: string | null;
  cover_photo_path: string | null;
  gallery_photos: string[];
  nav_services: string[];
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceItem { name: string; description: string; price: string; }

interface PlatformService {
  id: string; name: string; category: string; price_from: number | null; short_description: string | null;
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Modern)" },
  { value: "Merriweather", label: "Merriweather (Serif)" },
  { value: "Roboto", label: "Roboto (Clean)" },
  { value: "Playfair Display", label: "Playfair Display (Elegant)" },
  { value: "Open Sans", label: "Open Sans (Friendly)" },
];

const PROFESSIONAL_TYPES = [
  { value: "notary", label: "Notary Public" },
  { value: "signing_agent", label: "Signing Agent" },
  { value: "doc_preparer", label: "Document Preparer" },
  { value: "virtual_assistant", label: "Virtual Assistant" },
  { value: "mobile_notary", label: "Mobile Notary" },
  { value: "other", label: "Other Professional" },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  { name: "Acknowledgments", description: "Standard notarization for deeds, powers of attorney", price: "$5/seal" },
  { name: "Jurats & Sworn Statements", description: "Oath-based notarizations for affidavits", price: "$5/seal" },
  { name: "Remote Online Notarization (RON)", description: "Secure video-based notarization", price: "$25/session" },
  { name: "Loan Signing Services", description: "NNA-certified signing agent", price: "Contact for quote" },
  { name: "Mobile Notary Services", description: "On-site notarization at your location", price: "$5/seal + travel" },
];

const emptyPage: Partial<NotaryPage> = {
  slug: "", display_name: "", title: "", tagline: "", bio: "", phone: "", email: "",
  website_url: "", service_areas: [], services_offered: [], credentials: {},
  theme_color: "hsl(43, 74%, 49%)", accent_color: "#1e40af", font_family: "Inter",
  professional_type: "notary", signing_platform_url: "", use_platform_booking: true,
  external_booking_url: "", social_links: {}, profile_photo_path: null, cover_photo_path: null,
  gallery_photos: [], nav_services: [],
  seo_title: "", seo_description: "", is_published: false, is_featured: false,
};

export default function AdminNotaryPages() {
  usePageMeta({ title: "Admin — Notary Pages", noIndex: true });
  const { toast } = useToast();
  const [pages, setPages] = useState<NotaryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPage, setEditPage] = useState<Partial<NotaryPage>>(emptyPage);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notaryUsers, setNotaryUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [platformServices, setPlatformServices] = useState<PlatformService[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fetchPages = async () => {
    setLoading(true);
    const { data } = await supabase.from("notary_pages").select("*").order("created_at", { ascending: false });
    setPages((data as any[]) || []);
    setLoading(false);
  };

  const fetchNotaryUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, email");
    setNotaryUsers((data as any[]) || []);
  };

  const fetchPlatformServices = async () => {
    const { data } = await supabase.from("services").select("id, name, category, price_from, short_description").eq("is_active", true).order("display_order");
    setPlatformServices((data as PlatformService[]) || []);
  };

  useEffect(() => { fetchPages(); fetchNotaryUsers(); fetchPlatformServices(); }, []);

  const fetchEnrollments = async (userId: string) => {
    const { data } = await supabase.from("professional_service_enrollments").select("*").eq("professional_user_id", userId);
    setEnrollments((data as any[]) || []);
  };

  const openEditDialog = async (p?: NotaryPage) => {
    if (p) {
      setEditPage(p);
      await fetchEnrollments(p.user_id);
    } else {
      setEditPage({ ...emptyPage });
      setEnrollments([]);
    }
    setEditDialogOpen(true);
  };

  const updateField = (field: string, value: any) => setEditPage(prev => ({ ...prev, [field]: value }));

  // Photo upload handler
  const handlePhotoUpload = async (file: File, type: "profile" | "cover") => {
    if (!editPage.id) { toast({ title: "Save the page first before uploading photos", variant: "destructive" }); return; }
    if (!ALLOWED_IMAGE_MIMES.has(file.type)) { toast({ title: "Invalid file type", variant: "destructive" }); return; }
    const setter = type === "profile" ? setUploadingProfile : setUploadingCover;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `notary-pages/${editPage.id}/${type}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setter(false); return; }
    const { data: signedData } = await supabase.storage.from("documents").createSignedUrl(path, 315360000);
    if (signedData?.signedUrl) updateField(type === "profile" ? "profile_photo_path" : "cover_photo_path", signedData.signedUrl);
    setter(false);
    toast({ title: `${type === "profile" ? "Profile" : "Cover"} photo uploaded` });
  };

  const handleGalleryUpload = async (file: File) => {
    if (!editPage.id) { toast({ title: "Save the page first", variant: "destructive" }); return; }
    const gallery: string[] = Array.isArray(editPage.gallery_photos) ? editPage.gallery_photos : [];
    if (gallery.length >= 6) { toast({ title: "Max 6 gallery photos", variant: "destructive" }); return; }
    setUploadingGallery(true);
    const ext = file.name.split(".").pop();
    const path = `notary-pages/${editPage.id}/gallery-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setUploadingGallery(false); return; }
    const { data: signedData } = await supabase.storage.from("documents").createSignedUrl(path, 315360000);
    if (signedData?.signedUrl) updateField("gallery_photos", [...gallery, signedData.signedUrl]);
    setUploadingGallery(false);
    toast({ title: "Gallery photo added" });
  };

  const removeGalleryPhoto = (index: number) => {
    const gallery: string[] = Array.isArray(editPage.gallery_photos) ? editPage.gallery_photos : [];
    updateField("gallery_photos", gallery.filter((_, i) => i !== index));
  };

  // Service helpers
  const services: ServiceItem[] = Array.isArray(editPage.services_offered) ? editPage.services_offered : [];
  const addService = () => updateField("services_offered", [...services, { name: "", description: "", price: "" }]);
  const removeService = (i: number) => updateField("services_offered", services.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: string, value: string) => {
    const updated = [...services];
    (updated[i] as any)[field] = value;
    updateField("services_offered", updated);
  };

  // Enrollment management
  const handleEnrollService = async (serviceId: string) => {
    if (!editPage.user_id) return;
    const existing = enrollments.find(e => e.service_id === serviceId);
    if (existing) {
      await supabase.from("professional_service_enrollments").delete().eq("id", existing.id);
      setEnrollments(enrollments.filter(e => e.service_id !== serviceId));
      toast({ title: "Service enrollment removed" });
    } else {
      const { data, error } = await supabase.from("professional_service_enrollments").insert({
        professional_user_id: editPage.user_id,
        service_id: serviceId,
        is_active: true, // Admin approves immediately
        show_on_site: true,
      } as any).select().single();
      if (error) { toast({ title: "Enrollment failed", description: error.message, variant: "destructive" }); return; }
      if (data) setEnrollments([...enrollments, data]);
      toast({ title: "Service enrolled (auto-approved)" });
    }
  };

  const toggleEnrollmentActive = async (enrollmentId: string, current: boolean) => {
    await supabase.from("professional_service_enrollments").update({ is_active: !current } as any).eq("id", enrollmentId);
    setEnrollments(enrollments.map(e => e.id === enrollmentId ? { ...e, is_active: !current } : e));
    toast({ title: !current ? "Enrollment approved" : "Enrollment deactivated" });
  };

  // Areas
  const areas: string[] = Array.isArray(editPage.service_areas) ? editPage.service_areas : [];
  const [newArea, setNewArea] = useState("");
  const addArea = () => {
    if (newArea.trim() && !areas.includes(newArea.trim())) {
      updateField("service_areas", [...areas, newArea.trim()]);
      setNewArea("");
    }
  };

  // Credentials
  const creds = editPage.credentials || {};
  const updateCred = (key: string, value: any) => updateField("credentials", { ...creds, [key]: value });

  // Social links
  const socials = editPage.social_links || {};
  const updateSocial = (key: string, value: string) => updateField("social_links", { ...socials, [key]: value });

  const handleSave = async () => {
    if (!editPage.slug || !editPage.display_name) {
      toast({ title: "Missing fields", description: "Slug and display name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        slug: editPage.slug, display_name: editPage.display_name, title: editPage.title,
        tagline: editPage.tagline, bio: editPage.bio, phone: editPage.phone, email: editPage.email,
        website_url: editPage.website_url, service_areas: editPage.service_areas,
        services_offered: editPage.services_offered, credentials: editPage.credentials,
        theme_color: editPage.theme_color, accent_color: editPage.accent_color,
        font_family: editPage.font_family, professional_type: editPage.professional_type,
        signing_platform_url: editPage.signing_platform_url,
        use_platform_booking: editPage.use_platform_booking,
        external_booking_url: editPage.external_booking_url, social_links: editPage.social_links,
        profile_photo_path: editPage.profile_photo_path, cover_photo_path: editPage.cover_photo_path,
        gallery_photos: editPage.gallery_photos, nav_services: editPage.nav_services,
        seo_title: editPage.seo_title, seo_description: editPage.seo_description,
        is_published: editPage.is_published, is_featured: editPage.is_featured,
      };

      if (editPage.id) {
        const { error } = await supabase.from("notary_pages").update(payload).eq("id", editPage.id);
        if (error) throw error;
        toast({ title: "Page updated" });
      } else {
        if (!editPage.user_id) {
          toast({ title: "Select a user", variant: "destructive" }); setSaving(false); return;
        }
        payload.user_id = editPage.user_id;
        const { error } = await supabase.from("notary_pages").insert(payload);
        if (error) throw error;
        toast({ title: "Page created" });
      }
      setEditDialogOpen(false);
      fetchPages();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notary page?")) return;
    await supabase.from("notary_pages").delete().eq("id", id);
    toast({ title: "Page deleted" });
    fetchPages();
  };

  const togglePublish = async (p: NotaryPage) => {
    await supabase.from("notary_pages").update({ is_published: !p.is_published } as any).eq("id", p.id);
    fetchPages();
  };

  const toggleFeatured = async (p: NotaryPage) => {
    await supabase.from("notary_pages").update({ is_featured: !p.is_featured } as any).eq("id", p.id);
    fetchPages();
  };

  const filtered = pages.filter(p =>
    p.display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Nav services helpers
  const navServices: string[] = Array.isArray(editPage.nav_services) ? editPage.nav_services : [];
  const toggleNavService = (name: string) => {
    if (navServices.includes(name)) updateField("nav_services", navServices.filter(n => n !== name));
    else if (navServices.length < 6) updateField("nav_services", [...navServices, name]);
    else toast({ title: "Max 6 nav items", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notary & Professional Pages</h1>
          <p className="text-sm text-muted-foreground">Manage personal service pages for all professionals</p>
        </div>
        <Button onClick={() => openEditDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Create Page
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search pages..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professional</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.profile_photo_path ? (
                        <img src={p.profile_photo_path} alt="" className="h-8 w-8 rounded-full object-cover border" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-xs font-bold">
                          {p.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="font-medium">{p.display_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {PROFESSIONAL_TYPES.find(t => t.value === (p as any).professional_type)?.label || "Notary"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">/n/{p.slug}</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.is_published ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => togglePublish(p)}
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={p.is_featured} onCheckedChange={() => toggleFeatured(p)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/n/${p.slug}`, "_blank")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/n/${p.slug}`); toast({ title: "Link copied!" }); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No pages found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPage.id ? "Edit Professional Page" : "Create Professional Page"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* TAB: Basics */}
            <TabsContent value="basics" className="space-y-4 mt-4">
              {!editPage.id && (
                <div>
                  <Label>Assign to User *</Label>
                  <select className="w-full rounded-md border px-3 py-2 text-sm" value={editPage.user_id || ""}
                    onChange={e => updateField("user_id", e.target.value)}>
                    <option value="">Select a user...</option>
                    {notaryUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.full_name || u.email} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>URL Slug *</Label>
                  <Input placeholder="shane-goble" value={editPage.slug || ""} onChange={e => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
                  <p className="mt-1 text-xs text-muted-foreground">/n/{editPage.slug || "..."}</p>
                </div>
                <div>
                  <Label>Display Name *</Label>
                  <Input value={editPage.display_name || ""} onChange={e => updateField("display_name", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Professional Type</Label>
                  <Select value={editPage.professional_type || "notary"} onValueChange={v => updateField("professional_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROFESSIONAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input placeholder="Lead Notary & Founder" value={editPage.title || ""} onChange={e => updateField("title", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={editPage.tagline || ""} onChange={e => updateField("tagline", e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea rows={4} value={editPage.bio || ""} onChange={e => updateField("bio", e.target.value)} />
              </div>
              <Separator />
              <h3 className="font-semibold">Contact</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Phone</Label><Input value={editPage.phone || ""} onChange={e => updateField("phone", e.target.value)} /></div>
                <div><Label>Email</Label><Input value={editPage.email || ""} onChange={e => updateField("email", e.target.value)} /></div>
              </div>
              <div><Label>Website URL</Label><Input value={editPage.website_url || ""} onChange={e => updateField("website_url", e.target.value)} /></div>
              <Separator />
              <h3 className="font-semibold">Credentials</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Commission Number</Label><Input value={creds.commission_number || ""} onChange={e => updateCred("commission_number", e.target.value)} /></div>
                <div><Label>Commission Expiration</Label><Input type="date" value={creds.commission_expiration || ""} onChange={e => updateCred("commission_expiration", e.target.value)} /></div>
                <div><Label>Commissioned State</Label><Input value={creds.commissioned_state || ""} onChange={e => updateCred("commissioned_state", e.target.value)} /></div>
                <div><Label>Bond Info</Label><Input value={creds.bond_info || ""} onChange={e => updateCred("bond_info", e.target.value)} /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><Switch checked={creds.nna_certified || false} onCheckedChange={v => updateCred("nna_certified", v)} /><Label className="flex items-center gap-1"><Award className="h-3 w-3" /> NNA Certified</Label></div>
                <div className="flex items-center gap-2"><Switch checked={creds.ron_certified || false} onCheckedChange={v => updateCred("ron_certified", v)} /><Label className="flex items-center gap-1"><Shield className="h-3 w-3" /> RON Certified</Label></div>
                <div className="flex items-center gap-2"><Switch checked={creds.eo_insured || false} onCheckedChange={v => updateCred("eo_insured", v)} /><Label className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> E&O Insured</Label></div>
                <div className="flex items-center gap-2"><Switch checked={creds.bonded || false} onCheckedChange={v => updateCred("bonded", v)} /><Label className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Bonded</Label></div>
              </div>
              <Separator />
              <h3 className="font-semibold">Social Links</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2"><Facebook className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="Facebook URL" value={socials.facebook || ""} onChange={e => updateSocial("facebook", e.target.value)} /></div>
                <div className="flex items-center gap-2"><Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="LinkedIn URL" value={socials.linkedin || ""} onChange={e => updateSocial("linkedin", e.target.value)} /></div>
                <div className="flex items-center gap-2"><Twitter className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="Twitter/X URL" value={socials.twitter || ""} onChange={e => updateSocial("twitter", e.target.value)} /></div>
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0 text-muted-foreground" /><Input placeholder="Other URL" value={socials.other || ""} onChange={e => updateSocial("other", e.target.value)} /></div>
              </div>
            </TabsContent>

            {/* TAB: Photos */}
            <TabsContent value="photos" className="space-y-4 mt-4">
              {!editPage.id && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                  Save the page first to enable photo uploads.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Profile Photo</Label>
                  <p className="text-xs text-muted-foreground mb-1">Square, min 200×200px</p>
                  <div className="flex items-center gap-3 mt-1">
                    {editPage.profile_photo_path ? (
                      <img src={editPage.profile_photo_path} alt="Profile" className="h-16 w-16 rounded-full object-cover border" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted text-xl font-bold text-muted-foreground">
                        {editPage.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <input ref={profileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "profile")} />
                      <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile || !editPage.id}>
                        {uploadingProfile ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                        {editPage.profile_photo_path ? "Replace" : "Upload"}
                      </Button>
                      {editPage.profile_photo_path && (
                        <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => updateField("profile_photo_path", null)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Cover Photo</Label>
                  <p className="text-xs text-muted-foreground mb-1">Recommended 1200×400px landscape</p>
                  {editPage.cover_photo_path ? (
                    <img src={editPage.cover_photo_path} alt="Cover" className="h-24 w-full rounded-lg object-cover border" />
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">No cover photo</div>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "cover")} />
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover || !editPage.id}>
                      {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      {editPage.cover_photo_path ? "Replace" : "Upload"}
                    </Button>
                    {editPage.cover_photo_path && (
                      <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => updateField("cover_photo_path", null)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4" /> Gallery Photos
                  <Badge variant="secondary">{(Array.isArray(editPage.gallery_photos) ? editPage.gallery_photos : []).length}/6</Badge>
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {(Array.isArray(editPage.gallery_photos) ? editPage.gallery_photos : []).map((url: string, i: number) => (
                    <div key={i} className="group relative aspect-square rounded-lg border overflow-hidden">
                      <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                      <button onClick={() => removeGalleryPhoto(i)}
                        className="absolute top-1 right-1 rounded-full bg-destructive/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {(Array.isArray(editPage.gallery_photos) ? editPage.gallery_photos : []).length < 6 && (
                    <button onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery || !editPage.id}
                      className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50">
                      {uploadingGallery ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => e.target.files?.[0] && handleGalleryUpload(e.target.files[0])} />
              </div>
            </TabsContent>

            {/* TAB: Services */}
            <TabsContent value="services" className="space-y-4 mt-4">
              {/* Custom services */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Custom Services</h3>
                  <div className="flex gap-2">
                    {services.length === 0 && (
                      <Button variant="outline" size="sm" onClick={() => updateField("services_offered", DEFAULT_SERVICES)}>Load Defaults</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={addService} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
                  </div>
                </div>
                {services.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No custom services. Click "Load Defaults" for Ohio notary services.</p>
                )}
                {services.map((svc, i) => (
                  <div key={i} className="flex gap-2 items-start rounded-lg border p-3 mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Service name" value={svc.name || ""} onChange={e => updateService(i, "name", e.target.value)} />
                        <Input placeholder="Price (e.g. $5/seal)" value={svc.price || ""} onChange={e => updateService(i, "price", e.target.value)} />
                      </div>
                      <Textarea placeholder="Description" value={svc.description || ""} onChange={e => updateService(i, "description", e.target.value)} rows={2} className="text-sm" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeService(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Nav Services */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">Header Nav Services <Badge variant="secondary">{navServices.length}/6</Badge></h3>
                <p className="text-xs text-muted-foreground mb-2">Select up to 6 services to show in the page's nav bar.</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((svc, i) => (
                    <label key={i} className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox checked={navServices.includes(svc.name)} onCheckedChange={() => toggleNavService(svc.name)} />
                      <span className="text-sm font-medium truncate">{svc.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Service Areas */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2"><MapPin className="h-4 w-4" /> Service Areas</h3>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Add county or city..." value={newArea} onChange={e => setNewArea(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addArea())} />
                  <Button variant="outline" size="sm" onClick={addArea} className="shrink-0">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      <MapPin className="h-3 w-3" /> {area}
                      <button onClick={() => updateField("service_areas", areas.filter((_, idx) => idx !== i))} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Platform Service Enrollment */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4" /> Platform Service Enrollment</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Enroll this professional in platform services. Admin enrollments are auto-approved.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto">
                  {platformServices.map(svc => {
                    const enrollment = enrollments.find(e => e.service_id === svc.id);
                    return (
                      <div key={svc.id} className="flex items-center justify-between rounded-lg border p-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{svc.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{svc.category} • {svc.price_from != null ? `$${svc.price_from}` : "Quote"}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {enrollment && (
                            <Badge
                              variant={enrollment.is_active ? "default" : "secondary"}
                              className="text-xs cursor-pointer"
                              onClick={() => toggleEnrollmentActive(enrollment.id, enrollment.is_active)}
                            >
                              {enrollment.is_active ? "Active" : "Pending"}
                            </Badge>
                          )}
                          <Checkbox checked={!!enrollment} onCheckedChange={() => handleEnrollService(svc.id)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Branding */}
            <TabsContent value="branding" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={editPage.theme_color || "hsl(43, 74%, 49%)"} onChange={e => updateField("theme_color", e.target.value)} className="h-10 w-14 p-1" />
                    <Input value={editPage.theme_color || "hsl(43, 74%, 49%)"} onChange={e => updateField("theme_color", e.target.value)} className="flex-1 font-mono" />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={editPage.accent_color || "#1e40af"} onChange={e => updateField("accent_color", e.target.value)} className="h-10 w-14 p-1" />
                    <Input value={editPage.accent_color || "#1e40af"} onChange={e => updateField("accent_color", e.target.value)} className="flex-1 font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Type className="h-3 w-3" /> Font Family</Label>
                  <Select value={editPage.font_family || "Inter"} onValueChange={v => updateField("font_family", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Live preview swatch */}
              <div className="rounded-xl border p-4" style={{ background: `linear-gradient(135deg, ${editPage.theme_color || "hsl(43, 74%, 49%)"}22, ${editPage.accent_color || "#1e40af"}08)` }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full border-2" style={{ borderColor: editPage.theme_color || "hsl(43, 74%, 49%)", background: `${editPage.theme_color || "hsl(43, 74%, 49%)"}15` }}>
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold" style={{ color: editPage.theme_color || "hsl(43, 74%, 49%)", fontFamily: editPage.font_family || "Inter" }}>
                      {editPage.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  </div>
                  <div style={{ fontFamily: editPage.font_family || "Inter" }}>
                    <p className="font-bold">{editPage.display_name || "Name"}</p>
                    <p className="text-sm" style={{ color: editPage.theme_color || "hsl(43, 74%, 49%)" }}>{editPage.title || "Title"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Settings */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <h3 className="font-semibold">Signing & Booking</h3>
              <div>
                <Label>Signing Platform URL</Label>
                <Input placeholder="https://app.signnow.com/..." value={editPage.signing_platform_url || ""} onChange={e => updateField("signing_platform_url", e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editPage.use_platform_booking ?? true} onCheckedChange={v => updateField("use_platform_booking", v)} />
                <Label>Use platform booking system</Label>
              </div>
              {!editPage.use_platform_booking && (
                <div><Label>External Booking URL</Label><Input value={editPage.external_booking_url || ""} onChange={e => updateField("external_booking_url", e.target.value)} /></div>
              )}

              <Separator />
              <h3 className="font-semibold">SEO</h3>
              <div><Label>SEO Title</Label><Input value={editPage.seo_title || ""} onChange={e => updateField("seo_title", e.target.value)} maxLength={60} /></div>
              <div><Label>SEO Description</Label><Textarea rows={2} value={editPage.seo_description || ""} onChange={e => updateField("seo_description", e.target.value)} maxLength={160} /></div>

              <Separator />
              <h3 className="font-semibold">Visibility</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editPage.is_published ?? false} onCheckedChange={v => updateField("is_published", v)} />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editPage.is_featured ?? false} onCheckedChange={v => updateField("is_featured", v)} />
                  <Label>Featured</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editPage.id ? "Save Changes" : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
