/**
 * NS-003: Reviews section for notary pages.
 * Pulls from client_feedback joined with profiles.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client_name?: string;
}

interface NotaryReviewsProps {
  notaryUserId?: string;
  limit?: number;
}

export function NotaryReviews({ notaryUserId, limit = 6 }: NotaryReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!notaryUserId) { setLoading(false); return; }

    async function fetchReviews() {
      try {
        // Get appointments for this notary, then their feedback
        const { data: appointments } = await supabase
          .from("appointments")
          .select("id")
          .eq("notary_id", notaryUserId);

        if (!appointments?.length) { setLoading(false); return; }

        const appointmentIds = appointments.map(a => a.id);

        const { data: feedback } = await supabase
          .from("client_feedback")
          .select("id, rating, comment, created_at, client_id")
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (feedback?.length) {
          const mapped: Review[] = feedback.map(f => ({
            id: f.id,
            rating: f.rating,
            comment: f.comment,
            created_at: f.created_at,
            client_name: undefined, // PII-safe: don't expose names publicly
          }));
          setReviews(mapped);
          setAvgRating(mapped.reduce((sum, r) => sum + r.rating, 0) / mapped.length);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [notaryUserId, limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to leave feedback!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h3 className="text-xl font-bold text-foreground">Client Reviews</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
          ))}
          <span className="ml-1 text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reviews.map(review => (
          <Card key={review.id} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground/80 line-clamp-4">{review.comment}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Verified Client</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
