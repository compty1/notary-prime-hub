/**
 * Sprint 6: Smart Intake — Auto-fill from client history
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

interface SmartSuggestion {
  field: string;
  value: string;
  source: string;
  confidence: number;
}

interface SmartIntakeProps {
  serviceSlug: string;
  onApplySuggestions?: (suggestions: Record<string, string>) => void;
  className?: string;
}

export function SmartIntake({ serviceSlug, onApplySuggestions, className }: SmartIntakeProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const loadHistory = async () => {
      // Get last 5 requests for this service type
      const { data: prevRequests } = await supabase
        .from("service_requests")
        .select("intake_data")
        .eq("client_id", user.id)
        .eq("service_name", serviceSlug)
        .order("created_at", { ascending: false })
        .limit(5);

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone, address")
        .eq("user_id", user.id)
        .single();

      const suggs: SmartSuggestion[] = [];

      if (profile?.full_name) {
        suggs.push({ field: "full_name", value: profile.full_name, source: "Profile", confidence: 95 });
      }
      if (profile?.phone) {
        suggs.push({ field: "phone", value: profile.phone, source: "Profile", confidence: 95 });
      }
      if (profile?.address) {
        suggs.push({ field: "address", value: profile.address, source: "Profile", confidence: 90 });
      }

      // Extract common values from previous requests
      if (prevRequests && prevRequests.length > 0) {
        const lastIntake = prevRequests[0]?.intake_data as Record<string, any> | null;
        if (lastIntake) {
          Object.entries(lastIntake).forEach(([key, val]) => {
            if (typeof val === "string" && val.length > 0 && !["notes", "description"].includes(key)) {
              suggs.push({ field: key, value: val, source: "Previous request", confidence: 70 });
            }
          });
        }
      }

      setSuggestions(suggs);
      setLoading(false);
    };

    loadHistory();
  }, [user, serviceSlug]);

  if (loading || suggestions.length === 0) return null;

  const handleApply = () => {
    const map: Record<string, string> = {};
    suggestions.forEach(s => { map[s.field] = s.value; });
    onApplySuggestions?.(map);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Smart Auto-Fill
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {suggestions.length} suggestions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs rounded-lg bg-muted/50 p-2">
            <div>
              <span className="text-muted-foreground">{s.field.replace(/_/g, " ")}:</span>{" "}
              <span className="font-medium">{s.value}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{s.source}</span>
            </div>
          </div>
        ))}
        <Button size="sm" className="w-full" variant="outline" onClick={handleApply}>
          <ArrowRight className="h-3 w-3 mr-1" /> Apply All Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}
