import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Monitor, Plus, LogOut, Shield, FileText } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  id_verification: "bg-yellow-100 text-yellow-800",
  kba_pending: "bg-orange-100 text-orange-800",
  in_session: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function ClientPortal() {
  const { user, signOut, isAdmin } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [apptRes, profileRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      if (apptRes.data) setAppointments(apptRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const upcoming = appointments.filter((a) => ["scheduled", "confirmed"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">SG</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Client Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin"><Button variant="outline" size="sm">Admin Dashboard</Button></Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">Manage your notarization appointments</p>
        </motion.div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Upcoming Appointments</h2>
          <Link to="/book">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">
              <Plus className="mr-1 h-4 w-4" /> New Appointment
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : upcoming.length === 0 ? (
          <Card className="mb-8 border-border/50">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <Link to="/book" className="mt-4">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Your First Appointment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-8 space-y-4">
            {upcoming.map((appt) => (
              <motion.div key={appt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50 transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        {appt.notarization_type === "ron" ? <Monitor className="h-5 w-5 text-accent" /> : <MapPin className="h-5 w-5 text-accent" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{appt.service_type}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {appt.scheduled_date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {appt.scheduled_time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={statusColors[appt.status] || "bg-muted text-muted-foreground"}>
                      {appt.status.replace(/_/g, " ")}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mb-4 font-display text-xl font-semibold">Past Appointments</h2>
            <div className="space-y-3">
              {past.map((appt) => (
                <Card key={appt.id} className="border-border/50 opacity-75">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">{appt.service_type}</p>
                      <p className="text-sm text-muted-foreground">{appt.scheduled_date}</p>
                    </div>
                    <Badge className={statusColors[appt.status] || "bg-muted text-muted-foreground"}>
                      {appt.status.replace(/_/g, " ")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
