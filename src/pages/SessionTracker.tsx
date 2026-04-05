import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, Play, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  waiting: { label: "Waiting to Start", icon: Clock, color: "text-yellow-600" },
  in_progress: { label: "Session In Progress", icon: Play, color: "text-blue-600" },
  kba_verification: { label: "Identity Verification", icon: AlertCircle, color: "text-orange-600" },
  signing: { label: "Document Signing", icon: Play, color: "text-blue-600" },
  completed: { label: "Session Complete", icon: CheckCircle2, color: "text-green-600" },
  cancelled: { label: "Session Cancelled", icon: AlertCircle, color: "text-red-600" },
};

export default function SessionTracker() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchSession = async () => {
      const { data, error: fetchError } = await supabase
        .from("session_tracking")
        .select("*")
        .eq("shareable_token", token)
        .maybeSingle();

      if (fetchError || !data) {
        setError("Session not found. Please check your tracking link.");
      } else {
        setSession(data);
      }
      setLoading(false);
    };

    fetchSession();

    // Realtime subscription
    const channel = supabase
      .channel(`session-${token}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_tracking",
          filter: `shareable_token=eq.${token}`,
        },
        (payload) => {
          setSession(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [token]);

  const statusInfo = session ? STATUS_CONFIG[session.status] || STATUS_CONFIG.waiting : null;

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
            Session Status
          </h1>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {session && statusInfo && (
            <Card>
              <CardContent className="p-8 text-center space-y-6">
                <statusInfo.icon className={`mx-auto h-16 w-16 ${statusInfo.color}`} />
                <div>
                  <Badge variant="secondary" className="mb-2 text-sm">
                    {statusInfo.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {session.notes || "Your session is being tracked in real-time."}
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config], i) => (
                    <div
                      key={key}
                      className={`h-2 w-12 rounded-full ${
                        Object.keys(STATUS_CONFIG).indexOf(session.status) >= i
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(session.updated_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
