import { usePageMeta } from "@/hooks/usePageMeta";
import PageShell from "@/components/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarCheck } from "lucide-react";

export default function AdminComplianceCalendars() {
  usePageMeta({ title: "Compliance Calendars", noIndex: true });

  const { data: calendars = [], isLoading } = useQuery({
    queryKey: ["compliance-calendars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_calendars").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell title="Compliance Calendars" description="Manage client compliance deadlines and renewal schedules." icon={CalendarCheck}>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Calendar</TableHead><TableHead>Entity</TableHead><TableHead>Events</TableHead><TableHead>Created</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {calendars.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No compliance calendars</TableCell></TableRow>
              ) : calendars.map((c: any) => {
                const entries = Array.isArray(c.entries) ? c.entries : [];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.calendar_name}</TableCell>
                    <TableCell>{c.entity_name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{entries.length} events</Badge></TableCell>
                    <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
