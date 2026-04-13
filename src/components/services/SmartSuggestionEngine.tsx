/**
 * Sprint 6: Smart Suggestion Engine
 * Next-best-action recommendations based on client history and service context.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Suggestion {
  title: string;
  description: string;
  route: string;
  priority: number;
}

export function SmartSuggestionEngine({ className }: { className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!user) return;

    const analyze = async () => {
      const suggs: Suggestion[] = [];

      // Check for incomplete service requests
      const { data: pending } = await supabase
        .from("service_requests")
        .select("service_name, status")
        .eq("client_id", user.id)
        .in("status", ["pending", "in_progress"])
        .limit(3);

      if (pending && pending.length > 0) {
        suggs.push({
          title: "Pending Requests",
          description: `You have ${pending.length} service request(s) in progress.`,
          route: "/portal",
          priority: 90,
        });
      }

      // Check for upcoming appointments
      const { data: upcoming } = await supabase
        .from("appointments")
        .select("scheduled_date, service_type")
        .eq("client_id", user.id)
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .eq("status", "scheduled")
        .limit(3);

      if (upcoming && upcoming.length > 0) {
        suggs.push({
          title: "Upcoming Appointments",
          description: `${upcoming.length} appointment(s) coming up. Upload documents now to save time.`,
          route: "/portal",
          priority: 85,
        });
      }

      // Check for documents needing attention
      const { data: docs } = await supabase
        .from("documents")
        .select("id, status")
        .eq("uploaded_by", user.id)
        .in("status", ["pending", "review"])
        .limit(5);

      if (docs && docs.length > 0) {
        suggs.push({
          title: "Documents Under Review",
          description: `${docs.length} document(s) are being reviewed.`,
          route: "/portal",
          priority: 70,
        });
      }

      // General suggestion for new users
      if (!pending?.length && !upcoming?.length) {
        suggs.push({
          title: "Get Started",
          description: "Book your first notarization or explore our services.",
          route: "/book",
          priority: 50,
        });
      }

      setSuggestions(suggs.sort((a, b) => b.priority - a.priority));
    };

    analyze();
  }, [user]);

  if (suggestions.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(s.route)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
