/**
 * Phase 5: Conversion & revenue enhancement utilities.
 * Urgency indicators, social proof, upsell suggestions.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, TrendingUp, Flame } from "lucide-react";

/**
 * Hook: Get available slot count for a given date.
 * Used for urgency indicators on booking page.
 */
export function useSlotAvailability(date: string | null) {
  const [slotsRemaining, setSlotsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);

    const fetchSlots = async () => {
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("scheduled_date", date)
        .not("status", "in", '("cancelled","no_show")');

      const maxSlots = 16; // 8am-4pm in 30-min slots
      const booked = count ?? 0;
      setSlotsRemaining(Math.max(0, maxSlots - booked));
      setLoading(false);
    };

    fetchSlots();
  }, [date]);

  return { slotsRemaining, loading };
}

/**
 * Urgency badge component.
 */
export function UrgencyBadge({ slotsRemaining }: { slotsRemaining: number | null }) {
  if (slotsRemaining === null) return null;

  if (slotsRemaining <= 2) {
    return (
      <Badge variant="destructive" className="gap-1 animate-pulse">
        <Flame className="h-3 w-3" />
        Only {slotsRemaining} slot{slotsRemaining !== 1 ? "s" : ""} left!
      </Badge>
    );
  }

  if (slotsRemaining <= 5) {
    return (
      <Badge className="gap-1 bg-warning/10 text-warning border-warning/20">
        <Clock className="h-3 w-3" />
        {slotsRemaining} slots remaining
      </Badge>
    );
  }

  return null;
}

/**
 * Social proof stats.
 */
export function useSocialProof() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalClients: 0,
    avgRating: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      const [apptRes, clientRes, ratingRes] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("client_feedback").select("rating"),
      ]);

      const ratings = ratingRes.data ?? [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 4.9;

      setStats({
        totalAppointments: apptRes.count ?? 0,
        totalClients: clientRes.count ?? 0,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    };
    fetch();
  }, []);

  return stats;
}

/**
 * Upsell suggestions based on selected service.
 */
const UPSELL_MAP: Record<string, string[]> = {
  "ron-session": ["document-vault", "identity-certificate"],
  "in-person-notarization": ["document-prep", "document-vault"],
  "mobile-notarization": ["document-prep", "document-vault"],
  "loan-signing": ["document-vault"],
  "apostille": ["document-translation", "courier-service"],
  "divorce-filing": ["custody-package", "document-prep"],
  "custody-package": ["divorce-filing", "document-prep"],
  "business-formation": ["registered-agent", "document-vault"],
  "estate-plan-bundle": ["document-vault", "healthcare-directive"],
  "document-prep": ["ron-session", "document-vault"],
  "i9-verification": ["background-check"],
};

export function getUpsellSuggestions(serviceId: string): string[] {
  return UPSELL_MAP[serviceId] || [];
}

/**
 * Social proof display component.
 */
export function SocialProofBanner() {
  const stats = useSocialProof();

  if (stats.totalAppointments < 10) return null;

  const displayCount = stats.totalAppointments >= 100
    ? `${Math.floor(stats.totalAppointments / 100) * 100}+`
    : `${stats.totalAppointments}`;

  return (
    <div className="flex items-center justify-center gap-6 py-2 px-4 bg-muted/30 rounded-xl text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-4 w-4 text-primary" />
        <strong className="text-foreground">{displayCount}</strong> documents notarized
      </span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <TrendingUp className="h-4 w-4 text-primary" />
        <strong className="text-foreground">{stats.avgRating}</strong> avg rating
      </span>
    </div>
  );
}
