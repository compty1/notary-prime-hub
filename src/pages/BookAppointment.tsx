import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MapPin, Monitor, Calendar, FileText, CheckCircle, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

type Step = 1 | 2 | 3 | 4;
type NotarizationType = "in_person" | "ron";

const serviceTypes = [
  "Real Estate Documents",
  "Power of Attorney",
  "Affidavits & Sworn Statements",
  "Estate Planning Documents",
  "Business Documents",
  "I-9 Employment Verification",
  "Other",
];

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [notarizationType, setNotarizationType] = useState<NotarizationType>("in_person");
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to book appointments.", variant: "destructive" });
      navigate("/login");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      client_id: user.id,
      service_type: serviceType,
      notarization_type: notarizationType,
      scheduled_date: date,
      scheduled_time: time,
      location: notarizationType === "in_person" ? location : "Remote",
      notes,
    });

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment booked!", description: "You'll receive a confirmation email shortly." });
      navigate("/portal");
    }
    setSubmitting(false);
  };

  const canProceed = () => {
    if (step === 1) return !!notarizationType;
    if (step === 2) return !!serviceType;
    if (step === 3) return !!date && !!time;
    return true;
  };

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
          {user ? (
            <Link to="/portal"><Button variant="outline" size="sm">My Portal</Button></Link>
          ) : (
            <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
          )}
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step >= s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`h-0.5 w-8 transition-colors ${step > s ? "bg-accent" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {step === 1 && "Select Notarization Type"}
                {step === 2 && "Choose Service"}
                {step === 3 && "Pick Date & Time"}
                {step === 4 && "Review & Confirm"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setNotarizationType("in_person")}
                    className={`rounded-lg border-2 p-6 text-left transition-all ${
                      notarizationType === "in_person" ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                    }`}
                  >
                    <MapPin className="mb-2 h-8 w-8 text-accent" />
                    <h3 className="font-display text-lg font-semibold">In-Person</h3>
                    <p className="text-sm text-muted-foreground">Franklin County & Columbus area</p>
                  </button>
                  <button
                    onClick={() => setNotarizationType("ron")}
                    className={`rounded-lg border-2 p-6 text-left transition-all ${
                      notarizationType === "ron" ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                    }`}
                  >
                    <Monitor className="mb-2 h-8 w-8 text-accent" />
                    <h3 className="font-display text-lg font-semibold">Remote (RON)</h3>
                    <p className="text-sm text-muted-foreground">Secure video call from anywhere</p>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <Label>Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                  {notarizationType === "in_person" && (
                    <div>
                      <Label htmlFor="location">Location / Address</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where should we meet?" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Number of documents, special instructions, etc." rows={3} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium flex items-center gap-1">
                      {notarizationType === "in_person" ? <><MapPin className="h-3 w-3" /> In-Person</> : <><Monitor className="h-3 w-3" /> Remote (RON)</>}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{serviceType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{time}</span>
                  </div>
                  {location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{location}</span>
                    </div>
                  )}
                  {notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes: </span>
                      <span>{notes}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => step > 1 && setStep((step - 1) as Step)} disabled={step === 1}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                {step < 4 ? (
                  <Button onClick={() => setStep((step + 1) as Step)} disabled={!canProceed()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
