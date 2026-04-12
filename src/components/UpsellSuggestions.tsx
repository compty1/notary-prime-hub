/**
 * Service upsell/cross-sell suggestions component.
 * Shows related services during booking or after completion.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { getUpsellSuggestions } from "@/lib/conversionHelpers";
import { getServiceById } from "@/lib/serviceRegistry";

interface UpsellSuggestionsProps {
  currentServiceId: string;
  maxSuggestions?: number;
  className?: string;
}

export function UpsellSuggestions({ currentServiceId, maxSuggestions = 2, className = "" }: UpsellSuggestionsProps) {
  const suggestions = getUpsellSuggestions(currentServiceId).slice(0, maxSuggestions);
  const services = suggestions
    .map(id => getServiceById(id))
    .filter(Boolean);

  if (services.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-primary" />
        You might also need
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map(service => service && (
          <Card key={service.id} className="rounded-xl border border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-foreground">{service.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
              <Button asChild variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs gap-1">
                <Link to={`${service.path}?service=${service.id}`}>
                  Learn more <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
