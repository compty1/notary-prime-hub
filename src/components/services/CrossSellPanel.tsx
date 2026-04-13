/**
 * Sprint 1: Cross-Sell Recommendations Panel
 * Shows related service suggestions after a service is completed.
 */
import { useCrossSell } from "@/hooks/useServiceScaffold";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CrossSellPanelProps {
  completedServiceType: string;
  className?: string;
}

export function CrossSellPanel({ completedServiceType, className }: CrossSellPanelProps) {
  const recommendations = useCrossSell(completedServiceType);
  const navigate = useNavigate();

  if (recommendations.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          You Might Also Need
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {rec.recommended_service_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </p>
              {rec.display_message && (
                <p className="text-xs text-muted-foreground truncate">{rec.display_message}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => navigate(`/services/${rec.recommended_service_type}`)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
