import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, MapPin, Monitor, Download, ArrowLeft, Shield } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

function generateICS(appt: any): string {
  const dtStart = `${appt.scheduled_date.replace(/-/g, "")}T${appt.scheduled_time.replace(/:/g, "").substring(0, 6)}00`;
  // Assume 30 min duration
  const startDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const dtEnd = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shane Goble Notary//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Notarization — ${appt.service_type}`,
    `DESCRIPTION:${appt.notarization_type === "ron" ? "Remote Online Notarization (RON) session" : "In-person notarization appointment"} with Shane Goble Notary Services`,
    `LOCATION:${appt.location || (appt.notarization_type === "ron" ? "Online — Video Call" : "TBD")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function AppointmentConfirmation() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("id");
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId || !user) { setLoading(false); return; }
    supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single()
      .then(({ data }) => {
        if (data) setAppointment(data);
        setLoading(false);
      });
  }, [appointmentId, user]);

  const downloadICS = () => {
    if (!appointment) return;
    const ics = generateICS(appointment);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notarization-${appointment.scheduled_date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 text-center">
        <p className="text-muted-foreground">Appointment not found.</p>
        <Link to="/portal" className="mt-4"><Button>Go to Portal</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">SG</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Shane Goble</span>
          </Link>
          <Link to="/portal"><Button variant="outline" size="sm">My Portal</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Appointment Confirmed!</h1>
        <p className="mb-8 text-muted-foreground">Your notarization appointment has been booked successfully.</p>

        <Card className="mb-6 border-border/50 text-left">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {appointment.notarization_type === "ron" ? <Monitor className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                Type
              </span>
              <Badge className="bg-accent/20 text-accent-foreground">
                {appointment.notarization_type === "ron" ? "Remote (RON)" : "In-Person"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" /> Service</span>
              <span className="text-sm font-medium">{appointment.service_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Date</span>
              <span className="text-sm font-medium">{formatDate(appointment.scheduled_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Time</span>
              <span className="text-sm font-medium">{formatTime(appointment.scheduled_time)}</span>
            </div>
            {appointment.location && appointment.location !== "Remote" && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> Location</span>
                <span className="text-sm font-medium text-right max-w-[60%]">{appointment.location}</span>
              </div>
            )}
            {appointment.estimated_price && (
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm text-muted-foreground">Est. Total</span>
                <span className="text-sm font-bold text-accent">${parseFloat(appointment.estimated_price).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={downloadICS} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Add to Calendar (.ics)
          </Button>
          <Link to="/portal">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark sm:w-auto">
              Go to Portal
            </Button>
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-accent/30 bg-accent/5 p-4 text-left text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">What to bring:</p>
          <ul className="space-y-1">
            <li>✓ Valid government-issued photo ID (driver's license, passport, or state ID)</li>
            <li>✓ The document(s) to be notarized</li>
            {appointment.notarization_type === "ron" && (
              <>
                <li>✓ Computer with camera and microphone</li>
                <li>✓ Stable internet connection</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
