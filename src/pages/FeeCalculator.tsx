import { useState, useEffect, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Calculator, DollarSign, MapPin, Info, Building2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { calculatePrice, parseSettings, getZoneFromMiles, type TravelZone, type FacilityType, type LoanPackage } from "@/lib/pricingEngine";

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
  const [isHoliday, setIsHoliday] = useState(false);
  const [witnessCount, setWitnessCount] = useState(0);
  const [needsApostille, setNeedsApostille] = useState(false);

  // New fields per audit
  const [facilityType, setFacilityType] = useState<FacilityType>("standard");
  const [isLoanSigning, setIsLoanSigning] = useState(false);
  const [loanPackage, setLoanPackage] = useState<LoanPackage>("standard");
  const [isEstatePlanBundle, setIsEstatePlanBundle] = useState(false);
  const [needsPOA, setNeedsPOA] = useState(false);
  const [needsScanback, setNeedsScanback] = useState(false);
  const [needsCourier, setNeedsCourier] = useState(false);
  const [needsI9, setNeedsI9] = useState(false);
  const [printingSets, setPrintingSets] = useState(0);

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
  const detectedZone: TravelZone | null = effectiveMiles > 0 ? getZoneFromMiles(effectiveMiles) : null;

  const breakdown = useMemo(() => {
    if (!settings.base_fee_per_signature && Object.keys(settings).length === 0) return null;
    const parsed = parseSettings(settings);
    return calculatePrice({
      notarizationType,
      documentCount,
      signerCount,
      travelMiles: notarizationType === "in_person" ? effectiveMiles : undefined,
      travelZone: notarizationType === "in_person" && detectedZone ? detectedZone : undefined,
      facilityType: notarizationType === "in_person" ? facilityType : undefined,
      isLoanSigning,
      loanPackage: isLoanSigning ? loanPackage : undefined,
      isRush,
      isAfterHours,
      isHoliday,
      witnessCount,
      needsApostille,
      needsPOA,
      needsScanback,
      needsCourier,
      needsI9,
      isEstatePlanBundle,
      printingSets: printingSets > 0 ? printingSets : undefined,
    }, parsed);
  }, [notarizationType, documentCount, signerCount, effectiveMiles, detectedZone, facilityType, isLoanSigning, loanPackage, isRush, isAfterHours, isHoliday, witnessCount, needsApostille, needsPOA, needsScanback, needsCourier, needsI9, isEstatePlanBundle, printingSets, settings]);

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

  const ZONE_LABELS: Record<number, string> = {
    1: "Zone 1 (0–15 mi) — $25",
    2: "Zone 2 (15–30 mi) — $40",
    3: "Zone 3 (30–45 mi) — $55",
    4: "Zone 4 (45+ mi) — $55 + $1.50/mi",
  };

  return (
    <PageShell>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Breadcrumbs />
        <div className="mb-8 text-center">
          <h1 className="font-sans text-3xl font-bold mb-2">Notarization Fee Calculator</h1>
          <p className="text-muted-foreground">Get a transparent estimate before you book</p>
          <div className="flex gap-2 justify-center mt-3">
            <Badge variant="outline" className="text-xs">🏆 Free Weekends</Badge>
            <Badge variant="outline" className="text-xs">💰 Below Market Rates</Badge>
            <Badge variant="outline" className="text-xs">📍 Zone-Based Travel</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: Configure */}
          <Card className="border-border/50 lg:col-span-3">
            <CardHeader><CardTitle className="font-sans flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Configure</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {settingsLoading ? (
                <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Service Type</Label>
                      <Select value={notarizationType} onValueChange={(v) => setNotarizationType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_person">In-Person / Mobile Notarization</SelectItem>
                          <SelectItem value="ron">Remote Online (RON)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Number of Documents</Label>
                      <Input type="number" min={1} max={50} value={documentCount} onChange={(e) => setDocumentCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} />
                    </div>
                    <div>
                      <Label>Number of Signers</Label>
                      <Input type="number" min={1} max={10} value={signerCount} onChange={(e) => setSignerCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} />
                      {signerCount > 1 && <p className="text-xs text-muted-foreground mt-1">Each signer = separate notarial act per ORC §147.04</p>}
                    </div>
                    <div>
                      <Label>Witnesses Needed</Label>
                      <Input type="number" min={0} max={5} value={witnessCount} onChange={(e) => setWitnessCount(Math.max(0, parseInt(e.target.value) || 0))} />
                    </div>
                  </div>

                  {/* Loan Signing Mode */}
                  <div className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Loan Signing Package</Label>
                      <Switch checked={isLoanSigning} onCheckedChange={setIsLoanSigning} />
                    </div>
                    {isLoanSigning && (
                      <Select value={loanPackage} onValueChange={(v) => setLoanPackage(v as LoanPackage)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Loan — $125</SelectItem>
                          <SelectItem value="purchase">Purchase/Refi — $150</SelectItem>
                          <SelectItem value="reverse_mortgage">Reverse Mortgage — $175</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Travel / Zone */}
                  {notarizationType === "in_person" && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-accent/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground flex items-start gap-2">
                          <Info className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <span>Zone-based travel from our West Jefferson, OH office. Travel under 5 miles is free.</span>
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
                          <span className="text-sm text-muted-foreground">Calculated:</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-primary">{calculatedDistance} mi</span>
                            {detectedZone && <span className="text-xs text-muted-foreground ml-2">({ZONE_LABELS[detectedZone]})</span>}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Override distance manually</Label>
                        <Switch checked={manualOverride} onCheckedChange={(v) => { setManualOverride(v); if (v && calculatedDistance) setTravelMiles(calculatedDistance); }} />
                      </div>
                      {manualOverride && (
                        <Input type="number" min={0} value={travelMiles} onChange={(e) => setTravelMiles(Math.max(0, parseInt(e.target.value) || 0))} placeholder="Distance in miles" />
                      )}

                      {/* Facility Type */}
                      <div>
                        <Label className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Facility Type</Label>
                        <Select value={facilityType} onValueChange={(v) => setFacilityType(v as FacilityType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Location</SelectItem>
                            <SelectItem value="hospital">Hospital / Nursing Facility (+$20)</SelectItem>
                            <SelectItem value="jail">Jail / Prison (+$75)</SelectItem>
                            <SelectItem value="government">Government Facility (+$20)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Surcharges */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Rush / Same-Day ($25)</Label>
                      <Switch checked={isRush} onCheckedChange={setIsRush} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">After-Hours ($35)</Label>
                      <Switch checked={isAfterHours} onCheckedChange={setIsAfterHours} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Holiday ($50)</Label>
                      <Switch checked={isHoliday} onCheckedChange={setIsHoliday} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Needs Apostille ($175)</Label>
                      <Switch checked={needsApostille} onCheckedChange={setNeedsApostille} />
                    </div>
                  </div>

                  <Separator />

                  {/* Add-ons */}
                  <div>
                    <p className="text-sm font-medium mb-2">Add-On Services</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">POA Surcharge ($25)</Label>
                        <Switch checked={needsPOA} onCheckedChange={setNeedsPOA} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Scanback Service ($15)</Label>
                        <Switch checked={needsScanback} onCheckedChange={setNeedsScanback} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Courier Delivery ($25)</Label>
                        <Switch checked={needsCourier} onCheckedChange={setNeedsCourier} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">I-9 Verification ($45)</Label>
                        <Switch checked={needsI9} onCheckedChange={setNeedsI9} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Estate Plan Bundle ($100 flat)</Label>
                        <Switch checked={isEstatePlanBundle} onCheckedChange={setIsEstatePlanBundle} />
                      </div>
                      <div>
                        <Label className="text-xs">Printing Sets ($15/set)</Label>
                        <Input type="number" min={0} max={10} value={printingSets} onChange={(e) => setPrintingSets(Math.max(0, parseInt(e.target.value) || 0))} className="h-8 mt-1" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Right: Estimate */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            <Card className="border-primary/20 bg-primary/5 sticky top-4">
              <CardHeader><CardTitle className="font-sans flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Estimated Total</CardTitle></CardHeader>
              <CardContent>
                {settingsLoading || !breakdown ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}<Skeleton className="h-8 w-1/2 ml-auto" /></div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {breakdown.lineItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground text-xs">{item.label}</span>
                          <span className={`font-medium text-xs ${item.amount < 0 ? "text-primary" : ""}`}>
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
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>25% deposit due at booking</span>
                        <span>${breakdown.deposit.toFixed(2)}</span>
                      </div>
                    )}
                    <p className="mt-3 text-[10px] text-muted-foreground">* Estimates only. Final pricing may vary. Ohio notary fees exempt from state sales tax per ORC §5739.02.</p>
                    {(breakdown.notarizationFees < breakdown.subtotal * 0.3) && documentCount * signerCount >= 10 && (
                      <p className="mt-1 text-xs text-primary font-medium">🎉 Volume discount applied!</p>
                    )}

                    {/* Cancellation Policy */}
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-[10px] text-muted-foreground space-y-1">
                      <p className="font-semibold text-xs text-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Cancellation & No-Show Policy</p>
                      <p>• Less than 2 hours: $40 fee</p>
                      <p>• 2–24 hours: $25 fee</p>
                      <p>• No-show: $50 fee (loan = full charge)</p>
                      <p>• Wait time: $20 per 15 min after grace</p>
                      <p>• Reschedule: Free with 4+ hrs notice</p>
                    </div>

                    {/* Payment Methods */}
                    <div className="mt-2 rounded-lg bg-muted/50 p-3 text-[10px] text-muted-foreground">
                      <p className="font-semibold text-xs text-foreground mb-1">Payment Methods</p>
                      <p>Credit/Debit • Venmo • Zelle • CashApp • Apple Pay • Google Pay • Cash (in-person)</p>
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

        {/* Travel Zones Reference */}
        {notarizationType === "in_person" && (
          <Card className="mt-8 border-border/50">
            <CardContent className="pt-6">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Service Area & Travel Zones (from West Jefferson, OH 43162)</h2>
              <div className="grid gap-2 sm:grid-cols-4">
                {[
                  { zone: 1, range: "0–15 mi", fee: "$25", areas: "West Jefferson, Plain City, London" },
                  { zone: 2, range: "15–30 mi", fee: "$40", areas: "Columbus, Hilliard, Dublin, Grove City" },
                  { zone: 3, range: "30–45 mi", fee: "$55", areas: "Delaware, Marysville, Circleville" },
                  { zone: 4, range: "45+ mi", fee: "$55 + $1.50/mi", areas: "Dayton, Springfield, Zanesville" },
                ].map(z => (
                  <div key={z.zone} className={`rounded-lg border p-3 text-xs ${detectedZone === z.zone ? "border-primary bg-primary/10" : ""}`}>
                    <p className="font-semibold">Zone {z.zone}</p>
                    <p className="text-muted-foreground">{z.range}</p>
                    <p className="font-medium text-primary mt-1">{z.fee}</p>
                    <p className="text-muted-foreground mt-1">{z.areas}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
