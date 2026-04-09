import { useEffect, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Eye, Globe, Star, Copy, ExternalLink, Loader2, Search, Users
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  signing_platform_url: string;
  use_platform_booking: boolean;
  external_booking_url: string;
  social_links: Record<string, any>;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const emptyPage: Partial<NotaryPage> = {
  slug: "", display_name: "", title: "", tagline: "", bio: "", phone: "", email: "",
  website_url: "", service_areas: [], services_offered: [], credentials: {},
  theme_color: "#eab308", signing_platform_url: "", use_platform_booking: true,
  external_booking_url: "", social_links: {}, seo_title: "", seo_description: "",
  is_published: false, is_featured: false,
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

  useEffect(() => { fetchPages(); fetchNotaryUsers(); }, []);

  const handleSave = async () => {
    if (!editPage.slug || !editPage.display_name) {
      toast({ title: "Missing fields", description: "Slug and display name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editPage.id) {
        const { error } = await supabase.from("notary_pages").update(editPage as any).eq("id", editPage.id);
        if (error) throw error;
        toast({ title: "Page updated" });
      } else {
        if (!editPage.user_id) {
          toast({ title: "Select a notary user", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { error } = await supabase.from("notary_pages").insert(editPage as any);
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

  const updateField = (field: string, value: any) => setEditPage(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notary Pages</h1>
          <p className="text-sm text-muted-foreground">Manage personal service pages for all notaries</p>
        </div>
        <Button onClick={() => { setEditPage({ ...emptyPage }); setEditDialogOpen(true); }} className="gap-2">
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
                <TableHead>Notary</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.display_name}</TableCell>
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
                      <Button variant="ghost" size="icon" onClick={() => { setEditPage(p); setEditDialogOpen(true); }}>
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
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No notary pages found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPage.id ? "Edit Notary Page" : "Create Notary Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editPage.id && (
              <div>
                <Label>Notary User</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={editPage.user_id || ""}
                  onChange={e => updateField("user_id", e.target.value)}
                >
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
                <Input placeholder="Shane Goble" value={editPage.display_name || ""} onChange={e => updateField("display_name", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input placeholder="Lead Notary & Founder" value={editPage.title || ""} onChange={e => updateField("title", e.target.value)} />
              </div>
              <div>
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={editPage.theme_color || "#eab308"} onChange={e => updateField("theme_color", e.target.value)} className="h-10 w-16 p-1" />
                  <Input value={editPage.theme_color || "#eab308"} onChange={e => updateField("theme_color", e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input placeholder="Safe, Secure, Legal..." value={editPage.tagline || ""} onChange={e => updateField("tagline", e.target.value)} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea rows={4} placeholder="Tell clients about yourself..." value={editPage.bio || ""} onChange={e => updateField("bio", e.target.value)} />
            </div>

            <Separator />
            <h3 className="font-semibold">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Phone</Label><Input value={editPage.phone || ""} onChange={e => updateField("phone", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={editPage.email || ""} onChange={e => updateField("email", e.target.value)} /></div>
            </div>
            <div><Label>Website URL</Label><Input value={editPage.website_url || ""} onChange={e => updateField("website_url", e.target.value)} /></div>

            <Separator />
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
              <div>
                <Label>External Booking URL</Label>
                <Input value={editPage.external_booking_url || ""} onChange={e => updateField("external_booking_url", e.target.value)} />
              </div>
            )}

            <Separator />
            <h3 className="font-semibold">Services (JSON)</h3>
            <Textarea
              rows={4}
              placeholder='[{"name":"Acknowledgments","description":"Standard notarization","price":"$5/seal"}]'
              value={typeof editPage.services_offered === "string" ? editPage.services_offered : JSON.stringify(editPage.services_offered || [], null, 2)}
              onChange={e => { try { updateField("services_offered", JSON.parse(e.target.value)); } catch { updateField("services_offered", e.target.value); } }}
            />

            <h3 className="font-semibold">Service Areas (comma-separated)</h3>
            <Input
              placeholder="Franklin County, Delaware County..."
              value={Array.isArray(editPage.service_areas) ? (editPage.service_areas as string[]).join(", ") : ""}
              onChange={e => updateField("service_areas", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
            />

            <Separator />
            <h3 className="font-semibold">Credentials (JSON)</h3>
            <Textarea
              rows={4}
              placeholder='{"nna_certified":true,"ron_certified":true,"commission_number":"2024-OH-..."}'
              value={typeof editPage.credentials === "string" ? editPage.credentials : JSON.stringify(editPage.credentials || {}, null, 2)}
              onChange={e => { try { updateField("credentials", JSON.parse(e.target.value)); } catch { updateField("credentials", e.target.value); } }}
            />

            <Separator />
            <h3 className="font-semibold">Social Links (JSON)</h3>
            <Textarea
              rows={3}
              placeholder='{"facebook":"https://facebook.com/...","linkedin":"https://linkedin.com/in/...","twitter":"https://x.com/..."}'
              value={typeof editPage.social_links === "string" ? editPage.social_links : JSON.stringify(editPage.social_links || {}, null, 2)}
              onChange={e => { try { updateField("social_links", JSON.parse(e.target.value)); } catch { updateField("social_links", e.target.value); } }}
            />

            <Separator />
            <h3 className="font-semibold">Photos</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Profile Photo Path</Label>
                <Input placeholder="notary-pages/id/profile.jpg" value={editPage.profile_photo_path || ""} onChange={e => updateField("profile_photo_path", e.target.value)} />
              </div>
              <div>
                <Label>Cover Photo Path</Label>
                <Input placeholder="notary-pages/id/cover.jpg" value={editPage.cover_photo_path || ""} onChange={e => updateField("cover_photo_path", e.target.value)} />
              </div>
            </div>

            <Separator />
            <h3 className="font-semibold">SEO</h3>
            <div><Label>SEO Title</Label><Input value={editPage.seo_title || ""} onChange={e => updateField("seo_title", e.target.value)} /></div>
            <div><Label>SEO Description</Label><Textarea rows={2} value={editPage.seo_description || ""} onChange={e => updateField("seo_description", e.target.value)} /></div>

            <Separator />
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
          </div>

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
