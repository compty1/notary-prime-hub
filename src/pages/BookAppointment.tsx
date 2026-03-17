import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MapPin, Monitor, Calendar, FileText, CheckCircle, ChevronLeft, ChevronRight, Shield, Clock, Camera, Loader2, Sparkles, AlertTriangle } from "lucide-react";

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
  const { user, signUp, signIn } = useAuth();
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

  // Progressive signup fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  // Smart scheduling
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ID Pre-scan
  const [idScanning, setIdScanning] = useState(false);
  const [idData, setIdData] = useState<any>(null);

  // Document auto-detect
  const [docScanning, setDocScanning] = useState(false);
  const [docAnalysis, setDocAnalysis] = useState<any>(null);

  // Batch notarization
  const [documentCount, setDocumentCount] = useState(1);

  // Returning client recognition
  const [profile, setProfile] = useState<any>(null);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);

  // Load profile for returning clients
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) setProfile(data);
      });
      supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }).limit(5).then(({ data }) => {
        if (data) setPastAppointments(data);
      });
    }
  }, [user]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    supabase.from("time_slots")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAvailableSlots(data);
          setSuggestedSlots([]);
        } else {
          setAvailableSlots([]);
          // Find nearest available slots
          findNearestSlots(date);
        }
        setLoadingSlots(false);
      });
  }, [date]);

  const findNearestSlots = async (selectedDate: string) => {
    const { data: allSlots } = await supabase.from("time_slots").select("*").eq("is_available", true);
    if (!allSlots || allSlots.length === 0) return;

    const selected = new Date(selectedDate);
    const suggestions: { date: string; slot: any }[] = [];

    for (let offset = 1; offset <= 14 && suggestions.length < 3; offset++) {
      for (const dir of [1, -1]) {
        const checkDate = new Date(selected);
        checkDate.setDate(checkDate.getDate() + offset * dir);
        if (checkDate < new Date()) continue;
        const daySlots = allSlots.filter((s) => s.day_of_week === checkDate.getDay());
        for (const slot of daySlots) {
          if (suggestions.length < 3) {
            suggestions.push({ date: checkDate.toISOString().split("T")[0], slot });
          }
        }
      }
    }
    setSuggestedSlots(suggestions);
  };

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-id`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await resp.json();
        if (data.error) {
          toast({ title: "ID scan issue", description: data.error, variant: "destructive" });
        } else {
          setIdData(data);
          if (!guestName && data.full_name) setGuestName(data.full_name);
          if (data.is_expired) {
            toast({ title: "Expired ID Detected", description: "This ID appears to be expired. You'll need a current, valid ID for notarization.", variant: "destructive" });
          } else {
            toast({ title: "ID scanned successfully", description: `${data.id_type} — ${data.full_name}` });
          }
        }
        setIdScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Scan failed", description: "Could not process the ID image.", variant: "destructive" });
      setIdScanning(false);
    }
  };

  const handleDocScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64, fileName: file.name }),
        });
        const data = await resp.json();
        if (data.error) {
          toast({ title: "Document analysis issue", description: data.error, variant: "destructive" });
        } else {
          setDocAnalysis(data);
          // Auto-select service type based on document analysis
          if (data.document_type) {
            const mapped: Record<string, string> = {
              "Real Estate": "Real Estate Documents",
              "Legal": "Affidavits & Sworn Statements",
              "Estate Planning": "Estate Planning Documents",
              "Business": "Business Documents",
              "Personal": "Other",
            };
            const match = mapped[data.document_type];
            if (match && !serviceType) setServiceType(match);
          }
          // Auto-set RON eligibility warning
          if (data.ron_eligible === false && notarizationType === "ron") {
            toast({ title: "RON not recommended", description: "This document type may not be eligible for remote notarization.", variant: "destructive" });
          }
          toast({ title: "Document analyzed", description: `${data.document_name} — ${data.notarization_method}` });
        }
        setDocScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Analysis failed", description: "Could not process the document.", variant: "destructive" });
      setDocScanning(false);
    }
  };

  const handleRebook = (appt: any) => {
    setNotarizationType(appt.notarization_type);
    setServiceType(appt.service_type);
    if (appt.location && appt.location !== "Remote") setLocation(appt.location);
    setStep(3);
    toast({ title: "Details pre-filled", description: "Just pick a new date and time!" });
  };

  const handleSubmit = async () => {
    // Progressive signup: create account if not logged in
    if (!user) {
      if (!guestEmail || !guestPassword || !guestName) {
        setShowSignup(true);
        toast({ title: "Create account to confirm", description: "Enter your details below to complete booking.", variant: "destructive" });
        return;
      }
      const { error } = await signUp(guestEmail, guestPassword, guestName);
      if (error) {
        // Try signing in if they already have an account
        const { error: signInErr } = await signIn(guestEmail, guestPassword);
        if (signInErr) {
          toast({ title: "Account error", description: error.message, variant: "destructive" });
          return;
        }
      }
      toast({ title: "Check your email", description: "We sent a verification link. Your appointment will be saved once you verify." });
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
          <div className="flex items-center gap-2">
            <Link to="/notary-guide" className="hidden text-sm text-muted-foreground hover:text-foreground md:block">Guide</Link>
            {user ? (
              <Link to="/portal"><Button variant="outline" size="sm">My Portal</Button></Link>
            ) : (
              <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        {/* Returning client recognition */}
        {user && pastAppointments.length > 0 && step === 1 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!</p>
                  <Badge className="bg-accent/20 text-accent-foreground text-xs">{pastAppointments.length} past visit{pastAppointments.length > 1 ? "s" : ""}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Quick rebook from a previous appointment:</p>
                <div className="flex flex-wrap gap-2">
                  {pastAppointments.slice(0, 3).map((appt) => (
                    <Button key={appt.id} variant="outline" size="sm" className="text-xs" onClick={() => handleRebook(appt)}>
                      {appt.service_type} ({appt.notarization_type === "ron" ? "RON" : "In-Person"})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                <div className="space-y-4">
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

                  {/* Document Auto-Detect */}
                  <div className="rounded-lg border border-dashed border-accent/30 bg-accent/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-accent" />
                      Upload your document for AI analysis (optional)
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      We'll identify the notarization type, who needs to be present, and any special requirements.
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleDocScan}
                      disabled={docScanning}
                      className="text-xs"
                    />
                    {docScanning && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Analyzing document...
                      </div>
                    )}
                    {docAnalysis && !docAnalysis.error && (
                      <div className="mt-2 space-y-2 rounded bg-emerald-50 p-3 text-xs text-emerald-800">
                        <div className="flex items-center gap-1 font-medium">
                          <CheckCircle className="h-3 w-3" />
                          {docAnalysis.document_name} — {docAnalysis.notarization_method}
                        </div>
                        <div className="text-emerald-700">
                          <p>Signers: {docAnalysis.signers_required} • Witnesses: {docAnalysis.witnesses_required}</p>
                          {docAnalysis.who_must_be_present?.length > 0 && (
                            <p className="mt-1">Present: {docAnalysis.who_must_be_present.join(", ")}</p>
                          )}
                          {!docAnalysis.ron_eligible && (
                            <p className="mt-1 font-medium text-amber-700">⚠ Not eligible for RON</p>
                          )}
                        </div>
                        {docAnalysis.special_requirements?.length > 0 && (
                          <div className="rounded bg-amber-50 p-2 text-amber-700">
                            {docAnalysis.special_requirements.map((r: string, i: number) => (
                              <p key={i} className="flex items-start gap-1"><AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" /> {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Batch Notarization */}
                  <div>
                    <Label>Number of Documents</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          size="sm"
                          variant={documentCount === n ? "default" : "outline"}
                          className={documentCount === n ? "bg-accent text-accent-foreground" : ""}
                          onClick={() => setDocumentCount(n)}
                        >
                          {n}
                        </Button>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {documentCount > 1 ? "Same session, separate journal entries" : ""}
                      </span>
                    </div>
                  </div>

                  {/* ID Pre-Scan */}
                  <div className="rounded-lg border border-dashed border-accent/30 bg-accent/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Camera className="h-4 w-4 text-accent" />
                      Pre-scan your ID (optional — saves time)
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Upload a photo of your government-issued ID to auto-fill your information.
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleIdScan}
                      disabled={idScanning}
                      className="text-xs"
                    />
                    {idScanning && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Scanning your ID...
                      </div>
                    )}
                    {idData && !idData.error && (
                      <div className="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-700">
                        <CheckCircle className="mr-1 inline h-3 w-3" />
                        Verified: {idData.full_name} — {idData.id_type}
                        {idData.is_expired && (
                          <span className="ml-2 text-red-600 font-medium">⚠ EXPIRED</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>

                  {/* Smart scheduling */}
                  {date && loadingSlots && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                    </div>
                  )}

                  {date && !loadingSlots && availableSlots.length === 0 && suggestedSlots.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-800">
                        <AlertTriangle className="h-4 w-4" /> No availability on this date
                      </p>
                      <p className="mb-3 text-xs text-amber-700">Here are the nearest available slots:</p>
                      <div className="space-y-2">
                        {suggestedSlots.map((s, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => {
                              setDate(s.date);
                              setTime(s.slot.start_time);
                            }}
                          >
                            <Calendar className="mr-2 h-3 w-3" />
                            {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {s.slot.start_time} to {s.slot.end_time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {date && availableSlots.length > 0 && (
                    <div>
                      <Label>Available Time Slots</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={time === slot.start_time ? "default" : "outline"}
                            size="sm"
                            className={time === slot.start_time ? "bg-accent text-accent-foreground" : ""}
                            onClick={() => setTime(slot.start_time)}
                          >
                            <Clock className="mr-1 h-3 w-3" /> {slot.start_time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableSlots.length === 0 && !loadingSlots && date && suggestedSlots.length === 0 && (
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                  )}

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
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4 space-y-3">
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
                    {idData && !idData.error && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ID Verified</span>
                        <span className="font-medium flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" /> {idData.id_type}</span>
                      </div>
                    )}
                    {notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        <span>{notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Progressive signup for guests */}
                  {!user && (
                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-accent" />
                        Create your account to confirm
                      </p>
                      <div>
                        <Label>Full Name</Label>
                        <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your full name" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="your@email.com" />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={guestPassword} onChange={(e) => setGuestPassword(e.target.value)} placeholder="Create a password" minLength={6} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
                      </p>
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
