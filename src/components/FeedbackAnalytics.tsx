import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Star, ThumbsUp, ThumbsDown, BarChart3 } from "lucide-react";

type FeedbackSummary = {
  avgRating: number;
  totalCount: number;
  npsScore: number | null;
  distribution: number[];
  recentComments: { rating: number; comment: string; date: string }[];
};

export function FeedbackAnalytics() {
  const [data, setData] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: feedback } = await supabase
        .from("client_feedback")
        .select("rating, comment, nps_score, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!feedback || feedback.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      const avg = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;
      const dist = [0, 0, 0, 0, 0];
      feedback.forEach(f => { if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++; });

      const npsScores = feedback.filter(f => f.nps_score !== null);
      let nps: number | null = null;
      if (npsScores.length > 0) {
        const promoters = npsScores.filter(f => (f.nps_score ?? 0) >= 9).length;
        const detractors = npsScores.filter(f => (f.nps_score ?? 0) <= 6).length;
        nps = Math.round(((promoters - detractors) / npsScores.length) * 100);
      }

      setData({
        avgRating: avg,
        totalCount: feedback.length,
        npsScore: nps,
        distribution: dist,
        recentComments: feedback
          .filter(f => f.comment)
          .slice(0, 5)
          .map(f => ({ rating: f.rating, comment: f.comment!, date: f.created_at })),
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading feedback...</p>;
  if (!data) return <p className="text-sm text-muted-foreground">No feedback data yet</p>;

  const maxDist = Math.max(...data.distribution, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4" /> Client Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{data.avgRating.toFixed(1)}</div>
            <div className="flex gap-0.5 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(data.avgRating) ? "text-warning fill-yellow-500" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">{data.totalCount} reviews</span>
          </div>

          {data.npsScore !== null && (
            <div className="text-center">
              <div className={`text-2xl font-bold ${data.npsScore >= 50 ? "text-success" : data.npsScore >= 0 ? "text-warning" : "text-destructive"}`}>
                {data.npsScore > 0 ? "+" : ""}{data.npsScore}
              </div>
              <span className="text-[10px] text-muted-foreground">NPS Score</span>
            </div>
          )}

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-1 text-[10px]">
                <span className="w-3">{rating}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning/10 rounded-full"
                    style={{ width: `${(data.distribution[rating - 1] / maxDist) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right text-muted-foreground">{data.distribution[rating - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        {data.recentComments.length > 0 && (
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {data.recentComments.map((c, i) => (
                <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-2.5 w-2.5 ${s <= c.rating ? "text-warning fill-yellow-500" : "text-muted"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{c.comment}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
