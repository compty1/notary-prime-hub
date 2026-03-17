import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Phone, Calendar, Star, Clock, MapPin, Monitor, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function AdminClients() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [profileRes, apptRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("scheduled_date", { ascending: false }),
      ]);
      if (profileRes.data) setProfiles(profileRes.data);
      if (apptRes.data) setAppointments(apptRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getClientStats = (userId: string) => {
    const clientAppts = appointments.filter((a) => a.client_id === userId);
    const completed = clientAppts.filter((a) => a.status === "completed").length;
    const total = clientAppts.length;
    const lastVisit = clientAppts.find((a) => a.status === "completed")?.scheduled_date;
    return { total, completed, lastVisit, isRepeat: completed >= 2, appointments: clientAppts };
  };

  const filtered = profiles.filter((p) =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search)
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Client Directory</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No clients found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const stats = getClientStats(p.user_id);
            return (
              <Card
                key={p.id}
                className="cursor-pointer border-border/50 transition-shadow hover:shadow-md"
                onClick={() => setSelectedClient(p)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {(p.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                        {stats.isRepeat && (
                          <Badge className="bg-accent/20 text-accent-foreground text-xs flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5" /> Repeat
                          </Badge>
                        )}
                      </div>
                      {p.phone && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {p.phone}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{stats.total} appointment{stats.total !== 1 ? "s" : ""}</span>
                        {stats.lastVisit && <span>• Last: {stats.lastVisit}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedClient?.full_name || "Client Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (() => {
            const stats = getClientStats(selectedClient.user_id);
            return (
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="grid gap-2 text-sm">
                  {selectedClient.phone && (
                    <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {selectedClient.phone}</p>
                  )}
                  {selectedClient.address && (
                    <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /> {selectedClient.address}, {selectedClient.city}, {selectedClient.state} {selectedClient.zip}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{stats.lastVisit || "—"}</p>
                    <p className="text-xs text-muted-foreground">Last Visit</p>
                  </div>
                </div>

                {/* Appointment History */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Appointment History</h4>
                  {stats.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No appointments</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {stats.appointments.map((appt: any) => (
                        <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2 text-sm">
                          <div className="flex items-center gap-2">
                            {appt.notarization_type === "ron" ? <Monitor className="h-3 w-3 text-accent" /> : <MapPin className="h-3 w-3 text-accent" />}
                            <div>
                              <p className="text-xs font-medium">{appt.service_type}</p>
                              <p className="text-xs text-muted-foreground">{appt.scheduled_date}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${statusColors[appt.status] || "bg-muted"}`}>
                            {appt.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
