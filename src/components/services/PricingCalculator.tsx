/**
 * Sprint 1: Enhanced Pricing Calculator
 * Reads pricing_rules, applies travel zones, rush surcharges, tax, and enforces ORC fee caps.
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Clock, MapPin, AlertTriangle } from "lucide-react";
import { useTravelZones } from "@/hooks/useServiceScaffold";
import { useSettings } from "@/hooks/useSettings";

interface PricingCalculatorProps {
  basePrice: number;
  serviceName: string;
  isRon?: boolean;
  className?: string;
  onTotalChange?: (total: number) => void;
}

// ORC fee caps
const ORC_CAPS = {
  inPersonPerAct: 5.00,
  ronPerAct: 30.00,
  techFee: 10.00,
};

export function PricingCalculator({
  basePrice,
  serviceName,
  isRon = false,
  className,
  onTotalChange,
}: PricingCalculatorProps) {
  const { get } = useSettings(["tax_rate", "rush_surcharge", "bulk_discount_threshold", "bulk_discount_percent"]);
  const { getFeeForDistance } = useTravelZones();

  const [actCount, setActCount] = useState(1);
  const [signerCount, setSignerCount] = useState(1);
  const [travelMiles, setTravelMiles] = useState(0);
  const [isRush, setIsRush] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);

  const taxRate = parseFloat(get("tax_rate", "0")) / 100;
  const rushSurcharge = parseFloat(get("rush_surcharge", "50"));
  const bulkThreshold = parseInt(get("bulk_discount_threshold", "5"));
  const bulkDiscount = parseFloat(get("bulk_discount_percent", "10")) / 100;

  const breakdown = useMemo(() => {
    const lines: { label: string; amount: number; warning?: string }[] = [];

    // Base service fee
    lines.push({ label: `${serviceName} — Base Fee`, amount: basePrice });

    // Per-act fees with ORC cap enforcement
    if (actCount > 0) {
      const cap = isRon ? ORC_CAPS.ronPerAct : ORC_CAPS.inPersonPerAct;
      const perActFee = Math.min(basePrice, cap);
      const actTotal = actCount > 1 ? (actCount - 1) * perActFee : 0;
      if (actCount > 1) {
        lines.push({
          label: `Additional Acts (${actCount - 1} × $${perActFee.toFixed(2)})`,
          amount: actTotal,
        });
      }
    }

    // RON tech fee
    if (isRon) {
      lines.push({ label: "RON Technology Fee", amount: ORC_CAPS.techFee });
    }

    // Additional signers
    if (signerCount > 1) {
      const signerFee = (signerCount - 1) * 10;
      lines.push({ label: `Additional Signers (${signerCount - 1} × $10.00)`, amount: signerFee });
    }

    // Travel fee from zones
    if (travelMiles > 0 && !isRon) {
      const travelFee = getFeeForDistance(travelMiles);
      lines.push({
        label: `Travel (${travelMiles} mi — Zone Fee)`,
        amount: travelFee,
      });
    }

    // Rush surcharge
    if (isRush) {
      lines.push({ label: "Rush Surcharge", amount: rushSurcharge });
    }

    // After-hours
    if (isAfterHours) {
      lines.push({ label: "After-Hours Surcharge", amount: 50 });
    }

    // Subtotal
    let subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

    // Bulk discount
    if (actCount >= bulkThreshold && bulkDiscount > 0) {
      const discount = subtotal * bulkDiscount;
      lines.push({ label: `Bulk Discount (${bulkDiscount * 100}%)`, amount: -discount });
      subtotal -= discount;
    }

    // Tax
    if (taxRate > 0) {
      const tax = subtotal * taxRate;
      lines.push({ label: `Tax (${(taxRate * 100).toFixed(1)}%)`, amount: tax });
      subtotal += tax;
    }

    return { lines, total: Math.max(0, subtotal) };
  }, [basePrice, serviceName, actCount, signerCount, travelMiles, isRush, isAfterHours, isRon, taxRate, rushSurcharge, bulkThreshold, bulkDiscount, getFeeForDistance]);

  // Notify parent
  useMemo(() => { onTotalChange?.(breakdown.total); }, [breakdown.total, onTotalChange]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4" /> Fee Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Notarial Acts</Label>
            <Input type="number" min={1} max={50} value={actCount} onChange={e => setActCount(+e.target.value || 1)} />
          </div>
          <div>
            <Label className="text-xs">Signers</Label>
            <Input type="number" min={1} max={20} value={signerCount} onChange={e => setSignerCount(+e.target.value || 1)} />
          </div>
          {!isRon && (
            <div className="col-span-2">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Travel Distance (miles)
              </Label>
              <Input type="number" min={0} value={travelMiles} onChange={e => setTravelMiles(+e.target.value || 0)} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch checked={isRush} onCheckedChange={setIsRush} />
            <Label className="text-xs">Rush Service (+${rushSurcharge.toFixed(0)})</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isAfterHours} onCheckedChange={setIsAfterHours} />
            <Label className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" /> After-Hours (+$50)
            </Label>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          {breakdown.lines.map((line, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className={`${line.amount < 0 ? "text-primary" : "text-muted-foreground"}`}>
                {line.label}
              </span>
              <span className={line.amount < 0 ? "text-primary" : ""}>
                {line.amount < 0 ? "-" : ""}${Math.abs(line.amount).toFixed(2)}
              </span>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold text-sm">
            <span>Estimated Total</span>
            <span>${breakdown.total.toFixed(2)}</span>
          </div>
        </div>

        {isRon && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>Ohio ORC §147.08: RON cap is $30/act + $10 tech fee. In-person cap is $5/act.</span>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          * Fees per Ohio Revised Code §147.08. Final price may vary.
        </p>
      </CardContent>
    </Card>
  );
}
