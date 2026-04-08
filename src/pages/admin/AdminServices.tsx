import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Star, Clock, Image, Video, Link2 } from "lucide-react";

const categories = [
  { value: "notarization", label: "Core Notarization" },
  { value: "verification", label: "Identity & Verification" },
  { value: "document_services", label: "Document Services" },
  { value: "authentication", label: "Authentication & International" },
  { value: "business", label: "Business & Volume" },
  { value: "recurring", label: "Recurring & Value-Add" },
  { value: "consulting", label: "Consulting & Training" },
  { value: "business_services", label: "Business Services" },
  { value: "admin_support", label: "Administrative Support" },
  { value: "content_creation", label: "Content Creation" },
  { value: "research", label: "Research" },
  { value: "customer_service", label: "Customer Service" },
  { value: "technical_support", label: "Technical Support" },
  { value: "ux_testing", label: "User Experience" },
];

const pricingModels = [
  { value: "per_seal", label: "Per Seal" },
  { value: "per_document", label: "Per Document" },
  { value: "per_page", label: "Per Page" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_session", label: "Per Session" },
  { value: "flat", label: "Flat Rate" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom Quote" },
];

const iconOptions = [
  "FileText", "Monitor", "MapPin", "Users", "Globe", "Shield", "Lock", "Briefcase",
  "Home", "Headphones", "PenTool", "BarChart3", "MessageSquare", "Wrench", "Eye",
  "Copy", "ScanFace", "ClipboardCheck", "Search", "FileEdit", "Scan", "Paintbrush",
  "Building", "Flag", "Languages", "Layers", "CreditCard", "Code", "Award",
  "Building2", "Inbox", "Bell", "Layout", "GraduationCap", "Workflow", "Plane", "Mail",
];

type Service = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  short_description: string | null;
  price_from: number | null;
  price_to: number | null;
  pricing_model: string;
  is_active: boolean;
  display_order: number;
  icon: string | null;
  cancellation_hours: number | null;
  duration_minutes: number | null;
  hero_image_url: string | null;
  video_url: string | null;
  estimated_turnaround: string | null;
  is_popular: boolean;
  avg_rating: number | null;
  created_at: string;
  updated_at: string;
};

type ServiceForm = {
  name: string;
  category: string;
  description: string;
  short_description: string;
  price_from: number;
  price_to: number;
  pricing_model: string;
  is_active: boolean;
  display_order: number;
  icon: string;
  cancellation_hours: number;
  duration_minutes: number;
  hero_image_url: string;
  video_url: string;
  estimated_turnaround: string;
  is_popular: boolean;
};

const emptyForm: ServiceForm = {
  name: "", category: "notarization", description: "", short_description: "",
  price_from: 0, price_to: 0, pricing_model: "flat", is_active: true, display_order: 0, icon: "FileText",
  cancellation_hours: 24, duration_minutes: 30, hero_image_url: "", video_url: "",
  estimated_turnaround: "", is_popular: false,
};

function PricingRulesTab() {
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", rule_type: "discount", condition_field: "signer_count", condition_operator: "gte", condition_value: "2", adjustment_type: "percentage", adjustment_value: 10, is_active: true, priority: 0 });

  const fetchRules = async () => {
    const { data } = await supabase.from("pricing_rules").select("*").order("priority");
    if (data) setRules(data);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const save = async () => {
    const payload = { ...form, condition: { field: form.condition_field, operator: form.condition_operator, value: form.condition_value } };
    const { condition_field, condition_operator, condition_value, ...rest } = payload;
    const dbPayload = { ...rest, condition: { field: condition_field, operator: condition_operator, value: condition_value } };

    if (editingRule) {
      await supabase.from("pricing_rules").update(dbPayload).eq("id", editingRule.id);
      toast({ title: "Rule updated" });
    } else {
      await supabase.from("pricing_rules").insert(dbPayload);
      toast({ title: "Rule created" });
    }
    setDialogOpen(false);
    setEditingRule(null);
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this pricing rule?")) return;
    await supabase.from("pricing_rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: "Rule deleted" });
  };

  const openAdd = () => {
    setEditingRule(null);
    setForm({ name: "", rule_type: "discount", condition_field: "signer_count", condition_operator: "gte", condition_value: "2", adjustment_type: "percentage", adjustment_value: 10, is_active: true, priority: rules.length });
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setEditingRule(r);
    setForm({
      name: r.name, rule_type: r.rule_type || "discount",
      condition_field: r.condition?.field || "signer_count",
      condition_operator: r.condition?.operator || "gte",
      condition_value: String(r.condition?.value || ""),
      adjustment_type: r.adjustment_type || "percentage",
      adjustment_value: r.adjustment_value || 0,
      is_active: r.is_active, priority: r.priority || 0,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Define automatic pricing adjustments based on conditions (volume, service type, time of day).</p>
        <Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" /> Add Rule</Button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <Card className="border-border/50">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">{r.priority}</TableCell>
                    <TableCell className="font-medium text-sm">{r.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.rule_type || "discount"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.condition?.field} {r.condition?.operator} {r.condition?.value}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.adjustment_type === "percentage" ? `${r.adjustment_value}%` : `$${r.adjustment_value}`} {r.rule_type === "surcharge" ? "surcharge" : "off"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={r.is_active} onCheckedChange={async (v) => {
                        await supabase.from("pricing_rules").update({ is_active: v }).eq("id", r.id);
                        setRules(prev => prev.map(x => x.id === r.id ? { ...x, is_active: v } : x));
                      }} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRule(r.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pricing rules yet. Add one to automate adjustments.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingRule ? "Edit" : "Add"} Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Multi-signer discount" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.rule_type} onValueChange={v => setForm({ ...form, rule_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="surcharge">Surcharge</SelectItem>
                    <SelectItem value="override">Override</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Condition</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Field</Label>
                <Select value={form.condition_field} onValueChange={v => setForm({ ...form, condition_field: v })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signer_count">Signer Count</SelectItem>
                    <SelectItem value="service_type">Service Type</SelectItem>
                    <SelectItem value="notarization_type">Notarization Type</SelectItem>
                    <SelectItem value="after_hours">After Hours</SelectItem>
                    <SelectItem value="travel_distance">Travel Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Operator</Label>
                <Select value={form.condition_operator} onValueChange={v => setForm({ ...form, condition_operator: v })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">equals</SelectItem>
                    <SelectItem value="gte">≥</SelectItem>
                    <SelectItem value="lte">≤</SelectItem>
                    <SelectItem value="gt">&gt;</SelectItem>
                    <SelectItem value="lt">&lt;</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input className="text-xs" value={form.condition_value} onChange={e => setForm({ ...form, condition_value: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Adjustment Type</Label>
                <Select value={form.adjustment_type} onValueChange={v => setForm({ ...form, adjustment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input type="number" step="0.01" value={form.adjustment_value} onChange={e => setForm({ ...form, adjustment_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminServices() {
  usePageMeta({ title: "Services", noIndex: true });
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [faqCount, setFaqCount] = useState<Record<string, number>>({});
  const [reqCount, setReqCount] = useState<Record<string, number>>({});
  const [workflowCount, setWorkflowCount] = useState<Record<string, number>>({});

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("display_order");
    if (data) setServices(data as Service[]);
    setLoading(false);
  };

  const fetchRelatedCounts = async () => {
    const [faqRes, reqRes, wfRes] = await Promise.all([
      supabase.from("service_faqs").select("service_id"),
      supabase.from("service_requirements").select("service_id"),
      supabase.from("service_workflows").select("service_id"),
    ]);
    const count = (rows: { service_id: string }[] | null) => {
      const map: Record<string, number> = {};
      rows?.forEach(r => { map[r.service_id] = (map[r.service_id] || 0) + 1; });
      return map;
    };
    setFaqCount(count(faqRes.data as any));
    setReqCount(count(reqRes.data as any));
    setWorkflowCount(count(wfRes.data as any));
  };

  useEffect(() => { fetchServices(); fetchRelatedCounts(); }, []);

  const filtered = activeTab === "all" ? services : services.filter(s => s.category === activeTab);

  // Detect near-duplicates
  const duplicateWarnings = (() => {
    const map = new Map<string, Service[]>();
    services.forEach(s => {
      const key = s.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
      map.set(key, [...(map.get(key) || []), s]);
    });
    return Array.from(map.values()).filter(v => v.length > 1);
  })();

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, display_order: services.length });
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name, category: s.category, description: s.description || "",
      short_description: s.short_description || "", price_from: s.price_from || 0,
      price_to: s.price_to || 0, pricing_model: s.pricing_model, is_active: s.is_active,
      display_order: s.display_order, icon: s.icon || "FileText",
      cancellation_hours: s.cancellation_hours ?? 24,
      duration_minutes: s.duration_minutes ?? 30,
      hero_image_url: s.hero_image_url || "",
      video_url: s.video_url || "",
      estimated_turnaround: s.estimated_turnaround || "",
      is_popular: s.is_popular,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      name: form.name, category: form.category, description: form.description || null,
      short_description: form.short_description || null, price_from: form.price_from,
      price_to: form.price_to, pricing_model: form.pricing_model, is_active: form.is_active,
      display_order: form.display_order, icon: form.icon || null,
      cancellation_hours: form.cancellation_hours,
      duration_minutes: form.duration_minutes,
      hero_image_url: form.hero_image_url || null,
      video_url: form.video_url || null,
      estimated_turnaround: form.estimated_turnaround || null,
      is_popular: form.is_popular,
    };
    if (editingId) {
      const { error } = await supabase.from("services").update(payload).eq("id", editingId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Service updated" });
    } else {
      const { error } = await supabase.from("services").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Service added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchServices();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service? Related FAQs, requirements, and workflows will also be removed.")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(x => x.id !== id));
    toast({ title: "Service deleted" });
  };

  const formatPrice = (s: Service) => {
    if (s.pricing_model === "custom") return "Custom Quote";
    const from = Number(s.price_from || 0);
    const to = Number(s.price_to || 0);
    if (from === 0 && to === 0) return "Contact";
    const suffix = s.pricing_model === "monthly" ? "/mo" : s.pricing_model === "per_seal" ? "/seal" : s.pricing_model === "per_document" ? "/doc" : s.pricing_model === "per_hour" ? "/hr" : s.pricing_model === "per_session" ? "/session" : s.pricing_model === "per_page" ? "/page" : "";
    return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Services Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage all services, pricing, and availability • {services.length} total</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Service</Button>
      </div>

      {duplicateWarnings.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-3 px-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-yellow-700">Potential duplicates detected:</span>{" "}
              {duplicateWarnings.map((group, i) => (
                <span key={i}>{i > 0 ? " • " : ""}{group.map(s => s.name).join(" ↔ ")}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content gap reminder */}
      {(() => {
        const missingDesc = services.filter(s => s.is_active && !s.description);
        const missingTurnaround = services.filter(s => s.is_active && !s.estimated_turnaround);
        const missingFaqs = services.filter(s => s.is_active && !(faqCount[s.id]));
        const total = missingDesc.length + missingTurnaround.length + missingFaqs.length;
        if (total === 0) return null;
        return (
          <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-3 px-4 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">Content gaps detected:</span>{" "}
                {missingDesc.length > 0 && <span>{missingDesc.length} services missing descriptions. </span>}
                {missingTurnaround.length > 0 && <span>{missingTurnaround.length} missing turnaround estimates. </span>}
                {missingFaqs.length > 0 && <span>{missingFaqs.length} missing FAQs. </span>}
                <span className="text-amber-600 dark:text-amber-300">Complete these for better SEO and client experience.</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({services.length})</TabsTrigger>
          <TabsTrigger value="pricing-rules">Pricing Rules</TabsTrigger>
          {categories.map(c => {
            const count = services.filter(s => s.category === c.value).length;
            if (count === 0) return null;
            return <TabsTrigger key={c.value} value={c.value}>{c.label} ({count})</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      {activeTab === "pricing-rules" && <PricingRulesTab />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id} className={!s.is_active ? "opacity-50" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{s.display_order}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.short_description}</p>
                        {s.estimated_turnaround && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {s.estimated_turnaround}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === s.category)?.label || s.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(s)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.duration_minutes ?? 30}m</TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs text-muted-foreground">
                        {(faqCount[s.id] || 0) > 0 && <Badge variant="secondary" className="text-[10px]">{faqCount[s.id]} FAQ</Badge>}
                        {(reqCount[s.id] || 0) > 0 && <Badge variant="secondary" className="text-[10px]">{reqCount[s.id]} Req</Badge>}
                        {(workflowCount[s.id] || 0) > 0 && <Badge variant="secondary" className="text-[10px]">{workflowCount[s.id]} Steps</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.is_popular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteService(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No services in this category</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── Comprehensive Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>

          <Accordion type="multiple" defaultValue={["basic", "pricing", "settings", "media"]} className="space-y-2">
            {/* Basic Info */}
            <AccordionItem value="basic">
              <AccordionTrigger className="text-sm font-semibold">Basic Information</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label>Service Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Remote Online Notarization" />
                </div>
                <div>
                  <Label>Short Description</Label>
                  <Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} placeholder="One-liner for cards (max ~100 chars)" maxLength={150} />
                  <p className="text-[11px] text-muted-foreground mt-1">{form.short_description.length}/150</p>
                </div>
                <div>
                  <Label>Full Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Detailed service description shown on the detail page..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Select value={form.icon} onValueChange={v => setForm({ ...form, icon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-48">{iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Pricing */}
            <AccordionItem value="pricing">
              <AccordionTrigger className="text-sm font-semibold">Pricing & Duration</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Pricing Model</Label>
                    <Select value={form.pricing_model} onValueChange={v => setForm({ ...form, pricing_model: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{pricingModels.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price From ($)</Label>
                    <Input type="number" step="0.01" min="0" value={form.price_from} onChange={e => setForm({ ...form, price_from: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Price To ($)</Label>
                    <Input type="number" step="0.01" min="0" value={form.price_to} onChange={e => setForm({ ...form, price_to: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min="5" step="5" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })} />
                    <p className="text-[11px] text-muted-foreground mt-1">Typical session length</p>
                  </div>
                  <div>
                    <Label>Estimated Turnaround</Label>
                    <Input value={form.estimated_turnaround} onChange={e => setForm({ ...form, estimated_turnaround: e.target.value })} placeholder="e.g. Same day, 2-3 business days" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Settings & Controls */}
            <AccordionItem value="settings">
              <AccordionTrigger className="text-sm font-semibold">Settings & Controls</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Display Order</Label>
                    <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
                    <p className="text-[11px] text-muted-foreground mt-1">Lower = appears first</p>
                  </div>
                  <div>
                    <Label>Cancellation Window (hours)</Label>
                    <Input type="number" min="0" value={form.cancellation_hours} onChange={e => setForm({ ...form, cancellation_hours: parseInt(e.target.value) || 0 })} />
                    <p className="text-[11px] text-muted-foreground mt-1">Hours before appt that cancellation is allowed</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active (visible to clients)</Label>
                      <p className="text-[11px] text-muted-foreground">Shows in public catalog</p>
                    </div>
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mark as Popular</Label>
                      <p className="text-[11px] text-muted-foreground">Shows a star badge on cards</p>
                    </div>
                    <Switch checked={form.is_popular} onCheckedChange={v => setForm({ ...form, is_popular: v })} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Media */}
            <AccordionItem value="media">
              <AccordionTrigger className="text-sm font-semibold">Media & Links</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Hero Image URL</Label>
                  <Input value={form.hero_image_url} onChange={e => setForm({ ...form, hero_image_url: e.target.value })} placeholder="https://..." />
                  {form.hero_image_url && (
                    <img src={form.hero_image_url} alt="Hero preview" className="mt-2 rounded-md max-h-32 object-cover border" onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video URL</Label>
                  <Input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube or Vimeo link" />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Related Data (read-only counts when editing) */}
            {editingId && (
              <AccordionItem value="related">
                <AccordionTrigger className="text-sm font-semibold">Related Data</AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold">{faqCount[editingId] || 0}</p>
                      <p className="text-xs text-muted-foreground">FAQs</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold">{reqCount[editingId] || 0}</p>
                      <p className="text-xs text-muted-foreground">Requirements</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold">{workflowCount[editingId] || 0}</p>
                      <p className="text-xs text-muted-foreground">Workflow Steps</p>
                    </Card>
                  </div>
                  <p className="text-xs text-muted-foreground">Manage FAQs, requirements, and workflow steps from the Service Detail page.</p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
