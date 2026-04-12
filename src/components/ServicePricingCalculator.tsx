import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calculator, Clock, MapPin, FileText } from "lucide-react";

// Ohio notary fee schedule per ORC §147.08
const OHIO_FEES = {
  perNotarization: 5.00,
  perSignature: 2.00,
  ronFee: 25.00,
  travelPerMile: 0.67, // IRS mileage rate
  afterHoursSurcharge: 50.00,
  additionalSigner: 10.00,
};

interface ServicePricingCalculatorProps {
  serviceType?: string;
  onTotalChange?: (total: number) => void;
}

export function ServicePricingCalculator({ serviceType, onTotalChange }: ServicePricingCalculatorProps) {
  const [signerCount, setSignerCount] = useState(1);
  const [docCount, setDocCount] = useState(1);
  const [notarizationCount, setNotarizationCount] = useState(1);
  const [travelMiles, setTravelMiles] = useState(0);
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [isRon, setIsRon] = useState(serviceType?.toLowerCase().includes("ron") ?? false);

  const breakdown = useMemo(() => {
    const lines: { label: string; amount: number }[] = [];

    if (isRon) {
      lines.push({ label: "RON Session Fee", amount: OHIO_FEES.ronFee });
    }

    lines.push({ label: `Notarization (${notarizationCount} × $${OHIO_FEES.perNotarization.toFixed(2)})`, amount: notarizationCount * OHIO_FEES.perNotarization });

    if (signerCount > 1) {
      lines.push({ label: `Additional Signers (${signerCount - 1} × $${OHIO_FEES.additionalSigner.toFixed(2)})`, amount: (signerCount - 1) * OHIO_FEES.additionalSigner });
    }

    if (travelMiles > 0) {
      lines.push({ label: `Travel (${travelMiles} mi × $${OHIO_FEES.travelPerMile.toFixed(2)})`, amount: travelMiles * OHIO_FEES.travelPerMile });
    }

    if (isAfterHours) {
      lines.push({ label: "After-Hours Surcharge", amount: OHIO_FEES.afterHoursSurcharge });
    }

    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    return { lines, total };
  }, [signerCount, docCount, notarizationCount, travelMiles, isAfterHours, isRon]);

  useMemo(() => {
    onTotalChange?.(breakdown.total);
  }, [breakdown.total, onTotalChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Calculator className="h-4 w-4" /> Fee Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Signers</Label>
            <Input type="number" min={1} max={20} value={signerCount} onChange={e => setSignerCount(+e.target.value || 1)} />
          </div>
          <div>
            <Label className="text-xs">Notarizations</Label>
            <Input type="number" min={1} max={50} value={notarizationCount} onChange={e => setNotarizationCount(+e.target.value || 1)} />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Travel (miles)</Label>
            <Input type="number" min={0} value={travelMiles} onChange={e => setTravelMiles(+e.target.value || 0)} />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> Documents</Label>
            <Input type="number" min={1} value={docCount} onChange={e => setDocCount(+e.target.value || 1)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={isRon} onCheckedChange={setIsRon} />
          <Label className="text-xs">Remote Online Notarization (RON)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={isAfterHours} onCheckedChange={setIsAfterHours} />
          <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> After-hours (before 8AM / after 8PM)</Label>
        </div>

        <Separator />

        <div className="space-y-1">
          {breakdown.lines.map((line, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{line.label}</span>
              <span>${line.amount.toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold text-sm">
            <span>Estimated Total</span>
            <span>${breakdown.total.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">* Fees per Ohio Revised Code §147.08. Actual fees may vary.</p>
      </CardContent>
    </Card>
  );
}
