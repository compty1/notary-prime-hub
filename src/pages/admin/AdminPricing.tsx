import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, DollarSign, Percent, Tag, Map, Calculator, Crown, Zap, Plus, Trash2 } from "lucide-react";
import { calculatePrice, parseSettings, DEFAULT_SETTINGS, type PricingInput, type PricingSettings } from "@/lib/pricingEngine";

interface PricingRule {
  id: string;
  rule_type: string;
  name: string;
  adjustment_type: string | null;
  adjustment_value: number | null;
  conditions: Record<string, unknown> | null;
  promo_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  priority: number;
}

export default function AdminPricing() {
  usePageMeta({ title: "Pricing Engine", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<PricingRule[]>([]);
  interface ServiceItem { id: string; name: string; base_price: number | null; is_active: boolean; category: string | null; price_from: number | null; price_to: number | null; }
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Speed multipliers
  const [speedMultipliers, setSpeedMultipliers] = useState<Record<string, number>>({ standard: 1.0, priority: 1.25, rush: 1.5, emergency: 2.0 });
  // Volume discounts
  interface VolumeTier { minQty: number; maxQty: number; discount: number; }
  interface LoyaltyTier { name: string; minOrders: number; discount: number; }
  interface GeoSurcharge { zone: string; surcharge: number; }
  const [volumeTiers, setVolumeTiers] = useState<VolumeTier[]>([]);
  // Loyalty tiers
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([]);
  // Geographic surcharges
  const [geoSurcharges, setGeoSurcharges] = useState<GeoSurcharge[]>([]);

  // Calculator state
  const [calcInput, setCalcInput] = useState<PricingInput>({
    notarizationType: "in_person", documentCount: 1, signerCount: 1,
    travelMiles: 0, isRush: false, isAfterHours: false, witnessCount: 0,
    needsApostille: false, apostilleCount: 0,
  });

  useEffect(() => {
    (async () => {
      const [settingsRes, rulesRes, servicesRes] = await Promise.all([
        supabase.from("platform_settings").select("setting_key, setting_value"),
        supabase.from("pricing_rules").select("*").order("sort_order"),
        supabase.from("services").select("*").order("name"),
      ]);
      if (settingsRes.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s: { setting_key: string; setting_value: string }) => { map[s.setting_key] = s.setting_value; });
        setSettings(map);
        try { setSpeedMultipliers(JSON.parse(map.speed_multipliers || "{}")); } catch {}
        try { setVolumeTiers(JSON.parse(map.volume_discount_tiers || "[]")); } catch {}
        try { setLoyaltyTiers(JSON.parse(map.loyalty_tiers || "[]")); } catch {}
        try { setGeoSurcharges(JSON.parse(map.geographic_surcharges || "[]")); } catch {}
      }
      if (rulesRes.data) setRules(rulesRes.data as PricingRule[]);
      if (servicesRes.data) setServices(servicesRes.data);
      setLoading(false);
    })();
  }, []);

  const saveJsonSetting = async (key: string, value: unknown) => {
    setSaving(true);
    const json = JSON.stringify(value);
    await supabase.from("platform_settings").update({ setting_value: json, updated_at: new Date().toISOString(), updated_by: user?.id }).eq("setting_key", key);
    setSettings(prev => ({ ...prev, [key]: json }));
    toast({ title: "Saved" });
    setSaving(false);
  };

  const addPromotion = async () => {
    const { data } = await supabase.from("pricing_rules").insert({
      rule_type: "promotion", name: "New Promotion", adjustment_type: "percentage", adjustment_value: 10, is_active: false,
    }).select().single();
    if (data) setRules(prev => [...prev, data as PricingRule]);
  };

  const deleteRule = async (id: string) => {
    await supabase.from("pricing_rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = async (id: string, updates: Partial<PricingRule>) => {
    const { conditions, promo_code, start_date, end_date, ...safeUpdates } = updates;
    await supabase.from("pricing_rules").update(safeUpdates).eq("id", id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const pricingSettings = parseSettings(settings);
  const calcResult = calculatePrice(calcInput, pricingSettings);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dynamic Pricing Engine</h1>
        <p className="text-sm text-muted-foreground">Manage service pricing, speed multipliers, volume discounts, promotions, and geographic surcharges</p>
      </div>

      <Tabs defaultValue="base-prices" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="base-prices" className="text-xs gap-1"><DollarSign className="h-3 w-3" /> Base Prices</TabsTrigger>
          <TabsTrigger value="speed" className="text-xs gap-1"><Zap className="h-3 w-3" /> Speed</TabsTrigger>
          <TabsTrigger value="volume" className="text-xs gap-1"><Percent className="h-3 w-3" /> Volume</TabsTrigger>
          <TabsTrigger value="loyalty" className="text-xs gap-1"><Crown className="h-3 w-3" /> Loyalty</TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs gap-1"><Tag className="h-3 w-3" /> Promotions</TabsTrigger>
          <TabsTrigger value="geographic" className="text-xs gap-1"><Map className="h-3 w-3" /> Geographic</TabsTrigger>
          <TabsTrigger value="calculator" className="text-xs gap-1"><Calculator className="h-3 w-3" /> Calculator</TabsTrigger>
        </TabsList>

        {/* Base Prices */}
        <TabsContent value="base-prices">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Service Base Prices</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price From</TableHead>
                    <TableHead className="text-right">Price To</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.category || "General"}</Badge></TableCell>
                      <TableCell className="text-right">${s.price_from?.toFixed(2) || "—"}</TableCell>
                      <TableCell className="text-right">{s.price_to ? `$${s.price_to.toFixed(2)}` : "—"}</TableCell>
                      <TableCell><Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">{s.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">Edit base prices in the <a href="/admin/services" className="text-primary underline">Services Catalog</a>.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Speed Multipliers */}
        <TabsContent value="speed">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Speed Multipliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(speedMultipliers).map(([key, val]) => (
                  <Card key={key} className="border-border/50">
                    <CardContent className="pt-4 space-y-2">
                      <Label className="capitalize font-semibold">{key}</Label>
                      <Input type="number" step="0.05" value={val} onChange={e => setSpeedMultipliers(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 1 }))} />
                      <p className="text-xs text-muted-foreground">{val}x base price</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Switch checked={settings.rush_pricing_enabled === "true"} onCheckedChange={async (v) => {
                  await supabase.from("platform_settings").update({ setting_value: v ? "true" : "false" }).eq("setting_key", "rush_pricing_enabled");
                  setSettings(prev => ({ ...prev, rush_pricing_enabled: v ? "true" : "false" }));
                }} />
                <span className="text-sm">Rush pricing enabled</span>
              </div>
              <Button className="mt-4" onClick={() => saveJsonSetting("speed_multipliers", speedMultipliers)} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save Multipliers
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume Discounts */}
        <TabsContent value="volume">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Percent className="h-5 w-5 text-primary" /> Volume Discount Tiers</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Min Qty</TableHead>
                    <TableHead>Max Qty</TableHead>
                    <TableHead>Discount %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volumeTiers.map((t: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Input value={t.name} onChange={e => { const c = [...volumeTiers]; c[i] = { ...t, name: e.target.value }; setVolumeTiers(c); }} /></TableCell>
                      <TableCell><Input type="number" value={t.min_qty} onChange={e => { const c = [...volumeTiers]; c[i] = { ...t, min_qty: parseInt(e.target.value) }; setVolumeTiers(c); }} /></TableCell>
                      <TableCell><Input type="number" value={t.max_qty || ""} placeholder="∞" onChange={e => { const c = [...volumeTiers]; c[i] = { ...t, max_qty: e.target.value ? parseInt(e.target.value) : null }; setVolumeTiers(c); }} /></TableCell>
                      <TableCell><Input type="number" value={t.discount_pct} onChange={e => { const c = [...volumeTiers]; c[i] = { ...t, discount_pct: parseInt(e.target.value) }; setVolumeTiers(c); }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center gap-3 mt-4">
                <Switch checked={settings.volume_discounts_enabled === "true"} onCheckedChange={async (v) => {
                  await supabase.from("platform_settings").update({ setting_value: v ? "true" : "false" }).eq("setting_key", "volume_discounts_enabled");
                  setSettings(prev => ({ ...prev, volume_discounts_enabled: v ? "true" : "false" }));
                }} />
                <span className="text-sm">Volume discounts enabled</span>
              </div>
              <Button className="mt-4" onClick={() => saveJsonSetting("volume_discount_tiers", volumeTiers)} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save Tiers
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Tiers */}
        <TabsContent value="loyalty">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Loyalty Tiers</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Min Orders</TableHead>
                    <TableHead>Discount %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loyaltyTiers.map((t: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.min_orders}</TableCell>
                      <TableCell>{t.discount_pct}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center gap-3 mt-4">
                <Switch checked={settings.loyalty_program_enabled === "true"} onCheckedChange={async (v) => {
                  await supabase.from("platform_settings").update({ setting_value: v ? "true" : "false" }).eq("setting_key", "loyalty_program_enabled");
                  setSettings(prev => ({ ...prev, loyalty_program_enabled: v ? "true" : "false" }));
                }} />
                <span className="text-sm">Loyalty program enabled</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions */}
        <TabsContent value="promotions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Promotions</CardTitle>
              <Button size="sm" onClick={addPromotion}><Plus className="mr-1 h-3 w-3" /> Add Promotion</Button>
            </CardHeader>
            <CardContent>
              {rules.filter(r => r.rule_type === "promotion").length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No promotions yet. Click "Add Promotion" to create one.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rules.filter(r => r.rule_type === "promotion").map(rule => (
                    <Card key={rule.id} className="border-border/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <Input value={rule.name} onChange={e => updateRule(rule.id, { name: e.target.value })} className="font-semibold" />
                          <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)} aria-label="Action"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Discount %</Label><Input type="number" value={rule.adjustment_value || 0} onChange={e => updateRule(rule.id, { adjustment_value: parseFloat(e.target.value) })} /></div>
                          <div><Label className="text-xs">Type</Label><Input value={rule.adjustment_type || "percentage"} readOnly className="bg-muted" /></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.is_active} onCheckedChange={v => updateRule(rule.id, { is_active: v })} />
                          <span className="text-xs">{rule.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mt-4">
                <Switch checked={settings.promo_codes_enabled === "true"} onCheckedChange={async (v) => {
                  await supabase.from("platform_settings").update({ setting_value: v ? "true" : "false" }).eq("setting_key", "promo_codes_enabled");
                  setSettings(prev => ({ ...prev, promo_codes_enabled: v ? "true" : "false" }));
                }} />
                <span className="text-sm">Promo codes enabled globally</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Surcharges */}
        <TabsContent value="geographic">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Map className="h-5 w-5 text-primary" /> Geographic Surcharges</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">Surcharge ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoSurcharges.map((z: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{z.zone}</TableCell>
                      <TableCell className="text-right">
                        <Input type="number" className="w-24 ml-auto" value={z.surcharge} onChange={e => {
                          const c = [...geoSurcharges]; c[i] = { ...z, surcharge: parseFloat(e.target.value) || 0 }; setGeoSurcharges(c);
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center gap-3 mt-4">
                <Switch checked={settings.geographic_surcharges_enabled === "true"} onCheckedChange={async (v) => {
                  await supabase.from("platform_settings").update({ setting_value: v ? "true" : "false" }).eq("setting_key", "geographic_surcharges_enabled");
                  setSettings(prev => ({ ...prev, geographic_surcharges_enabled: v ? "true" : "false" }));
                }} />
                <span className="text-sm">Geographic surcharges enabled</span>
              </div>
              <Button className="mt-4" onClick={() => saveJsonSetting("geographic_surcharges", geoSurcharges)} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save Surcharges
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Calculator */}
        <TabsContent value="calculator">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Price Simulator</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Notarization Type</Label>
                  <Select value={calcInput.notarizationType} onValueChange={v => setCalcInput(p => ({ ...p, notarizationType: v as "in_person" | "ron" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="in_person">In Person</SelectItem><SelectItem value="ron">RON</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Documents</Label><Input type="number" min={1} value={calcInput.documentCount} onChange={e => setCalcInput(p => ({ ...p, documentCount: parseInt(e.target.value) || 1 }))} /></div>
                  <div><Label>Signers</Label><Input type="number" min={1} value={calcInput.signerCount} onChange={e => setCalcInput(p => ({ ...p, signerCount: parseInt(e.target.value) || 1 }))} /></div>
                  <div><Label>Travel Miles</Label><Input type="number" min={0} value={calcInput.travelMiles} onChange={e => setCalcInput(p => ({ ...p, travelMiles: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><Label>Witnesses</Label><Input type="number" min={0} value={calcInput.witnessCount} onChange={e => setCalcInput(p => ({ ...p, witnessCount: parseInt(e.target.value) || 0 }))} /></div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={calcInput.isRush} onCheckedChange={v => setCalcInput(p => ({ ...p, isRush: v }))} /> Rush</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={calcInput.isAfterHours} onCheckedChange={v => setCalcInput(p => ({ ...p, isAfterHours: v }))} /> After-Hours</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={calcInput.needsApostille} onCheckedChange={v => setCalcInput(p => ({ ...p, needsApostille: v }))} /> Apostille</label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Price Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {calcResult.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={item.amount < 0 ? "text-primary font-medium" : "font-medium"}>{item.amount < 0 ? "-" : ""}${Math.abs(item.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${calcResult.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Deposit (25%)</span>
                    <span>${calcResult.deposit.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
