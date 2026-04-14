/**
 * Dynamic pricing quote panel that uses the pricing engine
 * to show real-time itemized pricing based on form selections.
 */
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateQuote, PricingQuote, QuoteLineItem } from "@/lib/pricingQuoteGenerator";
import { Calculator, Info } from "lucide-react";

interface PricingQuotePanelProps {
  serviceId: string;
  signerCount?: number;
  documentCount?: number;
  isRush?: boolean;
  isAfterHours?: boolean;
  isMobile?: boolean;
  travelZone?: number;
  notarizationType?: "in_person" | "ron";
  additionalServices?: string[];
}

export function PricingQuotePanel(props: PricingQuotePanelProps) {
  const quote = useMemo<PricingQuote>(() => {
    return generateQuote({
      serviceId: props.serviceId,
      signerCount: props.signerCount,
      documentCount: props.documentCount,
      isRush: props.isRush,
      isAfterHours: props.isAfterHours,
      isMobile: props.isMobile,
      travelZone: props.travelZone,
      notarizationType: props.notarizationType,
      additionalServices: props.additionalServices,
    });
  }, [
    props.serviceId,
    props.signerCount,
    props.documentCount,
    props.isRush,
    props.isAfterHours,
    props.isMobile,
    props.travelZone,
    props.notarizationType,
    props.additionalServices,
  ]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Price Estimate</h3>
          <Badge variant="secondary" className="text-[10px] ml-auto">Live</Badge>
        </div>

        <div className="space-y-2">
          {quote.items.map((item: QuoteLineItem, i: number) => (
            <div key={i} className="flex items-start justify-between text-sm">
              <div className="flex-1 min-w-0">
                <span>{item.description}</span>
                {item.note && (
                  <span className="block text-[10px] text-muted-foreground">{item.note}</span>
                )}
              </div>
              <span className="font-medium ml-3 shrink-0">
                ${item.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between font-bold">
          <span>Total</span>
          <span className="text-lg text-primary">${quote.total.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          <span>{quote.disclaimer}</span>
        </div>

        {quote.estimatedDuration && (
          <p className="text-xs text-muted-foreground">
            Estimated duration: <span className="font-medium text-foreground">{quote.estimatedDuration}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
