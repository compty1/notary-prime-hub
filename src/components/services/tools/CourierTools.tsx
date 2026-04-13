import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, FileText, Shield, Calculator } from "lucide-react";

const CHAIN_OF_CUSTODY_STEPS = [
  "Document received — record sender, time, contents",
  "Verify package seal integrity",
  "Log chain of custody entry with timestamp",
  "Secure transport in locked bag/container",
  "Track GPS location during transit",
  "Obtain recipient signature on delivery",
  "Photograph proof of delivery",
  "Complete delivery confirmation in system",
  "Retain custody log for records retention period",
];

const DELIVERY_TIERS = [
  { tier: "Standard", timeframe: "Same day (4-8 hrs)", baseFee: "$25", perMile: "$1.50", notes: "Local deliveries within 25 miles" },
  { tier: "Priority", timeframe: "2-4 hours", baseFee: "$50", perMile: "$2.00", notes: "Expedited local delivery" },
  { tier: "Rush", timeframe: "Within 1 hour", baseFee: "$100", perMile: "$3.00", notes: "Emergency legal document delivery" },
  { tier: "Court Filing", timeframe: "Same day", baseFee: "$75", perMile: "$1.50", notes: "Includes filing at courthouse + confirmation" },
  { tier: "Multi-Stop", timeframe: "Same day", baseFee: "$40 + $15/stop", perMile: "$1.50", notes: "Multiple deliveries in one route" },
];

export function CourierTools() {
  const [distance, setDistance] = useState("");
  const [tier, setTier] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const miles = parseFloat(distance) || 0;
  const selected = DELIVERY_TIERS[tier];
  const baseFee = parseFloat(selected.baseFee.replace(/[^0-9.]/g, "")) || 0;
  const perMile = parseFloat(selected.perMile.replace(/[^0-9.]/g, "")) || 0;
  const estimated = baseFee + (miles * perMile);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Delivery Fee Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {DELIVERY_TIERS.map((t, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 cursor-pointer transition-colors ${tier === i ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                onClick={() => setTier(i)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t.tier}</p>
                    <p className="text-xs text-muted-foreground">{t.notes}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{t.timeframe}</Badge>
                    <p className="text-xs mt-1">Base: {t.baseFee} + {t.perMile}/mi</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <Label>Distance (miles)</Label>
            <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g., 15" />
          </div>
          {miles > 0 && (
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Estimated Fee — {selected.tier}</p>
              <p className="text-3xl font-bold text-primary">${estimated.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Chain of Custody Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CHAIN_OF_CUSTODY_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Checkbox checked={checked.has(i)} onCheckedChange={() => {
                  setChecked(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                }} />
                <span className={checked.has(i) ? "line-through text-muted-foreground" : ""}>{step}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{checked.size}/{CHAIN_OF_CUSTODY_STEPS.length} steps completed</p>
        </CardContent>
      </Card>
    </div>
  );
}
