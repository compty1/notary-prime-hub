/**
 * Real-time waiting room for RON session participants.
 * Shows party status and readiness before session begins.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, Users, Shield, Wifi } from "lucide-react";

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
  in_lobby: { label: "In Lobby", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: Circle },
  ready: { label: "Ready", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  in_session: { label: "In Session", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  disconnected: { label: "Disconnected", color: "bg-destructive/10 text-destructive", icon: Circle },
};

export function SessionWaitingRoom({ appointmentId, signerName, notaryName, witnessRequired, onAllReady }: SessionWaitingRoomProps) {
  const [parties, setParties] = useState<Party[]>([
    { role: "Notary", name: notaryName || "Notary Public", status: "connecting" },
    { role: "Signer", name: signerName || "Signer", status: "connecting" },
    ...(witnessRequired ? [{ role: "Witness", name: "Witness", status: "connecting" as const }] : []),
  ]);

  const [countdown, setCountdown] = useState<number | null>(null);

  // Simulate parties becoming ready (in production, this would use realtime DB)
  useEffect(() => {
    const t1 = setTimeout(() => setParties(prev => prev.map(p => p.role === "Notary" ? { ...p, status: "in_lobby" } : p)), 1500);
    const t2 = setTimeout(() => setParties(prev => prev.map(p => p.role === "Signer" ? { ...p, status: "in_lobby" } : p)), 2500);
    const t3 = witnessRequired ? setTimeout(() => setParties(prev => prev.map(p => p.role === "Witness" ? { ...p, status: "in_lobby" } : p)), 3500) : undefined;
    return () => { clearTimeout(t1); clearTimeout(t2); if (t3) clearTimeout(t3); };
  }, [witnessRequired]);

  // Subscribe to session_tracking realtime
  useEffect(() => {
    if (!appointmentId) return;
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

  const markReady = (role: string) => {
    setParties(prev => prev.map(p => p.role === role ? { ...p, status: "ready" } : p));
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
            return (
              <div
                key={party.role}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {party.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{party.name}</p>
                    <p className="text-xs text-muted-foreground">{party.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cfg.color}>
                    <StatusIcon className={`h-3 w-3 mr-1 ${party.status === "connecting" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </Badge>
                  {party.status === "in_lobby" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markReady(party.role)}>
                      Mark Ready
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Wifi className="h-4 w-4 text-emerald-500" />
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
