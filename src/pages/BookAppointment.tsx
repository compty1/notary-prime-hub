import { useState, useEffect, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MapPin, Monitor, CheckCircle, ChevronLeft, ChevronRight, Camera, Loader2, Sparkles, AlertTriangle, DollarSign, Info } from "lucide-react";
import { haversineDistance, getAfterHoursFee, DEFAULT_OFFICE_LAT, DEFAULT_OFFICE_LON } from "@/lib/geoUtils";
import { NOTARIAL_ACT_MAP } from "@/lib/serviceConstants";
import { calculatePrice, parseSettings, type PricingBreakdown } from "@/lib/pricingEngine";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageShell } from "@/components/PageShell";
import {
  BookingStep, NotarizationType, BOOKING_STORAGE_KEY, fallbackServiceTypes,
  HAGUE_COUNTRIES, isDigitalOnly, requiresNotarizationType, getStateAbbr, formatTimeSlot,
} from "./booking/bookingConstants";
import BookingIntakeFields from "./booking/BookingIntakeFields";
import BookingScheduleStep from "./booking/BookingScheduleStep";
import BookingReviewStep from "./booking/BookingReviewStep";

export default function BookAppointment() {
  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<BookingStep>(1);
  const [notarizationType, setNotarizationType] = useState<NotarizationType>("in_person");
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [rebookingId, setRebookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [clientAddress, setClientAddress] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("OH");
  const [clientZip, setClientZip] = useState("");
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [idScanning, setIdScanning] = useState(false);
  const [idData, setIdData] = useState<any>(null);
  const [docScanning, setDocScanning] = useState(false);
  const [docAnalysis, setDocAnalysis] = useState<any>(null);
  const [documentCount, setDocumentCount] = useState(1);
  const [customDocCount, setCustomDocCount] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [pricingSettings, setPricingSettings] = useState<Record<string, string>>({});
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const [serviceTypes, setServiceTypes] = useState<string[]>(fallbackServiceTypes);
  const [serviceDescriptions, setServiceDescriptions] = useState<Record<string, string>>({});
  const [serviceCategories, setServiceCategories] = useState<Record<string, string>>({});
  const [serviceDurations, setServiceDurations] = useState<Record<string, number>>({});
  const [serviceRonSupport, setServiceRonSupport] = useState<Record<string, boolean>>({});

  // Waitlist state
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  // Category-specific intake fields
  const [destinationCountry, setDestinationCountry] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("standard");
  const [uscisForm, setUscisForm] = useState("");
  const [caseType, setCaseType] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [titleCompany, setTitleCompany] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [hireStartDate, setHireStartDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [witnessCount, setWitnessCount] = useState("1");
  const [witnessMode, setWitnessMode] = useState<"in_person" | "virtual">("in_person");
  const [witnessDocType, setWitnessDocType] = useState("");
  const [certifiedDocName, setCertifiedDocName] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [copyCount, setCopyCount] = useState("1");
  const [employeeCount, setEmployeeCount] = useState("1");
  const [hrContact, setHrContact] = useState("");
  const [docsPerEmployee, setDocsPerEmployee] = useState("1");
  const [currentTools, setCurrentTools] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [bulkDocTypes, setBulkDocTypes] = useState("");
  const [schedulePreference, setSchedulePreference] = useState("");
  const [scanningMode, setScanningMode] = useState<"digital" | "physical">("digital");
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translationDocType, setTranslationDocType] = useState("");
  const [translationPageCount, setTranslationPageCount] = useState("1");

  // Phase 12: New business logic state
  const [signerCapacity, setSignerCapacity] = useState("individual");
  const [entityName, setEntityName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [facilityContact, setFacilityContact] = useState("");
  const [facilityRoom, setFacilityRoom] = useState("");
  const [signerCount, setSignerCount] = useState(1);
  const [travelDistance, setTravelDistance] = useState<number | null>(null);
  const [afterHoursFee, setAfterHoursFee] = useState(0);
  const [needsApostille, setNeedsApostille] = useState(false);
  const [outsideServiceArea, setOutsideServiceArea] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [additionalSignerEmails, setAdditionalSignerEmails] = useState("");
  const [signerDob, setSignerDob] = useState("");

  // Booking draft persistence (Phase 3.4)
  useEffect(() => {
    if (!user) return;
    const saveDraft = async () => {
      if (!serviceType && !date) return;
      try {
        const draftData = {
          notarizationType, serviceType, date, time, notes, clientAddress,
          clientCity, clientState, clientZip, documentCount, signerCapacity,
          entityName, signerTitle, facilityName, urgencyLevel, destinationCountry,
        };
        const { data: existing } = await supabase.from("booking_drafts").select("id").eq("user_id", user.id).limit(1).single();
        if (existing) {
          await supabase.from("booking_drafts").update({ draft_data: draftData as any, step, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("booking_drafts").insert({ user_id: user.id, draft_data: draftData as any, step });
        }
      } catch (e) { console.error("Draft save error:", e); }
    };
    const timer = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timer);
  }, [user, step, serviceType, date, time, notes, clientAddress, notarizationType]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); }, () => {}, { timeout: 5000 });
    }
  }, []);
  usePageMeta({ title: "Book a Notary Appointment", description: "Schedule an in-person or remote online notarization appointment with an Ohio-commissioned notary. Same-day availability in Columbus, OH." });

  // Bug 33: Use sessionStorage for pending bookings (more secure on shared computers)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed._savedAt && Date.now() - parsed._savedAt > 24 * 60 * 60 * 1000) {
          sessionStorage.removeItem(BOOKING_STORAGE_KEY);
        }
      }
    } catch (e) { console.error("Session restore error:", e); sessionStorage.removeItem(BOOKING_STORAGE_KEY); }
  }, []);

  useEffect(() => {
    const hasData = serviceType || date || time || notes || clientAddress;
    const handler = (e: BeforeUnloadEvent) => { if (hasData) e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [serviceType, date, time, notes, step]);

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value").limit(100).then(({ data }) => {
      if (data) { const s: Record<string, string> = {}; data.forEach((r: any) => { s[r.setting_key] = r.setting_value; }); setPricingSettings(s); }
    });
    const NON_BOOKABLE = ["admin_support","content_creation","research","customer_service","technical_support","ux_testing"];
    supabase.from("services").select("name, short_description, category, duration_minutes, is_popular, supports_ron").eq("is_active", true).order("display_order").limit(100).then(({ data }) => {
      if (data && data.length > 0) {
        const bookable = data.filter((s: any) => !NON_BOOKABLE.includes(s.category));
        // Sort popular services to top (ID 5)
        const sorted = [...bookable].sort((a: any, b: any) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
        setServiceTypes([...new Set(sorted.map((s: any) => s.name))]);
        const descs: Record<string, string> = {}, cats: Record<string, string> = {}, durs: Record<string, number> = {}, ronMap: Record<string, boolean> = {};
        bookable.forEach((s: any) => {
          if (s.short_description) descs[s.name] = s.short_description;
          cats[s.name] = s.category;
          if (s.duration_minutes) durs[s.name] = s.duration_minutes;
          ronMap[s.name] = s.supports_ron !== false; // default true if not set
        });
        setServiceDescriptions(descs);
        setServiceCategories(cats);
        setServiceDurations(durs);
        setServiceRonSupport(ronMap);
        // ID 1: Validate URL param against NON_BOOKABLE before pre-filling
        const preService = new URLSearchParams(window.location.search).get("service");
        if (preService) {
          const match = bookable.find((s: any) => s.name.toLowerCase() === preService.toLowerCase());
          if (match && !NON_BOOKABLE.includes(match.category)) setServiceType(match.name);
        }
      }
    });
  }, []);

  // Centralized pricing via pricingEngine
  const pricingBreakdown = useMemo<PricingBreakdown | null>(() => {
    if (!pricingSettings.base_fee_per_signature) return null;
    const settings = parseSettings(pricingSettings);
    return calculatePrice({
      notarizationType,
      documentCount,
      signerCount,
      travelMiles: notarizationType === "in_person" ? (travelDistance ?? undefined) : undefined,
      isRush: urgencyLevel === "rush" || urgencyLevel === "same_day",
      afterHoursAmount: afterHoursFee,
      witnessCount: parseInt(witnessCount || "0"),
      needsApostille,
    }, settings);
  }, [notarizationType, documentCount, signerCount, pricingSettings, witnessCount, travelDistance, afterHoursFee, urgencyLevel, needsApostille]);

  useEffect(() => {
    if (pricingBreakdown) setEstimatedPrice(pricingBreakdown.total);
  }, [pricingBreakdown]);

  // Service area validation + travel distance calculation
  useEffect(() => {
    if (notarizationType !== "in_person" || !userLat || !userLon) {
      setTravelDistance(null);
      setOutsideServiceArea(false);
      return;
    }
    const officeLat = parseFloat(pricingSettings.office_latitude || String(DEFAULT_OFFICE_LAT));
    const officeLon = parseFloat(pricingSettings.office_longitude || String(DEFAULT_OFFICE_LON));
    const radiusMiles = parseFloat(pricingSettings.travel_radius_miles || "50");
    const dist = haversineDistance(officeLat, officeLon, userLat, userLon);
    setTravelDistance(Math.round(dist * 10) / 10);
    setOutsideServiceArea(dist > radiusMiles);
  }, [userLat, userLon, notarizationType, pricingSettings]);

  // After-hours fee calculation
  useEffect(() => {
    if (!time) { setAfterHoursFee(0); return; }
    const baseFee = parseFloat(pricingSettings.after_hours_fee || "25");
    setAfterHoursFee(getAfterHoursFee(time, baseFee));
  }, [time, pricingSettings]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) { setProfile(data); if (data.address) setClientAddress(data.address); if (data.city) setClientCity(data.city); if (data.state) setClientState(data.state); if (data.zip) setClientZip(data.zip); }
      });
      supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }).limit(5).then(({ data }) => { if (data) setPastAppointments(data); });
      const pendingBooking = sessionStorage.getItem(BOOKING_STORAGE_KEY);
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          sessionStorage.removeItem(BOOKING_STORAGE_KEY);
          setNotarizationType(booking.notarizationType); setServiceType(booking.serviceType);
          setDate(booking.date); setTime(booking.time); setLocation(booking.location || ""); setNotes(booking.notes || "");
          setDocumentCount(booking.documentCount || 1); setClientAddress(booking.clientAddress || "");
          setClientCity(booking.clientCity || ""); setClientState(booking.clientState || "OH"); setClientZip(booking.clientZip || "");
          // Wait for session to be fully ready before submitting
          const waitForSession = async () => {
            for (let i = 0; i < 10; i++) {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) { await submitBooking(session.user.id, booking); return; }
              await new Promise(r => setTimeout(r, 500));
            }
            toast({ title: "Session not ready", description: "Please try again.", variant: "destructive" });
          };
          waitForSession();
        } catch (e) { console.error("Booking restore error:", e); sessionStorage.removeItem(BOOKING_STORAGE_KEY); }
      }
    }
  }, [user]);

  useEffect(() => {
    const rebookId = searchParams.get("rebook");
    if (rebookId && user) { supabase.from("appointments").select("*").eq("id", rebookId).single().then(({ data }) => { if (data) handleRebook(data); }); }
    const preType = searchParams.get("type");
    if (preType === "ron" || preType === "in_person") setNotarizationType(preType);
    const preEstimate = searchParams.get("estimate");
    if (preEstimate) setEstimatedPrice(parseFloat(preEstimate));
    const preDocs = searchParams.get("docs");
    if (preDocs) setDocumentCount(parseInt(preDocs) || 1);
  }, [searchParams, user]);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    const selectedDate = new Date(date + "T00:00:00");
    const dayOfWeek = selectedDate.getDay();
    Promise.all([
      supabase.from("time_slots").select("*").eq("day_of_week", dayOfWeek).eq("is_available", true),
      supabase.from("time_slots").select("*").eq("specific_date", date),
      supabase.from("appointments").select("scheduled_time").eq("scheduled_date", date).neq("status", "cancelled").neq("status", "no_show"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", date).neq("status", "cancelled").neq("status", "no_show"),
    ]).then(([slotsRes, specificRes, bookingsRes, countRes]) => {
      const booked = (bookingsRes.data || []).map((b: any) => b.scheduled_time);
      setBookedTimes(booked);
      const specificSlots = specificRes.data || [], daySlots = slotsRes.data || [];
      const baseSlots = specificSlots.length > 0 ? specificSlots : daySlots;
      const maxPerDay = parseInt(pricingSettings.max_appointments_per_day || "0");
      const currentCount = countRes.count || 0;
      if (maxPerDay > 0 && currentCount >= maxPerDay) { setAvailableSlots([]); findNearestSlots(date); }
      else if (baseSlots.length > 0) { setAvailableSlots(baseSlots.filter((s: any) => s.is_available && !booked.includes(s.start_time))); setSuggestedSlots([]); }
      else { setAvailableSlots([]); findNearestSlots(date); }
      setLoadingSlots(false);
    });
  }, [date, pricingSettings]);

  const findNearestSlots = async (selectedDate: string) => {
    const { data: allSlots } = await supabase.from("time_slots").select("*").eq("is_available", true);
    if (!allSlots || allSlots.length === 0) return;
    const selected = new Date(selectedDate + "T00:00:00"), now = new Date();
    const suggestions: { date: string; slot: any }[] = [];
    for (let offset = 1; offset <= 14 && suggestions.length < 3; offset++) {
      for (const dir of [1, -1]) {
        const checkDate = new Date(selected); checkDate.setDate(checkDate.getDate() + offset * dir);
        if (checkDate.toISOString().split("T")[0] < now.toISOString().split("T")[0]) continue;
        const daySlots = allSlots.filter((s: any) => s.day_of_week === checkDate.getDay());
        for (const slot of daySlots) { if (suggestions.length < 3) suggestions.push({ date: checkDate.toISOString().split("T")[0], slot }); }
      }
    }
    setSuggestedSlots(suggestions);
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) { toast({ title: "Not supported", description: "Geolocation is not available.", variant: "destructive" }); return; }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, { headers: { "User-Agent": "NotarDex/1.0" } });
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
        } catch { toast({ title: "Location error", description: "Could not determine your address.", variant: "destructive" }); }
        setLocatingUser(false);
      },
      () => { toast({ title: "Location denied", description: "Please enter your address manually.", variant: "destructive" }); setLocatingUser(false); },
      { timeout: 10000 }
    );
  };

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "File too large", description: "Please upload an image under 10MB.", variant: "destructive" }); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) { toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, or WebP image.", variant: "destructive" }); return; }
    setIdScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const { data, error } = await supabase.functions.invoke("scan-id", {
          body: { imageBase64: base64 },
        });
        if (error) throw error;
        if (data.error) toast({ title: "ID scan issue", description: data.error, variant: "destructive" });
        else { setIdData(data); if (!guestName && data.full_name) setGuestName(data.full_name); if (data.is_expired) toast({ title: "Expired ID Detected", description: "This ID appears to be expired.", variant: "destructive" }); else toast({ title: "ID scanned successfully", description: `${data.id_type} — ${data.full_name}` }); }
      } catch { toast({ title: "Scan failed", variant: "destructive" }); }
      setIdScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDocScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast({ title: "File too large", variant: "destructive" }); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) { toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, WebP, or PDF.", variant: "destructive" }); return; }
    setDocScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const { data, error } = await supabase.functions.invoke("detect-document", {
          body: { imageBase64: base64, fileName: file.name },
        });
        if (error) throw error;
        if (data.error) toast({ title: "Document analysis issue", description: data.error, variant: "destructive" });
        else {
          setDocAnalysis(data);
          if (data.document_type && !serviceType) {
            const mapped: Record<string, string[]> = { "Real Estate": ["Real Estate Documents"], "Legal": ["Affidavits & Sworn Statements", "Power of Attorney"], "Estate Planning": ["Estate Planning Documents"], "Business": ["Business Documents"], "Personal": ["I-9 Employment Verification", "Other"] };
            const mc = mapped[data.document_type];
            if (mc) { const exact = mc.find(m => serviceTypes.some(s => s.toLowerCase().includes(m.toLowerCase()))); if (exact) { const match = serviceTypes.find(s => s.toLowerCase().includes(exact.toLowerCase())); if (match) setServiceType(match); } }
          }
          if (data.ron_eligible === false && notarizationType === "ron") toast({ title: "RON not recommended", description: "This document may not be eligible for RON.", variant: "destructive" });
          toast({ title: "Document analyzed", description: `${data.document_name} — ${data.notarization_method}` });
        }
      } catch { toast({ title: "Analysis failed", variant: "destructive" }); }
      setDocScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRebook = (appt: any) => {
    setNotarizationType(appt.notarization_type); setServiceType(appt.service_type);
    if (appt.location && appt.location !== "Remote") setLocation(appt.location);
    setRebookingId(appt.id); setDate(""); setTime(""); setAvailableSlots([]); setSuggestedSlots([]);
    // For notarial services step 3 is Schedule, for non-notarial step 2 is Schedule
    const isNon = !requiresNotarizationType(appt.service_type, serviceCategories);
    setStep(isNon ? 2 as BookingStep : 3 as BookingStep);
    toast({ title: "Details pre-filled", description: "Pick a new date and time to reschedule." });
  };

  const buildIntakeNotes = () => {
    const parts: string[] = [];
    const cat = serviceCategories[serviceType]; const svcLower = serviceType.toLowerCase();
    if (cat === "authentication" || cat === "notarization") {
      if (destinationCountry) parts.push(`[Destination: ${destinationCountry}${HAGUE_COUNTRIES.includes(destinationCountry) ? " (Hague)" : " (Non-Hague)"}]`);
      if (urgencyLevel !== "standard") parts.push(`[Urgency: ${urgencyLevel}]`);
    }
    if (cat === "consulting") { if (uscisForm) parts.push(`[USCIS Form: ${uscisForm}]`); if (caseType) parts.push(`[Case Type: ${caseType}]`); }
    if (svcLower.includes("real estate") || svcLower.includes("closing")) { if (propertyAddress) parts.push(`[Property: ${propertyAddress}]`); if (titleCompany) parts.push(`[Title Co: ${titleCompany}]`); }
    if (cat === "verification" || svcLower.includes("i-9")) { if (employerName) parts.push(`[Employer: ${employerName}]`); if (hireStartDate) parts.push(`[Start Date: ${hireStartDate}]`); }
    if (cat === "business" && companyName) parts.push(`[Company: ${companyName}]`);
    if (svcLower.includes("translation")) { if (sourceLanguage) parts.push(`[Source Language: ${sourceLanguage}]`); if (targetLanguage) parts.push(`[Target Language: ${targetLanguage}]`); if (translationDocType) parts.push(`[Doc Type: ${translationDocType}]`); if (translationPageCount) parts.push(`[Pages: ${translationPageCount}]`); }
    if (svcLower.includes("witness")) { parts.push(`[Witnesses Needed: ${witnessCount}]`); parts.push(`[Witness Mode: ${witnessMode}]`); if (witnessDocType) parts.push(`[Witness Doc Type: ${witnessDocType}]`); }
    if (svcLower.includes("certified copy")) { if (certifiedDocName) parts.push(`[Certified Doc: ${certifiedDocName}]`); if (issuingAuthority) parts.push(`[Issuing Authority: ${issuingAuthority}]`); parts.push(`[Copies: ${copyCount}]`); }
    if (svcLower.includes("employment onboarding") || svcLower.includes("onboarding support")) { parts.push(`[Employees: ${employeeCount}]`); parts.push(`[Docs/Employee: ${docsPerEmployee}]`); if (hrContact) parts.push(`[HR Contact: ${hrContact}]`); }
    if (svcLower.includes("custom workflow")) { if (currentTools) parts.push(`[Current Tools: ${currentTools}]`); if (teamSize) parts.push(`[Team Size: ${teamSize}]`); if (budgetRange) parts.push(`[Budget: ${budgetRange}]`); }
    if (svcLower.includes("bulk")) { if (monthlyVolume) parts.push(`[Monthly Volume: ${monthlyVolume}]`); if (bulkDocTypes) parts.push(`[Doc Types: ${bulkDocTypes}]`); if (schedulePreference) parts.push(`[Schedule: ${schedulePreference}]`); }
    if (svcLower.includes("scanning") || svcLower.includes("digitization")) parts.push(`[Scanning Mode: ${scanningMode}]`);
    // Phase 12 fields
    if (signerCapacity !== "individual") parts.push(`[Signer Capacity: ${signerCapacity}]`);
    if (entityName) parts.push(`[Entity: ${entityName}]`);
    if (signerTitle) parts.push(`[Signer Title: ${signerTitle}]`);
    if (facilityName) parts.push(`[Facility: ${facilityName}]`);
    if (facilityContact) parts.push(`[Facility Contact: ${facilityContact}]`);
    if (facilityRoom) parts.push(`[Room: ${facilityRoom}]`);
    if (signerCount > 1) parts.push(`[Signers: ${signerCount}]`);
    return parts.join("\n");
  };

  const submitBooking = async (userId: string, bookingData?: any) => {
    const data = bookingData || { notarizationType, serviceType, date, time, location, notes, documentCount, clientAddress, clientCity, clientState, clientZip };
    setSubmitting(true);
    const intakeNotes = buildIntakeNotes();
    const fullNotes = [data.notes || notes, intakeNotes, (data.documentCount || documentCount) > 1 ? `[Batch: ${data.documentCount || documentCount} documents]` : "", docAnalysis ? `[AI Detected: ${docAnalysis.document_name} — ${docAnalysis.notarization_method}]` : "", idData ? `[ID Pre-scanned: ${idData.id_type} — ${idData.full_name}]` : ""].filter(Boolean).join("\n");
    const fullAddress = data.clientAddress ? `${data.clientAddress}, ${data.clientCity}, ${data.clientState} ${data.clientZip}`.trim() : (data.location || location);
    const maxPerDay = parseInt(pricingSettings.max_appointments_per_day || "0");
    if (maxPerDay > 0) {
      const { count } = await supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", data.date || date).neq("status", "cancelled" as any).neq("status", "no_show" as any);
      if (count && count >= maxPerDay) { toast({ title: "Day is fully booked", variant: "destructive" }); setSubmitting(false); return; }
    }
    // Detect notarial act type from service name
    const svcLower = (data.serviceType || serviceType).toLowerCase();
    let notarialActType: string | null = null;
    for (const [keyword, actType] of Object.entries(NOTARIAL_ACT_MAP)) {
      if (svcLower.includes(keyword)) { notarialActType = actType; break; }
    }
    const payload = {
      client_id: userId,
      service_type: data.serviceType || serviceType,
      notarization_type: data.notarizationType || notarizationType,
      scheduled_date: data.date || date,
      scheduled_time: data.time || time,
      location: (data.notarizationType || notarizationType) === "in_person" ? fullAddress : "Remote",
      client_address: (data.notarizationType || notarizationType) === "in_person" ? fullAddress : null,
      estimated_price: estimatedPrice,
      notes: fullNotes || null,
      // Phase 12 fields
      signing_capacity: signerCapacity !== "individual" ? signerCapacity : "individual",
      entity_name: entityName || null,
      signer_title: signerTitle || null,
      facility_name: facilityName || null,
      facility_contact: facilityContact || null,
      facility_room: facilityRoom || null,
      signer_count: signerCount,
      after_hours_fee: afterHoursFee > 0 ? afterHoursFee : 0,
      travel_fee_estimate: travelDistance !== null && travelDistance >= 5
        ? Math.max(parseFloat(pricingSettings.travel_fee_minimum || "25"), travelDistance * parseFloat(pricingSettings.travel_fee_per_mile || "0.655"))
        : 0,
      travel_distance_miles: travelDistance,
    };
    let appointmentResultId: string;
    if (rebookingId) {
      const { error } = await supabase.from("appointments").update({ ...payload, status: "scheduled" as any }).eq("id", rebookingId);
      if (error) { toast({ title: "Reschedule failed", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
      appointmentResultId = rebookingId;
    } else {
      const { data: insertedData, error } = await supabase.from("appointments").insert(payload).select("id").single();
      if (error) { sessionStorage.removeItem(BOOKING_STORAGE_KEY); toast({ title: "Booking failed", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
      appointmentResultId = insertedData.id;
    }
    sessionStorage.removeItem(BOOKING_STORAGE_KEY);
    try { await supabase.functions.invoke("send-appointment-emails", { body: { appointmentId: appointmentResultId, emailType: "confirmation" } }); } catch (e) { console.error("Email error:", e); }
    if (user?.email && !rebookingId) { try { await supabase.from("leads").update({ status: "converted" }).ilike("email", user.email).in("status", ["new", "contacted", "qualified"]); } catch (e) { console.error("Lead conversion error:", e); } }
    toast({ title: rebookingId ? "Appointment rescheduled!" : "Appointment booked!", description: "You'll receive a confirmation email shortly." });
    navigate(`/confirmation?id=${appointmentResultId}`);
    setSubmitting(false);
  };

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    // Validate date is not in the past
    if (date) {
      const today = new Date().toISOString().split("T")[0];
      if (date < today) errors.date = "Please select a future date.";
    }
    if (!date) errors.date = "Date is required.";
    if (!time) errors.time = "Time is required.";
    // Validate document count
    if (documentCount < 1) errors.documentCount = "At least 1 document is required.";

    // ID 16: Minimum age validation (18+ for signer)
    if (signerDob) {
      const dob = new Date(signerDob);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) errors.signerDob = "Signer must be at least 18 years old. Minor signers require a legal guardian.";
    }

    // ID 17: Ohio vital records blocking
    if (serviceType) {
      const { checkDocumentEligibility } = await import("@/lib/ohioDocumentEligibility");
      const eligibility = checkDocumentEligibility(serviceType);
      if (!eligibility.eligible) {
        errors.serviceType = eligibility.reason || "This document cannot be notarized under Ohio law.";
        toast({ title: "Document Not Eligible", description: eligibility.reason, variant: "destructive" });
      }
    }

    // ID 18: Validate additional signer emails
    if (additionalSignerEmails.trim()) {
      const emails = additionalSignerEmails.split(/[,;\s]+/).filter(Boolean);
      const invalidEmails = emails.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
      if (invalidEmails.length > 0) errors.additionalSignerEmails = `Invalid email(s): ${invalidEmails.join(", ")}`;
    }

    // ID 19: Entity name required for representative capacity
    if (signerCapacity !== "individual" && !entityName.trim()) {
      errors.entityName = "Entity name is required when signing in a representative capacity.";
    }

    if (!user) {
      if (!guestName.trim()) errors.guestName = "Full name is required.";
      if (!guestEmail.trim()) errors.guestEmail = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.guestEmail = "Please enter a valid email address.";
      if (!guestPassword || guestPassword.length < 8) errors.guestPassword = "Password must be at least 8 characters.";
      else if (!/[A-Z]/.test(guestPassword) || !/[0-9]/.test(guestPassword)) errors.guestPassword = "Include at least one uppercase letter and one number.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }
    setValidationErrors({});

    // ID 34: Show confirmation dialog before final submit
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);

    if (!user) {
      sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify({ notarizationType, serviceType, date, time, location, notes, documentCount, clientAddress, clientCity, clientState, clientZip, signerCapacity, entityName, signerTitle, facilityName, facilityContact, facilityRoom, signerCount, _savedAt: Date.now() }));
      const { error } = await signUp(guestEmail, guestPassword, guestName);
      if (error) { const { error: signInErr } = await signIn(guestEmail, guestPassword); if (signInErr) { sessionStorage.removeItem(BOOKING_STORAGE_KEY); toast({ title: "Account error", description: error.message, variant: "destructive" }); } return; }
      toast({ title: "Check your email", description: "We sent a verification link." }); navigate("/login"); return;
    }
    await submitBooking(user.id);
  };

  const isConsultation = serviceType?.toLowerCase() === "consultation" || serviceCategories[serviceType] === "consulting";
  const isNonNotarial = serviceType && !requiresNotarizationType(serviceType, serviceCategories);
  const isSkipTypeStep = isNonNotarial || isConsultation;
  const totalSteps = isSkipTypeStep ? 3 : 4;
  const lastStep = totalSteps as BookingStep;

  const getLeadTimeWarning = () => {
    if (!date || !time) return null;
    const leadHours = parseInt(pricingSettings.min_booking_lead_hours || "2");
    const bookingDate = new Date(`${date}T${time}`);
    if (bookingDate < new Date(Date.now() + leadHours * 60 * 60 * 1000)) return `Please select a time at least ${leadHours} hours from now.`;
    return null;
  };
  const leadTimeWarning = getLeadTimeWarning();

  const canProceed = () => {
    if (isSkipTypeStep) {
      if (step === 1) return !!serviceType;
      if (step === 2) { if (!date || !time) return false; if (!isDigitalOnly(serviceType, serviceCategories) && notarizationType === "in_person" && !clientZip && !location) return false; if (leadTimeWarning) return false; return true; }
      if (!user) return !!(guestName.trim() && guestEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && guestPassword.length >= 8 && /[A-Z]/.test(guestPassword) && /[0-9]/.test(guestPassword) && termsAccepted);
      return termsAccepted;
    }
    if (step === 1) return !!notarizationType;
    if (step === 2) return !!serviceType;
    if (step === 3) { if (!date || !time) return false; if (!isDigitalOnly(serviceType, serviceCategories) && notarizationType === "in_person" && !clientZip && !location) return false; if (leadTimeWarning) return false; return true; }
    if (!user) return !!(guestName.trim() && guestEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && guestPassword.length >= 8 && /[A-Z]/.test(guestPassword) && /[0-9]/.test(guestPassword) && termsAccepted);
    return termsAccepted;
  };

  const currentCategory = serviceCategories[serviceType] || "";

  const intakeFieldsProps = {
    serviceType, currentCategory, serviceCategories,
    destinationCountry, setDestinationCountry, urgencyLevel, setUrgencyLevel,
    uscisForm, setUscisForm, caseType, setCaseType,
    propertyAddress, setPropertyAddress, titleCompany, setTitleCompany,
    employerName, setEmployerName, hireStartDate, setHireStartDate,
    companyName, setCompanyName, clientState, setClientState,
    notes, setNotes: setNotes as (v: string | ((prev: string) => string)) => void,
    sourceLanguage, setSourceLanguage, targetLanguage, setTargetLanguage,
    translationDocType, setTranslationDocType, translationPageCount, setTranslationPageCount,
    witnessCount, setWitnessCount, witnessMode, setWitnessMode,
    witnessDocType, setWitnessDocType,
    certifiedDocName, setCertifiedDocName, issuingAuthority, setIssuingAuthority, copyCount, setCopyCount,
    employeeCount, setEmployeeCount, hrContact, setHrContact, docsPerEmployee, setDocsPerEmployee,
    currentTools, setCurrentTools, teamSize, setTeamSize, budgetRange, setBudgetRange,
    monthlyVolume, setMonthlyVolume, bulkDocTypes, setBulkDocTypes, schedulePreference, setSchedulePreference,
    scanningMode, setScanningMode,
    // Phase 12 fields
    signerCapacity, setSignerCapacity, entityName, setEntityName, signerTitle, setSignerTitle,
    facilityName, setFacilityName, facilityContact, setFacilityContact, facilityRoom, setFacilityRoom,
    signerCount, setSignerCount,
    needsApostille, setNeedsApostille,
    specialInstructions, setSpecialInstructions,
    additionalSignerEmails, setAdditionalSignerEmails,
    signerDob, setSignerDob,
  };

  const handleJoinWaitlist = async () => {
    if (!user || !date || !serviceType) return;
    setJoiningWaitlist(true);
    const { error } = await supabase.from("waitlist").insert({
      client_id: user.id,
      service_id: null,
      preferred_date: date,
      preferred_time: time || null,
      status: "waiting",
    } as any);
    if (error) { toast({ title: "Could not join waitlist", description: error.message, variant: "destructive" }); }
    else { setWaitlistJoined(true); toast({ title: "You're on the waitlist!", description: "We'll notify you when a slot opens." }); }
    setJoiningWaitlist(false);
  };

  const scheduleStepProps = {
    date, setDate, time, setTime, notes, setNotes, serviceType, notarizationType, serviceCategories,
    availableSlots, suggestedSlots, loadingSlots, leadTimeWarning,
    clientAddress, setClientAddress, clientCity, setClientCity, clientState, setClientState, clientZip, setClientZip,
    location, setLocation, locatingUser, userLat, userLon, onUseLocation: handleUseLocation,
    outsideServiceArea, travelDistance,
    onJoinWaitlist: user ? handleJoinWaitlist : undefined,
    joiningWaitlist,
    waitlistJoined,
  };

  const reviewProps = {
    isNonNotarial: !!isNonNotarial, notarizationType, serviceType, serviceCategories,
    date, time, clientAddress, clientCity, clientState, clientZip, location,
    destinationCountry, uscisForm, sourceLanguage, targetLanguage, translationDocType, translationPageCount, employerName,
    idData, docAnalysis, documentCount, notes, estimatedPrice, pricingSettings, urgencyLevel,
    user, guestName, setGuestName, guestEmail, setGuestEmail, guestPassword, setGuestPassword,
    travelDistance, afterHoursFee, signerCapacity, facilityName, signerCount,
    pricingBreakdown,
    validationErrors,
    termsAccepted, setTermsAccepted,
  };

  const stepLabels = isSkipTypeStep ? ["Service", "Schedule", "Confirm"] : ["Type", "Service", "Schedule", "Confirm"];

  return (
    <PageShell>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Breadcrumbs />
        {user && pastAppointments.length > 0 && step === 1 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!</p>
                  <Badge className="bg-primary/20 text-primary-foreground text-xs">{pastAppointments.length} past visit{pastAppointments.length > 1 ? "s" : ""}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Quick rebook from a previous appointment:</p>
                <div className="flex flex-wrap gap-2">
                  {pastAppointments.slice(0, 3).map(appt => (
                    <Button key={appt.id} variant="outline" size="sm" className="text-xs" onClick={() => handleRebook(appt)}>
                      {appt.service_type} ({appt.notarization_type === "ron" ? "RON" : "In-Person"})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {stepLabels.map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                    </div>
                    <span className={`text-[10px] font-medium ${step >= s ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && <div className={`h-0.5 w-8 mt-[-16px] transition-colors ${step > s ? "bg-accent" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-sans text-xl">
                {isSkipTypeStep
                  ? (step === 1 ? (isConsultation ? "Schedule Consultation" : "Choose Service") : step === 2 ? "Pick Date & Time" : "Review & Confirm")
                  : (step === 1 ? "Select Notarization Type" : step === 2 ? "Choose Service" : step === 3 ? "Pick Date & Time" : "Review & Confirm")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Type selection or Service selection for non-notarial/consultation */}
              {step === 1 && (isSkipTypeStep ? (
                <div className="space-y-4">
                  {isConsultation && (
                    <div className="rounded-lg bg-primary/5 border border-accent/20 p-4 flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">This consultation will take place via Zoom</p>
                        <p className="text-xs text-muted-foreground">You'll receive a Zoom meeting link in your confirmation email.</p>
                      </div>
                    </div>
                  )}
                  {!isConsultation && (
                    <div>
                      <Label>Service Type</Label>
                      <Select value={serviceType} onValueChange={val => { setServiceType(val); if (!requiresNotarizationType(val, serviceCategories)) setNotarizationType("in_person"); }}>
                        <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>{serviceTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {isConsultation && serviceType && serviceDescriptions[serviceType] && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{serviceDescriptions[serviceType]}</p>
                  )}
                  <BookingIntakeFields {...intakeFieldsProps} />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <button onClick={() => setNotarizationType("in_person")} className={`rounded-lg border-2 p-6 text-left transition-all ${notarizationType === "in_person" ? "border-accent bg-primary/5" : "border-border hover:border-primary/20"}`} aria-label="Select in-person notarization">
                    <MapPin className="mb-2 h-8 w-8 text-primary" /><h3 className="font-sans text-lg font-semibold">In-Person</h3><p className="text-sm text-muted-foreground">Franklin County & Columbus area</p>
                  </button>
                  <button onClick={() => setNotarizationType("ron")} className={`rounded-lg border-2 p-6 text-left transition-all ${notarizationType === "ron" ? "border-accent bg-primary/5" : "border-border hover:border-primary/20"}`} aria-label="Select remote online notarization">
                    <Monitor className="mb-2 h-8 w-8 text-primary" /><h3 className="font-sans text-lg font-semibold">Remote (RON)</h3><p className="text-sm text-muted-foreground">Secure video call from anywhere</p>
                  </button>
                </div>
              ))}

              {/* Non-notarial/consultation step 2 = schedule, step 3 = review */}
              {isSkipTypeStep && step === 2 && <BookingScheduleStep {...scheduleStepProps} />}
              {isSkipTypeStep && step === 3 && <BookingReviewStep {...reviewProps} />}

              {/* Notarial step 2 = service selection */}
              {!isNonNotarial && step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Service Type</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map(s => (
                          <SelectItem key={s} value={s}>
                            <div className="flex flex-col">
                              <span>{s}</span>
                              {serviceDescriptions[s] && <span className="text-[10px] text-muted-foreground max-w-[280px] truncate">{serviceDescriptions[s]}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {serviceType === "Other" && <div><Label>Describe your document</Label><Input placeholder="What type of document do you need notarized?" value={notes} onChange={e => setNotes(e.target.value)} /></div>}
                  {serviceType && serviceDescriptions[serviceType] && <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{serviceDescriptions[serviceType]}</p>}
                  <BookingIntakeFields {...intakeFieldsProps} />

                  {/* Document Auto-Detect */}
                  <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Upload your document for AI analysis (optional)</p>
                    <p className="mb-3 text-xs text-muted-foreground">We'll identify the notarization type, who needs to be present, and any special requirements.</p>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDocScan} disabled={docScanning} className="text-xs" />
                    {docScanning && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing document...</div>}
                    {docAnalysis && !docAnalysis.error && (
                      <div className="mt-2 space-y-2 rounded bg-primary/10 p-3 text-xs text-foreground">
                        <div className="flex items-center gap-1 font-medium"><CheckCircle className="h-3 w-3 text-primary" /> {docAnalysis.document_name} — {docAnalysis.notarization_method}</div>
                        <div className="text-muted-foreground">
                          <p>Signers: {docAnalysis.signers_required} • Witnesses: {docAnalysis.witnesses_required}</p>
                          {docAnalysis.who_must_be_present?.length > 0 && <p className="mt-1">Present: {docAnalysis.who_must_be_present.join(", ")}</p>}
                          {!docAnalysis.ron_eligible && <p className="mt-1 font-medium text-destructive">⚠ Not eligible for RON</p>}
                        </div>
                        {docAnalysis.special_requirements?.length > 0 && <div className="rounded bg-destructive/10 p-2 text-destructive">{docAnalysis.special_requirements.map((r: string, i: number) => <p key={i} className="flex items-start gap-1"><AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" /> {r}</p>)}</div>}
                      </div>
                    )}
                  </div>

                  {/* Batch Notarization */}
                  <div>
                    <Label>Number of Documents</Label>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map(n => <Button key={n} type="button" size="sm" variant={documentCount === n && !customDocCount ? "default" : "outline"} className={documentCount === n && !customDocCount ? "bg-primary text-primary-foreground" : ""} onClick={() => { setDocumentCount(n); setCustomDocCount(false); }}>{n}</Button>)}
                      <Button type="button" size="sm" variant={customDocCount ? "default" : "outline"} className={customDocCount ? "bg-primary text-primary-foreground" : ""} onClick={() => { setCustomDocCount(true); setDocumentCount(6); }}>5+</Button>
                      {customDocCount && <Input type="number" min={6} max={50} value={documentCount} onChange={e => setDocumentCount(Math.max(6, Math.min(50, parseInt(e.target.value) || 6)))} className="w-20" />}
                      <span className="text-xs text-muted-foreground">{documentCount > 1 ? "Same session, separate journal entries" : ""}</span>
                    </div>
                  </div>

                  {/* ID Pre-Scan */}
                  <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Camera className="h-4 w-4 text-primary" /> Pre-scan your ID (optional — saves time)
                      <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs text-xs">This pre-scan helps speed up your session. Full identity verification (KBA) occurs during the notary session.</TooltipContent></Tooltip>
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">Upload a photo of your government-issued ID to auto-fill your information.</p>
                    <Input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" onChange={handleIdScan} disabled={idScanning} className="text-xs" />
                    {idScanning && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Scanning your ID...</div>}
                    {idData && !idData.error && <div className="mt-2 rounded bg-primary/10 p-2 text-xs text-foreground"><CheckCircle className="mr-1 inline h-3 w-3 text-primary" /> Verified: {idData.full_name} — {idData.id_type}{idData.is_expired && <span className="ml-2 text-destructive font-medium">⚠ EXPIRED</span>}</div>}
                  </div>
                </div>
              )}

              {/* Notarial step 3 = schedule, step 4 = review */}
              {!isNonNotarial && step === 3 && <BookingScheduleStep {...scheduleStepProps} />}
              {!isNonNotarial && step === 4 && <BookingReviewStep {...reviewProps} />}

              {/* Sticky cost estimator */}
              {estimatedPrice !== null && step !== lastStep && (
                <div className="rounded-lg bg-primary/5 border border-accent/20 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4 text-primary" /> Estimated total</span>
                  <span className="font-semibold text-primary">${(estimatedPrice + (urgencyLevel === "rush" ? 50 : urgencyLevel === "same_day" ? 100 : 0)).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => step > 1 && setStep((step - 1) as BookingStep)} disabled={step === 1}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
                {step < lastStep ? (
                  <Button onClick={() => setStep((step + 1) as BookingStep)} disabled={!canProceed()} className="">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting || !canProceed()} className="">{submitting ? "Booking..." : "Confirm Booking"}</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ID 34: Confirmation dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Booking</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to book a {notarizationType === "ron" ? "Remote Online Notarization" : "notarization"} appointment for {serviceType} on {date ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : ""} at {time}.
                {estimatedPrice ? ` Estimated cost: $${estimatedPrice.toFixed(2)}.` : ""}
                {" "}Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmedSubmit}>
                {submitting ? "Booking..." : "Yes, Confirm Booking"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageShell>
  );
}
