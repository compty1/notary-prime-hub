import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Monitor, Plus, Video, RefreshCw, Wifi, Star, Hash, LayoutGrid, List } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

const FullCalendarView = lazy(() => import("@/components/FullCalendarView"));

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  id_verification: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  kba_pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  in_session: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-muted text-muted-foreground",
};

export { statusColors };

const formatDate = (dateStr: string) => new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

export { formatDate, formatTime };

interface Props {
  appointments: any[];
  loading: boolean;
  zoomLink: string;
  onCancelClick: (id: string) => void;
  onTechCheck: () => void;
}

export default function PortalAppointmentsTab({ appointments, loading, zoomLink, onCancelClick, onTechCheck }: Props) {
  const upcoming = appointments.filter(a => ["scheduled", "confirmed", "id_verification", "kba_pending"].includes(a.status));
  const inSession = appointments.filter(a => a.status === "in_session");
  const past = appointments.filter(a => ["completed", "cancelled", "no_show"].includes(a.status));

  const isSessionNear = (appt: any) => {
    const diff = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xl font-semibold">Upcoming Appointments</h2>
        <Link to="/book"><Button size="sm" className=""><Plus className="mr-1 h-4 w-4" /> New Appointment</Button></Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      ) : upcoming.length === 0 && inSession.length === 0 ? (
        <Card className="border-border/50"><CardContent className="p-0">
          <EmptyState
            icon="appointments"
            title="No upcoming appointments"
            description="Schedule your first notarization appointment to get started."
            actionLabel="Book Your First Appointment"
            actionTo="/book"
          />
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {inSession.map(appt => (
            <Card key={appt.id} className="border-2 border-purple-300 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-900/20">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50"><Video className="h-5 w-5 text-purple-600 dark:text-purple-300" /></div>
                  <div><p className="font-medium">{appt.service_type}</p><p className="text-sm text-muted-foreground">Session in progress</p></div>
                </div>
                <Link to={`/ron-session?id=${appt.id}`}><Button className="bg-purple-600 text-white hover:bg-purple-700"><Video className="mr-1 h-4 w-4" /> Rejoin</Button></Link>
              </CardContent>
            </Card>
          ))}
          {upcoming.map(appt => (
            <Card key={appt.id} className="border-border/50 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {appt.notarization_type === "ron" ? <Monitor className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{appt.service_type}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(appt.scheduled_date)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(appt.scheduled_time)}</span>
                      </div>
                      {appt.confirmation_number && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Hash className="h-3 w-3" /> {appt.confirmation_number}</p>}
                      {appt.location && appt.location !== "Remote" && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {appt.location}</p>}
                      {appt.estimated_price && <p className="mt-1 text-xs text-muted-foreground">Est. ${parseFloat(appt.estimated_price).toFixed(2)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {appt.notarization_type === "ron" && isSessionNear(appt) && <Link to={`/ron-session?id=${appt.id}`}><Button size="sm" className="bg-primary text-white hover:bg-primary/90"><Video className="mr-1 h-3 w-3" /> Join</Button></Link>}
                    {appt.notarization_type === "ron" && !isSessionNear(appt) && <Button size="sm" variant="outline" className="text-xs" onClick={onTechCheck}><Wifi className="mr-1 h-3 w-3" /> Tech Check</Button>}
                    {zoomLink && (appt.service_type || "").toLowerCase().includes("consult") && (
                      <a href={zoomLink} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="text-xs"><Video className="mr-1 h-3 w-3" /> Zoom</Button></a>
                    )}
                    <Link to={`/book?rebook=${appt.id}`}><Button size="sm" variant="outline" className="text-xs"><RefreshCw className="mr-1 h-3 w-3" /> Reschedule</Button></Link>
                    <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive" onClick={() => onCancelClick(appt.id)}>Cancel</Button>
                    <Badge className={statusColors[appt.status] || "bg-muted text-muted-foreground"}>{appt.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {past.length > 0 && (
        <>
          <h2 className="mt-8 font-sans text-xl font-semibold">Past Appointments</h2>
          <div className="space-y-3">
            {past.map(appt => (
              <Card key={appt.id} className="border-border/50 opacity-75">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{appt.service_type}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(appt.scheduled_date)}</p>
                    {appt.confirmation_number && <p className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> {appt.confirmation_number}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {appt.status === "completed" && (
                      <>
                        <Link to={`/portal?tab=reviews&appointmentId=${appt.id}`}><Button size="sm" variant="outline" className="text-xs"><Star className="mr-1 h-3 w-3" /> Review</Button></Link>
                        <Link to={`/book?rebook=${appt.id}`}><Button size="sm" variant="outline" className="text-xs"><RefreshCw className="mr-1 h-3 w-3" /> Rebook</Button></Link>
                      </>
                    )}
                    <Badge className={statusColors[appt.status]}>{appt.status.replace(/_/g, " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
