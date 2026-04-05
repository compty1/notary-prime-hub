import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Star, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPerformance() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("appointments").select("notary_id, status, appointment_duration_actual, scheduled_date").not("notary_id", "is", null),
      supabase.from("client_feedback").select("*"),
    ]).then(([aptRes, fbRes]) => {
      setAppointments(aptRes.data || []);
      setFeedback(fbRes.data || []);
      setLoading(false);
    });
  }, []);

  const scorecards = useMemo(() => {
    const notaryMap: Record<string, { completed: number; total: number; durations: number[]; ratings: number[] }> = {};

    appointments.forEach((apt) => {
      if (!apt.notary_id) return;
      if (!notaryMap[apt.notary_id]) {
        notaryMap[apt.notary_id] = { completed: 0, total: 0, durations: [], ratings: [] };
      }
      notaryMap[apt.notary_id].total++;
      if (apt.status === "completed") {
        notaryMap[apt.notary_id].completed++;
        if (apt.appointment_duration_actual) {
          notaryMap[apt.notary_id].durations.push(apt.appointment_duration_actual);
        }
      }
    });

    feedback.forEach((fb) => {
      // Match by appointment
      const apt = appointments.find((a) => a.id === fb.appointment_id);
      if (apt?.notary_id && notaryMap[apt.notary_id]) {
        notaryMap[apt.notary_id].ratings.push(fb.rating);
      }
    });

    return Object.entries(notaryMap).map(([id, data]) => ({
      notary_id: id,
      completed: data.completed,
      total: data.total,
      completionRate: data.total ? Math.round((data.completed / data.total) * 100) : 0,
      avgDuration: data.durations.length ? Math.round(data.durations.reduce((s, d) => s + d, 0) / data.durations.length) : 0,
      avgRating: data.ratings.length ? (data.ratings.reduce((s, r) => s + r, 0) / data.ratings.length).toFixed(1) : "N/A",
      ratingCount: data.ratings.length,
    }));
  }, [appointments, feedback]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6" /> Notary Performance
        </h1>
        <p className="text-muted-foreground text-sm">Performance scorecards for your notary team</p>
      </div>

      {scorecards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p>No notary performance data available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scorecards.map((card) => (
              <Card key={card.notary_id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">Notary</Badge>
                    <Badge variant={card.completionRate >= 90 ? "default" : "outline"}>
                      {card.completionRate}% completion
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold">{card.completed}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{card.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" /> {card.avgRating}
                      </div>
                      <div className="text-xs text-muted-foreground">{card.ratingCount} reviews</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{card.avgDuration || "—"}</div>
                      <div className="text-xs text-muted-foreground">Avg min</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scorecards}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="notary_id" tick={false} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
