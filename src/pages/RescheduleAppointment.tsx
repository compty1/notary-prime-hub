import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { useParams } from "react-router-dom";

export default function RescheduleAppointment() {
  const { confirmationNumber } = useParams<{ confirmationNumber: string }>();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduled, setRescheduled] = useState(false);

  const handleVerify = async () => {
    if (!email.trim() || !confirmationNumber) return;
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("email", email.trim())
        .maybeSingle();

      if (!profile) {
        toast({ title: "Not found", description: "No account found with that email.", variant: "destructive" });
        return;
      }

      const { data: apt } = await supabase
        .from("appointments")
        .select("*")
        .eq("confirmation_number", confirmationNumber)
        .eq("client_id", profile.user_id)
        .in("status", ["scheduled", "confirmed"])
        .maybeSingle();

      if (!apt) {
        toast({ title: "Not found", description: "No active appointment found with that confirmation number.", variant: "destructive" });
        return;
      }

      setAppointment(apt);
      setVerified(true);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime || !appointment) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          rescheduled_from: appointment.id,
          status: "scheduled",
        })
        .eq("id", appointment.id);

      if (error) throw error;

      setRescheduled(true);
      toast({ title: "Rescheduled!", description: `Your appointment has been moved to ${newDate} at ${newTime}.` });
    } catch (err: any) {
      toast({ title: "Failed to reschedule", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <h1 className="mb-2 text-center text-3xl font-bold text-foreground">Reschedule Appointment</h1>
          <p className="mb-8 text-center text-muted-foreground">Change your appointment date and time.</p>

          {rescheduled ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
                <h2 className="text-xl font-semibold text-foreground">Rescheduled Successfully</h2>
                <p className="mt-2 text-muted-foreground">
                  Your new appointment is on {newDate} at {newTime}. You'll receive a confirmation email shortly.
                </p>
              </CardContent>
            </Card>
          ) : !verified ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Confirmation Number</Label>
                  <Input value={confirmationNumber || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter the email used for booking"
                  />
                </div>
                <Button className="w-full" onClick={handleVerify} disabled={loading || !email.trim()}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify & Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">Current: {appointment.scheduled_date} at {appointment.scheduled_time}</p>
                  <p className="text-muted-foreground">{appointment.service_type}</p>
                </div>
                <div className="space-y-2">
                  <Label>New Date</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Time</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleReschedule} disabled={loading || !newDate || !newTime}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                  Confirm Reschedule
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
