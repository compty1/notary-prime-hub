import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, BookOpen, FileText, CheckSquare, Plus, Users, Briefcase, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RESOURCE_TYPES = ["guide", "template", "checklist", "tool"];
const AUDIENCES = ["notary", "professional", "both"];
const CATEGORIES = ["marketing", "operations", "pricing", "networking", "onboarding", "legal"];

const GUIDES = [
  { title: "How to Get Business Clients as a Notary", slug: "get-business-clients-notary", category: "marketing", target_audience: "notary", resource_type: "guide",
    content_html: `<h2>Real Strategies for Building a Notary Client Base</h2>
<h3>1. Title Company Outreach</h3><p>Contact local title companies and offer mobile signing services. Provide your commission details, E&O insurance certificate, and NNA certification.</p>
<h3>2. Real Estate Agent Networking</h3><p>Attend local RE board meetings. Offer after-hours and weekend availability — this is your competitive edge.</p>
<h3>3. Hospital & Nursing Home Partnerships</h3><p>Facilities need notaries for POA, advance directives, and living wills. Build a relationship with social workers.</p>
<h3>4. Law Firm Relationships</h3><p>Estate planning and immigration attorneys need frequent notarizations. Drop off cards and follow up monthly.</p>
<h3>5. Google Business Profile</h3><p>Optimize your listing with photos, services list, and client reviews. Most local searches start here.</p>` },
  { title: "Common Obstacles & What Worked", slug: "common-obstacles", category: "operations", target_audience: "notary", resource_type: "guide",
    content_html: `<h2>Real Solutions from Practicing Notaries</h2>
<h3>Low-Ball Offers</h3><p>Set minimum fees and stick to them. Ohio law allows up to $5/notarial act (ORC §147.08), but your travel and expertise justify additional service fees.</p>
<h3>Competing with Mobile Apps</h3><p>Emphasize in-person trust, immediate service, and handling complex documents that apps can't manage.</p>
<h3>After-Hours Requests</h3><p>Charge premium rates. Most successful notaries report 40%+ revenue from evening/weekend appointments.</p>` },
  { title: "Building a Client Base for Document Services", slug: "build-document-services-base", category: "marketing", target_audience: "professional", resource_type: "guide",
    content_html: `<h2>Growing Your Document Services Practice</h2>
<h3>LinkedIn Outreach</h3><p>Connect with HR managers, legal assistants, and office managers. Post weekly tips about document compliance.</p>
<h3>Referral Systems</h3><p>Offer 10% referral bonuses. Create a formal referral partner program with tracking codes.</p>
<h3>Local Business Partnerships</h3><p>Partner with accounting firms, insurance agencies, and immigration consultants who frequently need document services.</p>` },
  { title: "Launch Your Notary Business in 30 Days", slug: "30-day-launch-checklist", category: "onboarding", target_audience: "notary", resource_type: "checklist",
    content_html: `<h2>30-Day Notary Business Launch Checklist</h2>
<p><strong>Week 1:</strong> Commission application, bond purchase, E&O insurance, supplies order</p>
<p><strong>Week 2:</strong> NNA certification, RON platform setup, journal system, Google Business Profile</p>
<p><strong>Week 3:</strong> Website/landing page, business cards, cold outreach to 20 businesses</p>
<p><strong>Week 4:</strong> First 5 appointments, collect reviews, join local networking group</p>` },
];

export default function AdminBusinessGrowth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", category: "marketing", content_html: "", resource_type: "guide", target_audience: "both" });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["growth-resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("growth_resources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      for (const g of GUIDES) {
        const existing = resources.find((r: any) => r.slug === g.slug);
        if (!existing) {
          await supabase.from("growth_resources").insert(g as any);
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["growth-resources"] }); toast({ title: "Guides seeded!" }); },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("growth_resources").insert(form as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["growth-resources"] }); setShowAdd(false); toast({ title: "Resource added" }); },
  });

  const filtered = tab === "all" ? resources : resources.filter((r: any) => r.target_audience === tab || r.target_audience === "both");
  const typeIcon = (t: string) => t === "guide" ? <BookOpen className="h-4 w-4" /> : t === "template" ? <FileText className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Business Expansion Hub</h1>
          <p className="text-sm text-muted-foreground">Growth guides, templates, and outreach tools for notaries and professionals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>Seed Guides</Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Resource</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Growth Resource</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))} /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Type</Label><Select value={form.resource_type} onValueChange={v => setForm(f => ({ ...f, resource_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Audience</Label><Select value={form.target_audience} onValueChange={v => setForm(f => ({ ...f, target_audience: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>Content (HTML)</Label><Textarea rows={6} value={form.content_html} onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))} /></div>
                <Button onClick={() => addMutation.mutate()} disabled={!form.title || addMutation.isPending} className="w-full">Save Resource</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="notary"><Users className="h-3 w-3 mr-1" /> Notary</TabsTrigger>
          <TabsTrigger value="professional"><Briefcase className="h-3 w-3 mr-1" /> Professional</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r: any) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold leading-tight">{r.title}</CardTitle>
                  <div className="flex items-center gap-1">{typeIcon(r.resource_type)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="outline" className="text-[10px]">{r.resource_type}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{r.target_audience}</Badge>
                  <Badge className="text-[10px] bg-primary/10 text-primary">{r.category}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" /> {r.view_count || 0} views</div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No resources found. Click "Seed Guides" to add starter content.</p>}
        </div>
      )}
    </div>
  );
}
