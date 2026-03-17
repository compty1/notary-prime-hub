import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
import { MapPin, Monitor, Calendar, FileText, CheckCircle, ChevronLeft, ChevronRight, Shield, Clock, Camera, Loader2, Sparkles, AlertTriangle, LocateFixed, DollarSign } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

type Step = 1 | 2 | 3 | 4;
type NotarizationType = "in_person" | "ron";

const BOOKING_STORAGE_KEY = "pending_booking_data";

// Fallback service types if DB query fails
const fallbackServiceTypes = [
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [notarizationType, setNotarizationType] = useState<NotarizationType>("in_person");
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [rebookingId, setRebookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Address fields for in-person
  const [clientAddress, setClientAddress] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("OH");
  const [clientZip, setClientZip] = useState("");
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  // Get user's location on mount for autocomplete biasing
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  // Progressive signup fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  // Smart scheduling
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

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

  // Pricing
  const [pricingSettings, setPricingSettings] = useState<Record<string, string>>({});
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // Dynamic services from DB
  const [serviceTypes, setServiceTypes] = useState<string[]>(fallbackServiceTypes);
  const [serviceDescriptions, setServiceDescriptions] = useState<Record<string, string>>({});
  const [serviceCategories, setServiceCategories] = useState<Record<string, string>>({});

  const NOTARIZATION_CATEGORIES = ["notarization", "authentication"];
  const requiresNotarizationType = (svcName: string) => {
    const cat = serviceCategories[svcName];
    return !cat || NOTARIZATION_CATEGORIES.includes(cat);
  };

  // Dynamic page title
  useEffect(() => {
    document.title = "Book Appointment — Shane Goble Notary";
    return () => { document.title = "Shane Goble Notary — Ohio Notary Public | In-Person & RON"; };
  }, []);

  // Load pricing settings + dynamic services
  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value").then(({ data }) => {
      if (data) {
        const settings: Record<string, string> = {};
        data.forEach((s: any) => { settings[s.setting_key] = s.setting_value; });
        setPricingSettings(settings);
      }
    });
    supabase.from("services").select("name, short_description, category").eq("is_active", true).order("display_order").then(({ data }) => {
      if (data && data.length > 0) {
        setServiceTypes(data.map((s: any) => s.name));
        const descs: Record<string, string> = {};
        const cats: Record<string, string> = {};
        data.forEach((s: any) => { 
          if (s.short_description) descs[s.name] = s.short_description;
          cats[s.name] = s.category;
        });
        setServiceDescriptions(descs);
        setServiceCategories(cats);
      }
    });
  }, []);

  // Calculate estimated price
  useEffect(() => {
    if (!pricingSettings.base_fee_per_signature) return;
    const baseFee = parseFloat(pricingSettings.base_fee_per_signature || "5") * documentCount;
    let total = baseFee;

    if (notarizationType === "ron") {
      total += parseFloat(pricingSettings.ron_platform_fee || "25");
      total += parseFloat(pricingSettings.kba_fee || "15");
    } else if (notarizationType === "in_person") {
      const minTravel = parseFloat(pricingSettings.travel_fee_minimum || "25");
      total += minTravel;
    }
    setEstimatedPrice(total);
  }, [notarizationType, documentCount, pricingSettings]);

  // Load profile for returning clients
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data);
          // Auto-fill address from profile
          if (data.address) setClientAddress(data.address);
          if (data.city) setClientCity(data.city);
          if (data.state) setClientState(data.state);
          if (data.zip) setClientZip(data.zip);
        }
      });
      supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }).limit(5).then(({ data }) => {
        if (data) setPastAppointments(data);
      });

      // Check for pending booking from progressive signup
      const pendingBooking = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          localStorage.removeItem(BOOKING_STORAGE_KEY);
          // Restore booking data and auto-submit
          setNotarizationType(booking.notarizationType);
          setServiceType(booking.serviceType);
          setDate(booking.date);
          setTime(booking.time);
          setLocation(booking.location || "");
          setNotes(booking.notes || "");
          setDocumentCount(booking.documentCount || 1);
          setClientAddress(booking.clientAddress || "");
          setClientCity(booking.clientCity || "");
          setClientState(booking.clientState || "OH");
          setClientZip(booking.clientZip || "");
          // Auto-submit after restoring
          setTimeout(() => {
            submitBooking(user.id, booking);
          }, 500);
        } catch {
          localStorage.removeItem(BOOKING_STORAGE_KEY);
        }
      }
    }
  }, [user]);

  // Handle rebook URL parameter
  useEffect(() => {
    const rebookId = searchParams.get("rebook");
    if (rebookId && user) {
      supabase.from("appointments").select("*").eq("id", rebookId).single().then(({ data }) => {
        if (data) handleRebook(data);
      });
    }
    // Handle pre-selected type from landing page
    const preType = searchParams.get("type");
    if (preType === "ron" || preType === "in_person") {
      setNotarizationType(preType);
    }
    // Handle pre-selected service from ServiceDetail or FeeCalculator
    const preService = searchParams.get("service");
    if (preService && serviceTypes.includes(preService)) {
      setServiceType(preService);
    }
    // Handle estimate from FeeCalculator
    const preEstimate = searchParams.get("estimate");
    if (preEstimate) {
      setEstimatedPrice(parseFloat(preEstimate));
    }
    const preDocs = searchParams.get("docs");
    if (preDocs) {
      setDocumentCount(parseInt(preDocs) || 1);
    }
  }, [searchParams, user, serviceTypes]);

  // Fetch available time slots when date changes + check for double bookings + specific_date overrides
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    const selectedDate = new Date(date + "T00:00:00");
    const dayOfWeek = selectedDate.getDay();

    Promise.all([
      supabase.from("time_slots").select("*").eq("day_of_week", dayOfWeek).eq("is_available", true),
      supabase.from("time_slots").select("*").eq("specific_date", date),
      supabase.from("appointments").select("scheduled_time").eq("scheduled_date", date).neq("status", "cancelled").neq("status", "no_show"),
      // Check max appointments per day
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", date).neq("status", "cancelled").neq("status", "no_show"),
    ]).then(([slotsRes, specificRes, bookingsRes, countRes]) => {
      const booked = (bookingsRes.data || []).map((b: any) => b.scheduled_time);
      setBookedTimes(booked);

      // If specific_date overrides exist, use those instead of day_of_week slots
      const specificSlots = specificRes.data || [];
      const daySlots = slotsRes.data || [];
      const baseSlots = specificSlots.length > 0 ? specificSlots : daySlots;

      // Check if day is fully booked (max_appointments_per_day)
      const maxPerDay = parseInt(pricingSettings.max_appointments_per_day || "0");
      const currentCount = countRes.count || 0;
      const dayFull = maxPerDay > 0 && currentCount >= maxPerDay;

      if (dayFull) {
        setAvailableSlots([]);
        findNearestSlots(date);
      } else if (baseSlots.length > 0) {
        // Filter available slots and remove already-booked times
        const available = baseSlots.filter((slot: any) => slot.is_available && !booked.includes(slot.start_time));
        setAvailableSlots(available);
        setSuggestedSlots([]);
      } else {
        setAvailableSlots([]);
        findNearestSlots(date);
      }
      setLoadingSlots(false);
    });
  }, [date, pricingSettings]);

  const findNearestSlots = async (selectedDate: string) => {
    const { data: allSlots } = await supabase.from("time_slots").select("*").eq("is_available", true);
    if (!allSlots || allSlots.length === 0) return;

    const selected = new Date(selectedDate + "T00:00:00");
    const now = new Date();
    const suggestions: { date: string; slot: any }[] = [];

    for (let offset = 1; offset <= 14 && suggestions.length < 3; offset++) {
      for (const dir of [1, -1]) {
        const checkDate = new Date(selected);
        checkDate.setDate(checkDate.getDate() + offset * dir);
        // Skip dates in the past (compare by full day)
        if (checkDate.toISOString().split("T")[0] < now.toISOString().split("T")[0]) continue;
        const daySlots = allSlots.filter((s: any) => s.day_of_week === checkDate.getDay());
        for (const slot of daySlots) {
          if (suggestions.length < 3) {
            suggestions.push({ date: checkDate.toISOString().split("T")[0], slot });
          }
        }
      }
    }
    setSuggestedSlots(suggestions);
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Geolocation is not available in this browser.", variant: "destructive" });
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
            headers: { "User-Agent": "ShaneGobleNotary/1.0" },
          });
          const data = await resp.json();
          if (data.address) {
            const addr = data.address;
            setClientAddress(`${addr.house_number || ""} ${addr.road || ""}`.trim());
            setClientCity(addr.city || addr.town || addr.village || "");
            setClientState(addr.state ? getStateAbbr(addr.state) : "OH");
            setClientZip(addr.postcode || "");
            setLocation(`${addr.house_number || ""} ${addr.road || ""}, ${addr.city || addr.town || ""}, ${addr.state || ""}`.trim());
            toast({ title: "Location found", description: `${addr.city || addr.town || ""}, ${addr.state || ""}` });
          }
        } catch {
          toast({ title: "Location error", description: "Could not determine your address.", variant: "destructive" });
        }
        setLocatingUser(false);
      },
      () => {
        toast({ title: "Location denied", description: "Please enter your address manually.", variant: "destructive" });
        setLocatingUser(false);
      },
      { timeout: 10000 }
    );
  };

  const getStateAbbr = (state: string) => {
    const map: Record<string, string> = { "Ohio": "OH", "Indiana": "IN", "Kentucky": "KY", "West Virginia": "WV", "Pennsylvania": "PA", "Michigan": "MI" };
    return map[state] || state.substring(0, 2).toUpperCase();
  };

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 10MB.", variant: "destructive" });
      return;
    }

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

    // File validation
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file under 20MB.", variant: "destructive" });
      return;
    }
    if (file.type === "application/pdf") {
      toast({ title: "PDF detected", description: "For best results, upload an image (photo/screenshot) of your document.", variant: "default" });
    }

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
          if (data.document_type) {
            const mapped: Record<string, string[]> = {
              "Real Estate": ["Real Estate Documents", "Deed", "Mortgage"],
              "Legal": ["Affidavits & Sworn Statements", "Power of Attorney", "Legal"],
              "Estate Planning": ["Estate Planning Documents", "Will", "Trust"],
              "Business": ["Business Documents", "Corporate", "LLC"],
              "Personal": ["I-9 Employment Verification", "Other"],
            };
            const matchedCategory = mapped[data.document_type];
            if (matchedCategory && !serviceType) {
              // Find best match from available service types
              const bestMatch = matchedCategory.find((m) => serviceTypes.some((s) => s.toLowerCase().includes(m.toLowerCase())));
              if (bestMatch) {
                const exact = serviceTypes.find((s) => s.toLowerCase().includes(bestMatch.toLowerCase()));
                if (exact) setServiceType(exact);
              } else {
                setServiceType(matchedCategory[0]);
              }
            }
          }
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
    setRebookingId(appt.id);
    setStep(3);
    toast({ title: "Details pre-filled", description: "Pick a new date and time to reschedule." });
  };

  const submitBooking = async (userId: string, bookingData?: any) => {
    const data = bookingData || {
      notarizationType,
      serviceType,
      date,
      time,
      location,
      notes,
      documentCount,
      clientAddress,
      clientCity,
      clientState,
      clientZip,
    };

    setSubmitting(true);
    const fullNotes = [
      data.notes || notes,
      (data.documentCount || documentCount) > 1 ? `[Batch: ${data.documentCount || documentCount} documents]` : "",
      docAnalysis ? `[AI Detected: ${docAnalysis.document_name} — ${docAnalysis.notarization_method}]` : "",
      idData ? `[ID Pre-scanned: ${idData.id_type} — ${idData.full_name}]` : "",
    ].filter(Boolean).join("\n");

    const fullAddress = data.clientAddress 
      ? `${data.clientAddress}, ${data.clientCity}, ${data.clientState} ${data.clientZip}`.trim()
      : (data.location || location);

    // Check daily appointment cap
    const maxPerDay = parseInt(pricingSettings.max_appointments_per_day || "0");
    if (maxPerDay > 0) {
      const bookDate = data.date || date;
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("scheduled_date", bookDate)
        .neq("status", "cancelled" as any)
        .neq("status", "no_show" as any);
      if (count && count >= maxPerDay) {
        toast({ title: "Day is fully booked", description: `Maximum ${maxPerDay} appointments per day. Please choose another date.`, variant: "destructive" });
        setSubmitting(false);
        return;
      }
    }

    const appointmentPayload = {
      client_id: userId,
      service_type: data.serviceType || serviceType,
      notarization_type: data.notarizationType || notarizationType,
      scheduled_date: data.date || date,
      scheduled_time: data.time || time,
      location: (data.notarizationType || notarizationType) === "in_person" ? fullAddress : "Remote",
      client_address: (data.notarizationType || notarizationType) === "in_person" ? fullAddress : null,
      estimated_price: estimatedPrice,
      notes: fullNotes || null,
    };

    let appointmentResultId: string;

    if (rebookingId) {
      // Reschedule: update existing appointment
      const { error } = await supabase.from("appointments").update({
        ...appointmentPayload,
        status: "scheduled" as any,
      }).eq("id", rebookingId);
      if (error) {
        toast({ title: "Reschedule failed", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      appointmentResultId = rebookingId;
    } else {
      // New booking
      const { data: insertedData, error } = await supabase.from("appointments").insert(appointmentPayload).select("id").single();
      if (error) {
        localStorage.removeItem(BOOKING_STORAGE_KEY);
        toast({ title: "Booking failed", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      appointmentResultId = insertedData.id;
    }

    localStorage.removeItem(BOOKING_STORAGE_KEY);
    // Trigger confirmation email
    try {
      const { error: emailError } = await supabase.functions.invoke("send-appointment-emails", {
        body: { appointmentId: appointmentResultId, emailType: "confirmation" },
      });
      if (emailError) console.error("Confirmation email error:", emailError);
    } catch (emailErr) {
      console.error("Failed to trigger confirmation email:", emailErr);
    }

    // Auto-convert matching lead to "converted" status
    const clientEmail = user?.email;
    if (clientEmail && !rebookingId) {
      try {
        await supabase.from("leads").update({ status: "converted" }).ilike("email", clientEmail).in("status", ["new", "contacted", "qualified"]);
      } catch { /* silent — lead conversion is best-effort */ }
    }

    toast({ title: rebookingId ? "Appointment rescheduled!" : "Appointment booked!", description: "You'll receive a confirmation email shortly." });
    navigate(`/confirmation?id=${appointmentResultId}`);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    // Progressive signup: create account if not logged in
    if (!user) {
      if (!guestEmail || !guestPassword || !guestName) {
        setShowSignup(true);
        toast({ title: "Create account to confirm", description: "Enter your details below to complete booking.", variant: "destructive" });
        return;
      }

      // Save booking data to localStorage before signup
      const bookingData = {
        notarizationType, serviceType, date, time, location, notes, documentCount,
        clientAddress, clientCity, clientState, clientZip,
      };
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingData));

      const { error } = await signUp(guestEmail, guestPassword, guestName);
      if (error) {
        // Try signing in if they already have an account
        const { error: signInErr } = await signIn(guestEmail, guestPassword);
        if (signInErr) {
          localStorage.removeItem(BOOKING_STORAGE_KEY);
          toast({ title: "Account error", description: error.message, variant: "destructive" });
          return;
        }
        // signIn success → user state will update and trigger auto-submit via useEffect
        return;
      }
      toast({ title: "Check your email", description: "We sent a verification link. Your appointment will be saved once you verify and sign in." });
      navigate("/login");
      return;
    }

    await submitBooking(user.id);
  };

  const isNonNotarial = serviceType && !requiresNotarizationType(serviceType);
  const totalSteps = isNonNotarial ? 3 : 4;
  const lastStep = totalSteps as Step;

  const canProceed = () => {
    if (isNonNotarial) {
      // 3-step flow: 1=service, 2=date/time, 3=review
      if (step === 1) return !!serviceType;
      if (step === 2) {
        if (!date || !time) return false;
        if (notarizationType === "in_person" && !clientZip && !location) return false;
        const leadHours = parseInt(pricingSettings.min_booking_lead_hours || "2");
        const bookingDate = new Date(`${date}T${time}`);
        const minDate = new Date(Date.now() + leadHours * 60 * 60 * 1000);
        if (bookingDate < minDate) return false;
        return true;
      }
      return true;
    }
    // 4-step flow: 1=type, 2=service, 3=date/time, 4=review
    if (step === 1) return !!notarizationType;
    if (step === 2) return !!serviceType;
    if (step === 3) {
      if (!date || !time) return false;
      if (notarizationType === "in_person" && !clientZip && !location) return false;
      const leadHours = parseInt(pricingSettings.min_booking_lead_hours || "2");
      const bookingDate = new Date(`${date}T${time}`);
      const minDate = new Date(Date.now() + leadHours * 60 * 60 * 1000);
      if (bookingDate < minDate) return false;
      return true;
    }
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

        {/* Progress - show 3 steps for non-notarial, 4 for notarial */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(serviceType && !requiresNotarizationType(serviceType) ? [1, 2, 3] : [1, 2, 3, 4]).map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step >= s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : (serviceType && !requiresNotarizationType(serviceType) ? s - 1 || 1 : s)}
              </div>
              {i < arr.length - 1 && <div className={`h-0.5 w-8 transition-colors ${step > s ? "bg-accent" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {step === 1 && (serviceType && !requiresNotarizationType(serviceType) ? "Choose Service" : "Select Notarization Type")}
                {step === 2 && (serviceType && !requiresNotarizationType(serviceType) ? "Pick Date & Time" : "Choose Service")}
                {step === 3 && (serviceType && !requiresNotarizationType(serviceType) ? "Review & Confirm" : "Pick Date & Time")}
                {step === 4 && "Review & Confirm"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: For non-notarial services, skip to service selection; for notarial, show type picker */}
              {step === 1 && (serviceType && !requiresNotarizationType(serviceType) ? (
                /* Non-notarial: Step 1 IS service selection (same as original step 2) */
                <div className="space-y-4">
                  <div>
                    <Label>Service Type</Label>
                    <Select value={serviceType} onValueChange={(val) => {
                      setServiceType(val);
                      if (!requiresNotarizationType(val)) {
                        setNotarizationType("in_person");
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                /* Notarial: original Step 1 - type selection */
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setNotarizationType("in_person")}
                    className={`rounded-lg border-2 p-6 text-left transition-all ${
                      notarizationType === "in_person" ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                    }`}
                    aria-label="Select in-person notarization"
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
                    aria-label="Select remote online notarization"
                  >
                    <Monitor className="mb-2 h-8 w-8 text-accent" />
                    <h3 className="font-display text-lg font-semibold">Remote (RON)</h3>
                    <p className="text-sm text-muted-foreground">Secure video call from anywhere</p>
                  </button>
                </div>
              ))}

              {step === 1 && (!serviceType || requiresNotarizationType(serviceType)) && null}

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

                  {serviceType === "Other" && (
                    <div>
                      <Label>Describe your document</Label>
                      <Input
                        placeholder="What type of document do you need notarized?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  )}

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
                      accept="image/*"
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
                       <div className="mt-2 space-y-2 rounded bg-accent/10 p-3 text-xs text-foreground">
                         <div className="flex items-center gap-1 font-medium">
                           <CheckCircle className="h-3 w-3 text-accent" />
                           {docAnalysis.document_name} — {docAnalysis.notarization_method}
                         </div>
                         <div className="text-muted-foreground">
                           <p>Signers: {docAnalysis.signers_required} • Witnesses: {docAnalysis.witnesses_required}</p>
                           {docAnalysis.who_must_be_present?.length > 0 && (
                             <p className="mt-1">Present: {docAnalysis.who_must_be_present.join(", ")}</p>
                           )}
                           {!docAnalysis.ron_eligible && (
                             <p className="mt-1 font-medium text-destructive">⚠ Not eligible for RON</p>
                           )}
                         </div>
                        {docAnalysis.special_requirements?.length > 0 && (
                          <div className="rounded bg-destructive/10 p-2 text-destructive">
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
                       <div className="mt-2 rounded bg-accent/10 p-2 text-xs text-foreground">
                         <CheckCircle className="mr-1 inline h-3 w-3 text-accent" />
                         Verified: {idData.full_name} — {idData.id_type}
                         {idData.is_expired && (
                           <span className="ml-2 text-destructive font-medium">⚠ EXPIRED</span>
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
                     <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                       <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                         <AlertTriangle className="h-4 w-4" /> No availability on this date
                       </p>
                       <p className="mb-3 text-xs text-muted-foreground">Here are the nearest available slots:</p>
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
                            {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {formatTime(s.slot.start_time)} to {formatTime(s.slot.end_time)}
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
                            <Clock className="mr-1 h-3 w-3" /> {formatTime(slot.start_time)}
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

                  {/* In-person location with smart address */}
                  {notarizationType === "in_person" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Meeting Location</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={handleUseLocation}
                          disabled={locatingUser}
                        >
                          {locatingUser ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LocateFixed className="mr-1 h-3 w-3" />}
                          Use My Location
                        </Button>
                      </div>
                      <AddressAutocomplete
                        value={clientAddress}
                        onChange={setClientAddress}
                        userLat={userLat}
                        userLon={userLon}
                        onSelect={(s) => {
                          setClientAddress(s.address);
                          setClientCity(s.city);
                          setClientState(s.state);
                          setClientZip(s.zip);
                          setLocation(s.fullAddress);
                        }}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="City"
                          value={clientCity}
                          onChange={(e) => setClientCity(e.target.value)}
                        />
                        <Input
                          placeholder="State"
                          value={clientState}
                          onChange={(e) => setClientState(e.target.value)}
                          maxLength={2}
                        />
                        <Input
                          placeholder="Zip Code"
                          value={clientZip}
                          onChange={(e) => setClientZip(e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Search for a business, address, or landmark — suggestions appear as you type
                      </p>
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
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{formatTime(time)}</span>
                    </div>
                    {(clientAddress || location) && notarizationType === "in_person" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium text-right max-w-[60%]">
                          {clientAddress ? `${clientAddress}, ${clientCity}, ${clientState} ${clientZip}` : location}
                        </span>
                      </div>
                    )}
                    {idData && !idData.error && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ID Verified</span>
                        <span className="font-medium flex items-center gap-1"><Shield className="h-3 w-3 text-accent" /> {idData.id_type}</span>
                      </div>
                    )}
                    {documentCount > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Documents</span>
                        <span className="font-medium">{documentCount} documents (batch session)</span>
                      </div>
                    )}
                    {docAnalysis && !docAnalysis.error && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Detected</span>
                        <span className="font-medium">{docAnalysis.document_name} ({docAnalysis.notarization_method})</span>
                      </div>
                    )}
                    {notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        <span>{notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  {estimatedPrice !== null && (
                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-accent" />
                        Estimated Pricing
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Notary fee ({documentCount} signature{documentCount > 1 ? "s" : ""})</span>
                          <span>${(parseFloat(pricingSettings.base_fee_per_signature || "5") * documentCount).toFixed(2)}</span>
                        </div>
                        {notarizationType === "in_person" && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Travel fee (est.)</span>
                            <span>${parseFloat(pricingSettings.travel_fee_minimum || "25").toFixed(2)}</span>
                          </div>
                        )}
                        {notarizationType === "ron" && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">RON platform fee</span>
                              <span>${parseFloat(pricingSettings.ron_platform_fee || "25").toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">KBA verification</span>
                              <span>${parseFloat(pricingSettings.kba_fee || "15").toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between border-t border-border pt-1 font-semibold">
                          <span>Estimated Total</span>
                          <span className="text-accent">${estimatedPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Final price may vary based on actual travel distance and document complexity.</p>
                    </div>
                  )}

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
                        <Input type="password" value={guestPassword} onChange={(e) => setGuestPassword(e.target.value)} placeholder="Create a password (min 6 characters)" minLength={6} />
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
