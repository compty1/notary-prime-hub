import { useState, useCallback } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientFeedbackFormProps {
  appointmentId: string;
  onSubmitted?: () => void;
}

const NPS_LABELS: Record<number, string> = {
  0: "Not at all likely",
  5: "Neutral",
  10: "Extremely likely",
};

export function ClientFeedbackForm({ appointmentId, onSubmitted }: ClientFeedbackFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      appointment_id: appointmentId,
      user_id: user.id,
      rating,
      nps_score: npsScore,
      comment: comment.trim() || null,
      feedback_type: 'appointment_review',
    } as never);
    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Thank you for your feedback!");
      onSubmitted?.();
    }
    setSubmitting(false);
  }, [user, rating, npsScore, comment, appointmentId, onSubmitted]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-sans">How was your experience?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hover || rating) >= star
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>

        {/* NPS Score (0-10) */}
        <div className="space-y-2">
          <Label className="text-sm">How likely are you to recommend us? (0-10)</Label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNpsScore(i)}
                className={cn(
                  "h-8 w-8 rounded text-xs font-medium transition-colors border",
                  npsScore === i
                    ? i <= 6 ? "bg-destructive text-destructive-foreground border-destructive"
                      : i <= 8 ? "bg-accent text-accent-foreground border-accent"
                      : "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                )}
                aria-label={`NPS score ${i}`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>

        <Textarea
          placeholder="Tell us about your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}
