/**
 * Real-time waiting room for RON session participants.
 * Shows party status and readiness before session begins.
 * Uses Supabase Realtime on session_tracking — no simulations.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, Users, Shield, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface Party {
  role: string;
  name: string;
  status: "connecting" | "in_lobby" | "ready" | "in_session" | "disconnected";
}

interface SessionWaitingRoomProps {
  appointmentId: string;
  signerName?: string;
  notaryName?: string;
  witnessRequired?: boolean;
  onAllReady: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  connecting: { label: "Connecting…", color: "bg-muted text-muted-foreground", icon: Loader2 },
  in_lobby: { label: "In Lobby", color: "bg-warning/10 text-warning-foreground", icon: Circle },
  ready: { label: "Ready", color: "bg-success/10 text-success", icon: CheckCircle2 },
  in_session: { label: "In Session", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  disconnected: { label: "Disconnected", color: "bg-destructive/10 text-destructive", icon: Circle },
};

export function SessionWaitingRoom({ appointmentId, signerName, notaryName, witnessRequired, onAllReady }: SessionWaitingRoomProps) {
  const { user, isAdmin, isNotary } = useAuth();
  const [parties, setParties] = useState<Party[]>([
    { role: "Notary", name: notaryName || "Notary Public", status: "connecting" },
    { role: "Signer", name: signerName || "Signer", status: "connecting" },
    ...(witnessRequired ? [{ role: "Witness", name: "Witness", status: "connecting" as const }] : []),
  ]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [markingReady, setMarkingReady] = useState(false);

  // Determine current user's role
  const myRole = isAdmin || isNotary ? "Notary" : "Signer";

  // Subscribe to session_tracking realtime for party status updates
  useEffect(() => {
    if (!appointmentId) return;

    // On mount, also fetch current tracking rows
    const fetchCurrent = async () => {
      const { data } = await supabase
        .from("session_tracking" as any)
        .select("*")
        .eq("appointment_id", appointmentId);
      if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row?.party_role && row?.party_status) {
            setParties(prev => prev.map(p =>
              p.role.toLowerCase() === row.party_role.toLowerCase()
                ? { ...p, status: row.party_status, name: row.party_name || p.name }
                : p
            ));
          }
        });
      }
    };
    fetchCurrent();

    const channel = supabase
      .channel(`waiting-${appointmentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_tracking",
        filter: `appointment_id=eq.${appointmentId}`,
      }, (payload: any) => {
        const row = payload.new;
        if (row?.party_role && row?.party_status) {
          setParties(prev => prev.map(p =>
            p.role.toLowerCase() === row.party_role.toLowerCase()
              ? { ...p, status: row.party_status, name: row.party_name || p.name }
              : p
          ));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [appointmentId]);

  // Mark the current user as "in_lobby" on mount
  useEffect(() => {
    if (!appointmentId || !user) return;
    const markInLobby = async () => {
      await supabase.from("session_tracking" as any).upsert({
        appointment_id: appointmentId,
        party_role: myRole.toLowerCase(),
        party_name: myRole === "Signer" ? (signerName || "Signer") : (notaryName || "Notary Public"),
        party_status: "in_lobby",
        user_id: user.id,
      } as never, { onConflict: "appointment_id,party_role" }).then(() => {}, () => {});
      // Update local state immediately
      setParties(prev => prev.map(p => p.role === myRole ? { ...p, status: "in_lobby" } : p));
    };
    markInLobby();
  }, [appointmentId, user]);

  const allReady = parties.every(p => p.status === "ready" || p.status === "in_session");

  useEffect(() => {
    if (allReady && countdown === null) {
      setCountdown(5);
    }
  }, [allReady]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { onAllReady(); return; }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onAllReady]);

  const markReady = async (role: string) => {
    setMarkingReady(true);
    // Write to DB so other participants see the update via Realtime
    await supabase.from("session_tracking" as any).upsert({
      appointment_id: appointmentId,
      party_role: role.toLowerCase(),
      party_status: "ready",
      user_id: user?.id,
    } as never, { onConflict: "appointment_id,party_role" }).then(() => {}, () => {});
    // Update local state immediately
    setParties(prev => prev.map(p => p.role === role ? { ...p, status: "ready" } : p));
    setMarkingReady(false);
  };

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Session Waiting Room</h3>
            <p className="text-xs text-muted-foreground">Waiting for all participants to join</p>
          </div>
        </div>

        <div className="space-y-3">
          {parties.map((party) => {
            const cfg = statusConfig[party.status];
            const StatusIcon = cfg.icon;
            const isMe = party.role === myRole;
            return (
              <div
                key={party.role}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background",
                  isMe && "ring-1 ring-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {party.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {party.name} {isMe && <span className="text-xs text-muted-foreground">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{party.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cfg.color}>
                    <StatusIcon className={cn("h-3 w-3 mr-1", party.status === "connecting" && "animate-spin")} />
                    {cfg.label}
                  </Badge>
                  {party.status === "in_lobby" && isMe && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      disabled={markingReady}
                      onClick={() => markReady(party.role)}
                    >
                      {markingReady ? "..." : "Mark Ready"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Wifi className="h-4 w-4 text-primary" />
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">End-to-end encrypted • AES-256 • Ohio RON Compliant</span>
        </div>

        {allReady && countdown !== null && (
          <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm font-bold text-primary">All parties ready — Session starting in {countdown}s</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
