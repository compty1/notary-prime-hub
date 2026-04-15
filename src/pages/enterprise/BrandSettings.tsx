import React, { useState } from "react";
import { Palette, Plus, Trash2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const FONTS = ["Inter", "Roboto", "Open Sans", "Playfair Display", "Merriweather", "Lato"];

const BrandSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: "", primary_color: "#1a1a2e", secondary_color: "#e94560", font_family: "Inter", tagline: "", is_default: false });

  const { data: kits } = useQuery({
    queryKey: ["brand-kits", user?.id],
    queryFn: async () => { const { data } = await supabase.from("client_brand_kits").select("*").order("created_at", { ascending: false }); return data || []; },
    enabled: !!user,
  });

  const createKit = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("client_brand_kits").insert({ ...form, user_id: user!.id }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brand-kits"] }); setShowForm(false); toast.success("Brand kit created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteKit = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("client_brand_kits").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brand-kits"] }); toast.success("Kit deleted"); },
  });

  return (
    <EnterpriseLayout title="Brand Kit Settings" icon={Palette} description="Manage white-label branding for generated documents">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild><Button variant="dark"><Plus className="mr-2 h-4 w-4" />New Brand Kit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-black">Create Brand Kit</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Company Name</Label><Input value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
                <div><Label className="text-xs">Tagline</Label><Input value={form.tagline} onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Primary Color</Label><Input type="color" value={form.primary_color} onChange={(e) => setForm(f => ({ ...f, primary_color: e.target.value }))} className="h-10" /></div>
                  <div><Label className="text-xs">Secondary Color</Label><Input type="color" value={form.secondary_color} onChange={(e) => setForm(f => ({ ...f, secondary_color: e.target.value }))} className="h-10" /></div>
                </div>
                <div><Label className="text-xs">Font</Label><Select value={form.font_family} onValueChange={(v) => setForm(f => ({ ...f, font_family: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center gap-3"><Switch checked={form.is_default} onCheckedChange={(v) => setForm(f => ({ ...f, is_default: v }))} /><Label className="text-xs">Set as default</Label></div>
                <Button onClick={() => createKit.mutate()} disabled={!form.company_name} variant="dark" className="w-full">Create Kit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits?.map((k: any) => (
            <Card key={k.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{k.company_name}</h3>
                    {k.tagline && <p className="text-xs text-muted-foreground">{k.tagline}</p>}
                  </div>
                  {k.is_default && <Star className="h-4 w-4 text-primary fill-primary" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: k.primary_color }} />
                  <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: k.secondary_color }} />
                  <span className="text-xs text-muted-foreground">{k.font_family}</span>
                </div>
                {/* Preview */}
                <div className="rounded-[8px] border p-3" style={{ borderColor: k.primary_color }}>
                  <p style={{ fontFamily: k.font_family, color: k.primary_color }} className="text-sm font-bold">{k.company_name}</p>
                  {k.tagline && <p style={{ color: k.secondary_color }} className="text-[10px]">{k.tagline}</p>}
                </div>
                <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => deleteKit.mutate(k.id)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default BrandSettings;
