/**
 * G-076+: Appointment waitlist with auto-notification.
 * When a time slot is full, clients can join a waitlist
 * and get notified if a slot opens.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WaitlistFormProps {
  serviceType: string;
  requestedDate: string;
  requestedTime?: string;
  onJoined?: () => void;
}

export function AppointmentWaitlist({ serviceType, requestedDate, requestedTime, onJoined }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setSubmitting(true);

    try {
      // Store waitlist entry as a lead
      const { error } = await supabase.from("leads").insert({
        full_name: name,
        email,
        phone: phone || null,
        source: "waitlist",
        status: "new",
        notes: `Waitlist for ${serviceType} on ${requestedDate}${requestedTime ? ` at ${requestedTime}` : ""}`,
      });

      if (error) throw error;

      setJoined(true);
      onJoined?.();
      toast({
        title: "You're on the waitlist!",
        description: "We'll notify you if a slot opens up.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to join waitlist",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (joined) {
    return (
      <Card className="rounded-2xl border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-bold text-foreground">You're on the waitlist!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We'll email you at <strong>{email}</strong> if a slot opens for {requestedDate}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Clock className="h-5 w-5 text-amber-500" />
          This time slot is full
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Join the waitlist and we'll notify you if a spot opens up.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="rounded-xl"
          />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e = autoComplete="email"> setEmail(e.target.value)}
            required
            className="rounded-xl"
          />
          <Input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={e = autoComplete="tel"> setPhone(e.target.value)}
            className="rounded-xl"
          />
          <Button type="submit" disabled={submitting} className="w-full rounded-xl gap-2">
            <Bell className="h-4 w-4" />
            {submitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Waitlist position indicator.
 */
export function WaitlistPosition({ position, totalWaiting }: { position: number; totalWaiting: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      <span>
        You are <strong className="text-foreground">#{position}</strong> of {totalWaiting} on the waitlist
      </span>
    </div>
  );
}
