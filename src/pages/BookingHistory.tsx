/**
 * Client-facing booking lifecycle / notifications page.
 * Lists every audited appointment event (booked, rescheduled, cancelled,
 * confirmed, completed) for the signed-in user with timestamps and the
 * email that was dispatched.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Mail, RefreshCw, XCircle, CheckCircle2, Clock } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

type AuditRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type EmailRow = {
  message_id: string | null;
  template_name: string | null;
  status: string | null;
  recipient_email: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const ACTION_META: Record<string, { label: string; icon: typeof Calendar; tone: string }> = {
  appointment_booked: { label: "Booked", icon: Calendar, tone: "bg-primary/10 text-primary" },
  appointment_rescheduled: { label: "Rescheduled", icon: RefreshCw, tone: "bg-accent/20 text-foreground" },
  appointment_cancelled: { label: "Cancelled", icon: XCircle, tone: "bg-destructive/10 text-destructive" },
  appointment_confirmed: { label: "Confirmed", icon: CheckCircle2, tone: "bg-primary/10 text-primary" },
  appointment_completed: { label: "Completed", icon: CheckCircle2, tone: "bg-success/10 text-success" },
  appointment_no_show: { label: "No-show", icon: Clock, tone: "bg-muted text-muted-foreground" },
};

export default function BookingHistory() {
  usePageMeta({
    title: "Booking History | Notar",
    description: "Your booking lifecycle: every change, timestamp, and notification.",
    noIndex: true,
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [emails, setEmails] = useState<EmailRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // 1. Get the user's appointments to scope audit records.
      const { data: appts } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", user.id);
      const apptIds = (appts ?? []).map((a) => a.id as string);

      if (apptIds.length === 0) {
        setEvents([]);
        setEmails([]);
        setLoading(false);
        return;
      }

      // 2. Audit log entries for those appointments.
      const { data: audit } = await supabase
        .from("audit_log")
        .select("id, action, entity_type, entity_id, details, created_at")
        .eq("entity_type", "appointment")
        .in("entity_id", apptIds)
        .order("created_at", { ascending: false })
        .limit(200);
      setEvents((audit as AuditRow[]) ?? []);

      // 3. Emails that referenced the user's address.
      if (user.email) {
        const { data: mail } = await supabase
          .from("email_send_log")
          .select("message_id, template_name, status, recipient_email, created_at, metadata")
          .ilike("recipient_email", user.email)
          .order("created_at", { ascending: false })
          .limit(100);
        setEmails((mail as EmailRow[]) ?? []);
      }

      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Please sign in to view your booking history.</p>
          <Button asChild className="mt-4"><Link to="/login">Sign In</Link></Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Booking history</h1>
          <p className="mt-2 text-muted-foreground">
            Every change to your appointments — booked, rescheduled, cancelled — with timestamps
            and a record of every notification we sent you.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lifecycle events</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No booking events yet.</p>
                ) : (
                  <ol className="space-y-4">
                    {events.map((e) => {
                      const meta = ACTION_META[e.action] ?? { label: e.action, icon: Calendar, tone: "bg-muted text-foreground" };
                      const Icon = meta.icon;
                      const reason = (e.details as { reason?: string } | null)?.reason;
                      const before = (e.details as { before?: Record<string, unknown> } | null)?.before;
                      const after = (e.details as { after?: Record<string, unknown> } | null)?.after;
                      return (
                        <li key={e.id} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4">
                          <div className={`mt-0.5 h-9 w-9 shrink-0 rounded-xl ${meta.tone} flex items-center justify-center`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{meta.label}</span>
                              <Badge variant="outline" className="text-[10px]">{e.entity_id?.slice(0, 8)}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(e.created_at).toLocaleString()}
                              </span>
                            </div>
                            {reason && <p className="mt-1 text-sm text-muted-foreground">Reason: {reason}</p>}
                            {(before || after) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {before ? `From ${(before as { scheduled_date?: string }).scheduled_date ?? "—"} ${(before as { scheduled_time?: string }).scheduled_time ?? ""}` : ""}
                                {after ? ` → ${(after as { scheduled_date?: string }).scheduled_date ?? "—"} ${(after as { scheduled_time?: string }).scheduled_time ?? ""}` : ""}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Emails sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No emails on record.</p>
                ) : (
                  <ul className="space-y-3">
                    {emails.map((m, i) => (
                      <li key={`${m.message_id ?? i}`} className="rounded-xl border border-border/60 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{m.template_name ?? "—"}</span>
                          <Badge
                            variant={m.status === "sent" ? "default" : m.status === "dlq" || m.status === "failed" ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {m.status ?? "pending"}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
