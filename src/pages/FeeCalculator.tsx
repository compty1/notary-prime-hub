import { useState, useEffect, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Calculator, DollarSign, MapPin, Info } from "lucide-react";
import { motion } from "framer-motion";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { calculatePrice, parseSettings } from "@/lib/pricingEngine";

const DEFAULT_OFFICE = { lat: 39.9612, lng: -82.9988 };

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function FeeCalculator() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);

  usePageMeta({ title: "Notary Fee Calculator", description: "Calculate Ohio notary fees instantly. Transparent pricing for in-person, mobile, and remote online notarization services." });
  const [notarizationType, setNotarizationType] = useState<"in_person" | "ron">("in_person");
  const [documentCount, setDocumentCount] = useState(1);
  const [signerCount, setSignerCount] = useState(1);
  const [travelMiles, setTravelMiles] = useState(0);
  const [isRush, setIsRush] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [witnessCount, setWitnessCount] = useState(0);
  const [needsApostille, setNeedsApostille] = useState(false);

  const [meetingAddress, setMeetingAddress] = useState("");
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value").then(({ data }) => {
      if (data) {
        const s: Record<string, string> = {};
        data.forEach((r: any) => { s[r.setting_key] = r.setting_value; });
        setSettings(s);
      }
      setSettingsLoading(false);
    });
  }, []);

  const effectiveMiles = manualOverride ? travelMiles : (calculatedDistance ?? travelMiles);

  const breakdown = useMemo(() => {
    if (!settings.base_fee_per_signature && Object.keys(settings).length === 0) return null;
    const parsed = parseSettings(settings);
    return calculatePrice({
      notarizationType,
      documentCount,
      signerCount,
      travelMiles: notarizationType === "in_person" ? effectiveMiles : undefined,
      isRush,
      isAfterHours,
      witnessCount,
      needsApostille,
    }, parsed);
  }, [notarizationType, documentCount, signerCount, effectiveMiles, isRush, isAfterHours, witnessCount, needsApostille, settings]);

  const bookingUrl = `/book?type=${notarizationType}&estimate=${breakdown?.total.toFixed(2) || "0"}&docs=${documentCount}${needsApostille ? "&apostille=true" : ""}`;

  const handleAddressSelect = (suggestion: { address: string; city: string; state: string; zip: string; fullAddress: string }) => {
    setMeetingAddress(suggestion.fullAddress);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(suggestion.fullAddress)}&format=json&limit=1&countrycodes=us`, {
      headers: { "User-Agent": "Notar/1.0" },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          const dist = haversineDistance(DEFAULT_OFFICE.lat, DEFAULT_OFFICE.lng, parseFloat(data[0].lat), parseFloat(data[0].lon));
          setCalculatedDistance(Math.round(dist * 10) / 10);
          if (!manualOverride) setTravelMiles(Math.round(dist * 10) / 10);
        }
      })
      .catch(() => {});
  };

  return (
    <PageShell>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs />
        <div className="mb-8 text-center">
          <h1 className="font-sans text-3xl font-bold mb-2">Notarization Fee Calculator</h1>
          <p className="text-muted-foreground">Get a transparent estimate before you book</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-sans flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Configure</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {settingsLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  <div>
                    <Label>Service Type</Label>
                    <Select value={notarizationType} onValueChange={(v) => setNotarizationType(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In-Person Notarization</SelectItem>
                        <SelectItem value="ron">Remote Online (RON)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Number of Documents</Label>
                    <Input type="number" min={1} max={50} value={documentCount} onChange={(e) => setDocumentCount(Math.max(1, parseInt(e.target.value) || 1))} />
                  </div>
                  <div>
                    <Label>Number of Signers</Label>
                    <Input type="number" min={1} max={10} value={signerCount} onChange={(e) => setSignerCount(Math.max(1, parseInt(e.target.value) || 1))} />
                    {signerCount > 1 && <p className="text-xs text-muted-foreground mt-1">Each signer requires a separate notarial act per Ohio law (ORC §147.04)</p>}
                  </div>
                  {notarizationType === "in_person" && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-accent/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground flex items-start gap-2">
                          <Info className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <span>Travel under 5 miles is free. Distance is calculated from our central Columbus office.</span>
                        </p>
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Meeting Location</Label>
                        <AddressAutocomplete
                          value={meetingAddress}
                          onChange={setMeetingAddress}
                          onSelect={handleAddressSelect}
                          placeholder="Enter your meeting address..."
                          userLat={DEFAULT_OFFICE.lat}
                          userLon={DEFAULT_OFFICE.lng}
                        />
                      </div>
                      {calculatedDistance !== null && !manualOverride && (
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                          <span className="text-sm text-muted-foreground">Calculated distance:</span>
                          <span className="text-sm font-semibold text-primary">{calculatedDistance} miles</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Override distance manually</Label>
                        <Switch checked={manualOverride} onCheckedChange={(v) => { setManualOverride(v); if (v && calculatedDistance) setTravelMiles(calculatedDistance); }} />
                      </div>
                      {manualOverride && (
                        <div>
                          <Label>Travel Distance (miles)</Label>
                          <Input type="number" min={0} value={travelMiles} onChange={(e) => setTravelMiles(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Label>Witnesses Needed</Label>
                    <Input type="number" min={0} max={5} value={witnessCount} onChange={(e) => setWitnessCount(Math.max(0, parseInt(e.target.value) || 0))} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Rush / Priority</Label>
                    <Switch checked={isRush} onCheckedChange={setIsRush} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>After-Hours</Label>
                    <Switch checked={isAfterHours} onCheckedChange={setIsAfterHours} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Needs Apostille</Label>
                    <Switch checked={needsApostille} onCheckedChange={setNeedsApostille} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="font-sans flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Estimated Total</CardTitle></CardHeader>
              <CardContent>
                {settingsLoading || !breakdown ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
                    <Skeleton className="h-8 w-1/2 ml-auto" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {breakdown.lineItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={`font-medium ${item.amount < 0 ? "text-primary" : ""}`}>
                            {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${breakdown.total.toFixed(2)}</span>
                    </div>
                    {breakdown.deposit > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>25% deposit due at booking</span>
                        <span>${breakdown.deposit.toFixed(2)}</span>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">* Estimates only. Final pricing may vary based on document complexity and specific requirements.</p>
                    <p className="mt-1 text-xs text-muted-foreground italic">Ohio notary fees are generally exempt from state sales tax per ORC §5739.02. No tax is applied to this estimate.</p>
                    {(breakdown.notarizationFees < breakdown.subtotal * 0.5) && documentCount * signerCount >= 10 && (
                      <p className="mt-1 text-xs text-primary font-medium">🎉 Volume discount applied: {documentCount * signerCount >= 20 ? "20%" : "10%"} off per-notarization rate</p>
                    )}
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                      <p><strong>After-Hours:</strong> +${parseFloat(settings.after_hours_fee || "25").toFixed(2)} (before 9 AM / after 7 PM Mon–Fri, Sundays)</p>
                      <p><strong>Rush/Same-Day:</strong> +${parseFloat(settings.rush_fee || "35").toFixed(2)} priority fee</p>
                      <p><strong>Witnesses:</strong> ${parseFloat(settings.witness_fee || "10").toFixed(2)} per witness</p>
                      <p><strong>Payment:</strong> Credit/Debit, Venmo, Zelle, CashApp, Cash (in-person only)</p>
                    </div>
                    <Link to={bookingUrl} className="mt-4 block">
                      <Button className="w-full">Book Appointment <ChevronRight className="ml-1 h-4 w-4" /></Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}
