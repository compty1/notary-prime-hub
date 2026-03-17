import { useState, useEffect } from "react";
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
import { ChevronLeft, Calculator, DollarSign, ChevronRight } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";

export default function FeeCalculator() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [notarizationType, setNotarizationType] = useState<"in_person" | "ron">("in_person");
  const [documentCount, setDocumentCount] = useState(1);
  const [travelMiles, setTravelMiles] = useState(0);
  const [isRush, setIsRush] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [witnessCount, setWitnessCount] = useState(0);
  const [needsApostille, setNeedsApostille] = useState(false);

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

  const baseFee = parseFloat(settings.base_fee_per_signature || "5");
  const travelFeeMin = parseFloat(settings.travel_fee_minimum || "25");
  const travelFeePerMile = parseFloat(settings.travel_fee_per_mile || "0.655");
  const ronPlatformFee = parseFloat(settings.ron_platform_fee || "25");
  const kbaFee = parseFloat(settings.kba_fee || "15");
  const rushFee = parseFloat(settings.rush_fee || "35");
  const afterHoursFee = parseFloat(settings.after_hours_fee || "25");
  const witnessFee = parseFloat(settings.witness_fee || "10");
  const apostilleFee = parseFloat(settings.apostille_fee || "75");

  const notarizationFees = baseFee * documentCount;
  const travelCalc = notarizationType === "in_person" ? Math.max(travelFeeMin, travelMiles * travelFeePerMile) : 0;
  const ronFees = notarizationType === "ron" ? ronPlatformFee + kbaFee : 0;
  const rushCalc = isRush ? rushFee : 0;
  const afterHoursCalc = isAfterHours ? afterHoursFee : 0;
  const witnessCalc = witnessCount * witnessFee;
  const apostilleCalc = needsApostille ? apostilleFee : 0;
  const total = notarizationFees + travelCalc + ronFees + rushCalc + afterHoursCalc + witnessCalc + apostilleCalc;

  const lineItems = [
    { label: `Notarization (${documentCount} doc${documentCount > 1 ? "s" : ""} × $${baseFee.toFixed(2)})`, amount: notarizationFees },
    ...(notarizationType === "in_person" ? [{ label: `Travel Fee (${travelMiles} mi)`, amount: travelCalc }] : []),
    ...(notarizationType === "ron" ? [{ label: "RON Platform Fee", amount: ronPlatformFee }, { label: "KBA Fee", amount: kbaFee }] : []),
    ...(isRush ? [{ label: "Rush Priority", amount: rushCalc }] : []),
    ...(isAfterHours ? [{ label: "After-Hours", amount: afterHoursCalc }] : []),
    ...(witnessCount > 0 ? [{ label: `Witnesses (${witnessCount})`, amount: witnessCalc }] : []),
    ...(needsApostille ? [{ label: "Apostille Processing", amount: apostilleCalc }] : []),
  ];

  const bookingUrl = `/book?type=${notarizationType}&estimate=${total.toFixed(2)}&docs=${documentCount}${needsApostille ? "&apostille=true" : ""}`;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"><span className="font-display text-lg font-bold text-primary-foreground">SG</span></div>
            <span className="font-display text-lg font-bold text-foreground">Fee Calculator</span>
          </Link>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <Link to="/"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Home</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Notarization Fee Calculator</h1>
          <p className="text-muted-foreground">Get a transparent estimate before you book</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Calculator className="h-5 w-5 text-accent" /> Configure</CardTitle></CardHeader>
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
                  {notarizationType === "in_person" && (
                    <div>
                      <Label>Travel Distance (miles)</Label>
                      <Input type="number" min={0} value={travelMiles} onChange={(e) => setTravelMiles(Math.max(0, parseInt(e.target.value) || 0))} />
                      <p className="text-xs text-muted-foreground mt-1">Minimum travel fee: ${travelFeeMin.toFixed(2)}</p>
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
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader><CardTitle className="font-display flex items-center gap-2"><DollarSign className="h-5 w-5 text-accent" /> Estimated Total</CardTitle></CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
                    <Skeleton className="h-8 w-1/2 ml-auto" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {lineItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-accent">${total.toFixed(2)}</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">* Estimates only. Final pricing may vary based on document complexity and specific requirements.</p>
                    <Link to={bookingUrl} className="mt-4 block">
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">Book Appointment <ChevronRight className="ml-1 h-4 w-4" /></Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Shane Goble — Ohio Commissioned Notary Public</p>
      </footer>
    </div>
  );
}
