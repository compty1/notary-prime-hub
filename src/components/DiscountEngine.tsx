import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Percent, DollarSign, Users } from "lucide-react";

type DiscountType = "percentage" | "fixed" | "bundle";

interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  minQuantity?: number;
  applicableServices: string[];
  active: boolean;
  code?: string;
}

const DEFAULT_RULES: DiscountRule[] = [
  { id: "1", name: "Multi-document discount", type: "percentage", value: 10, minQuantity: 5, applicableServices: ["notarization"], active: true },
  { id: "2", name: "Returning client", type: "percentage", value: 5, applicableServices: ["all"], active: true, code: "RETURN5" },
  { id: "3", name: "Business bundle", type: "fixed", value: 25, applicableServices: ["business_formation"], active: false, code: "BIZ25" },
];

export function DiscountEngine() {
  const [rules, setRules] = useState<DiscountRule[]>(DEFAULT_RULES);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    toast.success("Discount rule updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Percent className="h-4 w-4" /> Discount Engine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{rule.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {rule.type === "percentage" ? `${rule.value}%` : `$${rule.value}`}
                </Badge>
                {rule.code && <Badge variant="secondary" className="text-[10px] font-mono">{rule.code}</Badge>}
              </div>
              {rule.minQuantity && (
                <p className="text-[10px] text-muted-foreground">Min {rule.minQuantity} items</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Calculate discount for a given order.
 */
export function calculateDiscount(
  subtotal: number,
  itemCount: number,
  serviceType: string,
  promoCode?: string,
  rules: DiscountRule[] = DEFAULT_RULES
): { discount: number; appliedRule?: string } {
  let bestDiscount = 0;
  let appliedRule: string | undefined;

  for (const rule of rules) {
    if (!rule.active) continue;
    if (rule.code && promoCode !== rule.code) continue;
    if (!rule.applicableServices.includes("all") && !rule.applicableServices.includes(serviceType)) continue;
    if (rule.minQuantity && itemCount < rule.minQuantity) continue;

    let d = 0;
    if (rule.type === "percentage") d = subtotal * (rule.value / 100);
    else if (rule.type === "fixed") d = rule.value;

    if (d > bestDiscount) {
      bestDiscount = d;
      appliedRule = rule.name;
    }
  }

  return { discount: Math.min(bestDiscount, subtotal), appliedRule };
}
