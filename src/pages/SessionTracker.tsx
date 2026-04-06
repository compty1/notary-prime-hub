import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, Play, AlertCircle, FileUp, Shield, PenTool } from "lucide-react";

const STEPS = [
  { key: "waiting", label: "Waiting", icon: Clock },
  { key: "document_upload", label: "Documents", icon: FileUp },
  { key: "kba_verification", label: "Identity (KBA)", icon: Shield },
  { key: "signing", label: "Signing", icon: PenTool },
  { key: "completed", label: "Complete", icon: CheckCircle2 },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  waiting: { label: "Waiting to Start", icon: Clock, color: "text-yellow-600" },
  document_upload: { label: "Uploading Documents", icon: FileUp, color: "text-blue-600" },
  in_progress: { label: "Session In Progress", icon: Play, color: "text-blue-600" },
  kba_verification: { label: "Identity Verification", icon: Shield, color: "text-orange-600" },
  signing: { label: "Document Signing", icon: PenTool, color: "text-blue-600" },
  completed: { label: "Session Complete", icon: CheckCircle2, color: "text-green-600" },
  cancelled: { label: "Session Cancelled", icon: AlertCircle, color: "text-red-600" },
};

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : (status === "in_progress" ? 1 : status === "cancelled" ? -1 : 0);
}

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
  const currentStepIndex = session ? getStepIndex(session.status) : 0;

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
                  {session.estimated_completion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated completion: {new Date(session.estimated_completion).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* FC-3: Step-by-step progress */}
                <div className="flex items-center justify-center gap-1">
                  {STEPS.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} className="flex items-center gap-1">
                        <div className={`flex flex-col items-center ${isCurrent ? "scale-110" : ""}`}>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} transition-colors`}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          <span className={`text-[10px] mt-1 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {step.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`h-0.5 w-6 ${i < currentStepIndex ? "bg-primary" : "bg-muted"} transition-colors mb-4`} />
                        )}
                      </div>
                    );
                  })}
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
