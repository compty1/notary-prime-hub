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
import { MapPin, Monitor, Calendar, FileText, CheckCircle, ChevronLeft, ChevronRight, Shield, Clock, Camera, Loader2, Sparkles, AlertTriangle, LocateFixed, DollarSign, Globe, Info } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Logo } from "@/components/Logo";

type Step = 1 | 2 | 3 | 4;
type NotarizationType = "in_person" | "ron";

const BOOKING_STORAGE_KEY = "pending_booking_data";

const fallbackServiceTypes = [
  "Real Estate Documents",
  "Power of Attorney",
  "Affidavits & Sworn Statements",
  "Estate Planning Documents",
  "Business Documents",
  "I-9 Employment Verification",
  "Other",
];

const DIGITAL_ONLY_CATEGORIES = new Set(["recurring", "consulting", "document_services", "business_services"]);
const LOCATION_REQUIRED_SERVICES = new Set([
  "Closing Coordination",
  "Bulk Notarization",
]);
const DIGITAL_ONLY_SERVICES = new Set([
  "Document Storage Vault",
  "Cloud Document Storage", 
  "Virtual Mailroom",
  "Compliance Reminders",
  "Document Retention",
  "Notary API Access",
  "White-Label Notarization",
  "Registered Agent Service",
  "Subscription Plans",
  "ID / KYC Verification",
  "Background Check Coordination",
  "Document Translation",
]);

const COMMON_LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese", "Italian", "Chinese (Simplified)",
  "Chinese (Traditional)", "Japanese", "Korean", "Arabic", "Russian", "Hindi", "Vietnamese",
  "Tagalog", "Polish", "Ukrainian", "Romanian", "Dutch", "Greek", "Turkish", "Hebrew",
  "Thai", "Swahili", "Amharic", "Somali", "Nepali", "Bengali", "Urdu", "Persian (Farsi)",
];

const TRANSLATION_DOC_TYPES = [
  "Birth Certificate", "Marriage Certificate", "Death Certificate", "Divorce Decree",
  "Diploma / Degree", "Transcript", "Driver's License", "Passport", "Court Document",
  "Medical Record", "Immigration Document", "Contract / Agreement", "Power of Attorney",
  "Business Document", "Other",
];

// Hague Convention member countries
const HAGUE_COUNTRIES = [
  "Albania", "Andorra", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Barbados", "Belarus", "Belgium", "Belize", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burundi", "Canada", "Cape Verde", "Chile", "China (Hong Kong)", "China (Macao)", "Colombia", "Cook Islands", "Costa Rica", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Dominica", "Dominican Republic", "Ecuador", "El Salvador", "Estonia", "Eswatini", "Fiji", "Finland", "France", "Georgia", "Germany", "Greece", "Grenada", "Guatemala", "Guyana", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kosovo", "Kyrgyzstan", "Latvia", "Lesotho", "Liberia", "Liechtenstein", "Lithuania", "Luxembourg", "Malawi", "Malta", "Marshall Islands", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Namibia", "Netherlands", "New Zealand", "Nicaragua", "Niue", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Republic of Korea", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Serbia", "Seychelles", "Singapore", "Slovakia", "Slovenia", "South Africa", "Spain", "Suriname", "Sweden", "Switzerland", "Tajikistan", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Ukraine", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
];

const USCIS_FORMS = [
  { value: "I-130", label: "I-130 — Petition for Alien Relative" },
  { value: "I-485", label: "I-485 — Adjustment of Status (Green Card)" },
  { value: "I-765", label: "I-765 — Employment Authorization (EAD)" },
  { value: "N-400", label: "N-400 — Naturalization / Citizenship" },
  { value: "I-90", label: "I-90 — Renew Green Card" },
  { value: "I-131", label: "I-131 — Travel Document / Advance Parole" },
  { value: "I-864", label: "I-864 — Affidavit of Support" },
  { value: "I-20", label: "I-20 — Student Eligibility Certificate" },
  { value: "DS-160", label: "DS-160 — Nonimmigrant Visa Application" },
  { value: "Other", label: "Other USCIS Form" },
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
  const [customDocCount, setCustomDocCount] = useState(false);

  // Witness-specific fields
  const [witnessCount, setWitnessCount] = useState("1");
  const [witnessMode, setWitnessMode] = useState<"in_person" | "virtual">("in_person");
  const [witnessDocType, setWitnessDocType] = useState("");

  // Certified copy fields
  const [certifiedDocName, setCertifiedDocName] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [copyCount, setCopyCount] = useState("1");

  // Employment onboarding fields
  const [employeeCount, setEmployeeCount] = useState("1");
  const [hrContact, setHrContact] = useState("");
  const [docsPerEmployee, setDocsPerEmployee] = useState("1");

  // Custom workflow fields
  const [currentTools, setCurrentTools] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  // Bulk notarization fields
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [bulkDocTypes, setBulkDocTypes] = useState("");
  const [schedulePreference, setSchedulePreference] = useState("");

  // Scanning fields
  const [scanningMode, setScanningMode] = useState<"digital" | "physical">("digital");

  // Translation-specific intake fields
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translationDocType, setTranslationDocType] = useState("");
  const [translationPageCount, setTranslationPageCount] = useState("1");

  const NOTARIZATION_CATEGORIES = ["notarization", "authentication"];
  const requiresNotarizationType = (svcName: string) => {
    const cat = serviceCategories[svcName];
    return !cat || NOTARIZATION_CATEGORIES.includes(cat);
  };

  const isDigitalOnly = (svcName: string) => {
    if (LOCATION_REQUIRED_SERVICES.has(svcName)) return false;
    const cat = serviceCategories[svcName];
    return (cat && DIGITAL_ONLY_CATEGORIES.has(cat)) || DIGITAL_ONLY_SERVICES.has(svcName);
  };

  useEffect(() => {
    document.title = "Book Appointment — Notar";
    return () => { document.title = "Notar — Ohio Notary Public | In-Person & RON"; };
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
        setServiceTypes([...new Set(data.map((s: any) => s.name))]);
        const descs: Record<string, string> = {};
        const cats: Record<string, string> = {};
        data.forEach((s: any) => { 
          if (s.short_description) descs[s.name] = s.short_description;
          cats[s.name] = s.category;
        });
        setServiceDescriptions(descs);
        setServiceCategories(cats);

        // Handle pre-selected service from URL (fix race condition - Phase 1.2)
        const preService = new URLSearchParams(window.location.search).get("service");
        if (preService && data.some((s: any) => s.name === preService)) {
          setServiceType(preService);
        }
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
          if (data.address) setClientAddress(data.address);
          if (data.city) setClientCity(data.city);
          if (data.state) setClientState(data.state);
          if (data.zip) setClientZip(data.zip);
        }
      });
      supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }).limit(5).then(({ data }) => {
        if (data) setPastAppointments(data);
      });

      const pendingBooking = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          localStorage.removeItem(BOOKING_STORAGE_KEY);
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
    const preType = searchParams.get("type");
    if (preType === "ron" || preType === "in_person") {
      setNotarizationType(preType);
    }
    // Pre-selected service handled in services .then() callback above (Phase 1.2 fix)
    const preEstimate = searchParams.get("estimate");
    if (preEstimate) {
      setEstimatedPrice(parseFloat(preEstimate));
    }
    const preDocs = searchParams.get("docs");
    if (preDocs) {
      setDocumentCount(parseInt(preDocs) || 1);
    }
  }, [searchParams, user]);

  // Fetch available time slots when date changes
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

      const specificSlots = specificRes.data || [];
      const daySlots = slotsRes.data || [];
      const baseSlots = specificSlots.length > 0 ? specificSlots : daySlots;

      const maxPerDay = parseInt(pricingSettings.max_appointments_per_day || "0");
      const currentCount = countRes.count || 0;
      const dayFull = maxPerDay > 0 && currentCount >= maxPerDay;

      if (dayFull) {
        setAvailableSlots([]);
        findNearestSlots(date);
      } else if (baseSlots.length > 0) {
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
            headers: { "User-Agent": "Notar/1.0" },
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
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 10MB.", variant: "destructive" });
      return;
    }
    setIdScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-id`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

  // Phase 1.5: Fix rebook - clear date/time before setting step
  const handleRebook = (appt: any) => {
    setNotarizationType(appt.notarization_type);
    setServiceType(appt.service_type);
    if (appt.location && appt.location !== "Remote") setLocation(appt.location);
    setRebookingId(appt.id);
    // Clear date/time so slot availability reloads
    setDate("");
    setTime("");
    setAvailableSlots([]);
    setSuggestedSlots([]);
    setStep(3);
    toast({ title: "Details pre-filled", description: "Pick a new date and time to reschedule." });
  };

  // Build structured intake notes from category-specific fields
  const buildIntakeNotes = () => {
    const parts: string[] = [];
    const cat = serviceCategories[serviceType];
    const svcLower = serviceType.toLowerCase();
    
    if (cat === "authentication" || cat === "notarization") {
      if (destinationCountry) parts.push(`[Destination: ${destinationCountry}${HAGUE_COUNTRIES.includes(destinationCountry) ? " (Hague)" : " (Non-Hague — consular legalization may be required)"}]`);
      if (urgencyLevel !== "standard") parts.push(`[Urgency: ${urgencyLevel}]`);
    }
    if (cat === "consulting") {
      if (uscisForm) parts.push(`[USCIS Form: ${uscisForm}]`);
      if (caseType) parts.push(`[Case Type: ${caseType}]`);
    }
    if (svcLower.includes("real estate") || svcLower.includes("closing")) {
      if (propertyAddress) parts.push(`[Property: ${propertyAddress}]`);
      if (titleCompany) parts.push(`[Title Co: ${titleCompany}]`);
    }
    if (cat === "verification" || svcLower.includes("i-9")) {
      if (employerName) parts.push(`[Employer: ${employerName}]`);
      if (hireStartDate) parts.push(`[Start Date: ${hireStartDate}]`);
    }
    if (cat === "business") {
      if (companyName) parts.push(`[Company: ${companyName}]`);
    }
    if (svcLower.includes("translation")) {
      if (sourceLanguage) parts.push(`[Source Language: ${sourceLanguage}]`);
      if (targetLanguage) parts.push(`[Target Language: ${targetLanguage}]`);
      if (translationDocType) parts.push(`[Doc Type: ${translationDocType}]`);
      if (translationPageCount) parts.push(`[Pages: ${translationPageCount}]`);
    }
    // Witness fields
    if (svcLower.includes("witness")) {
      parts.push(`[Witnesses Needed: ${witnessCount}]`);
      parts.push(`[Witness Mode: ${witnessMode}]`);
      if (witnessDocType) parts.push(`[Witness Doc Type: ${witnessDocType}]`);
    }
    // Certified copy fields
    if (svcLower.includes("certified copy")) {
      if (certifiedDocName) parts.push(`[Certified Doc: ${certifiedDocName}]`);
      if (issuingAuthority) parts.push(`[Issuing Authority: ${issuingAuthority}]`);
      parts.push(`[Copies: ${copyCount}]`);
    }
    // Employment onboarding fields
    if (svcLower.includes("employment onboarding") || svcLower.includes("onboarding support")) {
      parts.push(`[Employees: ${employeeCount}]`);
      parts.push(`[Docs/Employee: ${docsPerEmployee}]`);
      if (hrContact) parts.push(`[HR Contact: ${hrContact}]`);
      if (employerName) parts.push(`[Employer: ${employerName}]`);
    }
    // Custom workflow fields
    if (svcLower.includes("custom workflow")) {
      if (currentTools) parts.push(`[Current Tools: ${currentTools}]`);
      if (teamSize) parts.push(`[Team Size: ${teamSize}]`);
      if (budgetRange) parts.push(`[Budget: ${budgetRange}]`);
    }
    // Bulk notarization fields
    if (svcLower.includes("bulk")) {
      if (monthlyVolume) parts.push(`[Monthly Volume: ${monthlyVolume}]`);
      if (bulkDocTypes) parts.push(`[Doc Types: ${bulkDocTypes}]`);
      if (schedulePreference) parts.push(`[Schedule: ${schedulePreference}]`);
    }
    // Scanning fields
    if (svcLower.includes("scanning") || svcLower.includes("digitization")) {
      parts.push(`[Scanning Mode: ${scanningMode}]`);
    }
    return parts.join("\n");
  };

  const submitBooking = async (userId: string, bookingData?: any) => {
    const data = bookingData || {
      notarizationType, serviceType, date, time, location, notes, documentCount,
      clientAddress, clientCity, clientState, clientZip,
    };

    setSubmitting(true);
    const intakeNotes = buildIntakeNotes();
    const fullNotes = [
      data.notes || notes,
      intakeNotes,
      (data.documentCount || documentCount) > 1 ? `[Batch: ${data.documentCount || documentCount} documents]` : "",
      docAnalysis ? `[AI Detected: ${docAnalysis.document_name} — ${docAnalysis.notarization_method}]` : "",
      idData ? `[ID Pre-scanned: ${idData.id_type} — ${idData.full_name}]` : "",
    ].filter(Boolean).join("\n");

    const fullAddress = data.clientAddress 
      ? `${data.clientAddress}, ${data.clientCity}, ${data.clientState} ${data.clientZip}`.trim()
      : (data.location || location);

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
    try {
      const { error: emailError } = await supabase.functions.invoke("send-appointment-emails", {
        body: { appointmentId: appointmentResultId, emailType: "confirmation" },
      });
      if (emailError) console.error("Confirmation email error:", emailError);
    } catch (emailErr) {
      console.error("Failed to trigger confirmation email:", emailErr);
    }

    const clientEmail = user?.email;
    if (clientEmail && !rebookingId) {
      try {
        await supabase.from("leads").update({ status: "converted" }).ilike("email", clientEmail).in("status", ["new", "contacted", "qualified"]);
      } catch { /* silent */ }
    }

    toast({ title: rebookingId ? "Appointment rescheduled!" : "Appointment booked!", description: "You'll receive a confirmation email shortly." });
    navigate(`/confirmation?id=${appointmentResultId}`);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      if (!guestEmail || !guestPassword || !guestName) {
        setShowSignup(true);
        toast({ title: "Create account to confirm", description: "Enter your details below to complete booking.", variant: "destructive" });
        return;
      }

      const bookingData = {
        notarizationType, serviceType, date, time, location, notes, documentCount,
        clientAddress, clientCity, clientState, clientZip,
      };
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingData));

      const { error } = await signUp(guestEmail, guestPassword, guestName);
      if (error) {
        const { error: signInErr } = await signIn(guestEmail, guestPassword);
        if (signInErr) {
          localStorage.removeItem(BOOKING_STORAGE_KEY);
          toast({ title: "Account error", description: error.message, variant: "destructive" });
          return;
        }
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

  // Phase 1.6: Lead-time check with warning
  const getLeadTimeWarning = () => {
    if (!date || !time) return null;
    const leadHours = parseInt(pricingSettings.min_booking_lead_hours || "2");
    const bookingDate = new Date(`${date}T${time}`);
    const minDate = new Date(Date.now() + leadHours * 60 * 60 * 1000);
    if (bookingDate < minDate) return `Please select a time at least ${leadHours} hours from now.`;
    return null;
  };

  const leadTimeWarning = getLeadTimeWarning();

  // Phase 1.3: Guest validation on review step
  const canProceed = () => {
    if (isNonNotarial) {
      if (step === 1) return !!serviceType;
      if (step === 2) {
        if (!date || !time) return false;
        if (!isDigitalOnly(serviceType) && notarizationType === "in_person" && !clientZip && !location) return false;
        if (leadTimeWarning) return false;
        return true;
      }
      // Review step - validate guest fields
      if (!user) {
        return !!(guestName.trim() && guestEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && guestPassword.length >= 6);
      }
      return true;
    }
    if (step === 1) return !!notarizationType;
    if (step === 2) return !!serviceType;
    if (step === 3) {
      if (!date || !time) return false;
      if (!isDigitalOnly(serviceType) && notarizationType === "in_person" && !clientZip && !location) return false;
      if (leadTimeWarning) return false;
      return true;
    }
    // Review step (step 4) - validate guest fields
    if (!user) {
      return !!(guestName.trim() && guestEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && guestPassword.length >= 6);
    }
    return true;
  };

  // Get current service category for conditional intake
  const currentCategory = serviceCategories[serviceType] || "";

  // Render category-specific intake fields
  const renderIntakeFields = () => {
    if (!serviceType) return null;
    const cat = currentCategory;
    const svcLower = serviceType.toLowerCase();

    // No special intake for business_services (but document_services may include translation)
    if (cat === "business_services") return null;

    // Check if any fields are relevant for this service
    const showApostille = cat === "authentication" || svcLower.includes("apostille");
    const showImmigration = (cat === "consulting" && (svcLower.includes("immigration") || svcLower.includes("uscis")));
    const showRealEstate = svcLower.includes("real estate") || svcLower.includes("closing");
    const showI9 = svcLower.includes("i-9") || svcLower.includes("employment verification");
    const showEmployer = showI9;
    const showBusiness = cat === "business" && !DIGITAL_ONLY_SERVICES.has(serviceType);
    const showRonOnboarding = svcLower.includes("ron onboarding");
    const showWorkflow = svcLower.includes("workflow") && !svcLower.includes("ron");
    const showTranslation = svcLower.includes("translation");
    const showWitness = svcLower.includes("witness");
    const showCertifiedCopy = svcLower.includes("certified copy");
    const showOnboarding = svcLower.includes("employment onboarding") || svcLower.includes("onboarding support");
    const showCustomWorkflow = svcLower.includes("custom workflow");
    const showBulk = svcLower.includes("bulk");
    const showScanning = svcLower.includes("scanning") || svcLower.includes("digitization");

    // If no category-specific fields apply, return null
    if (!showApostille && !showImmigration && !showRealEstate && !showI9 && !showEmployer && !showBusiness && !showRonOnboarding && !showWorkflow && !showTranslation && !showWitness && !showCertifiedCopy && !showOnboarding && !showCustomWorkflow && !showBulk && !showScanning) return null;

    return (
      <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-sm font-medium flex items-center gap-2"><Info className="h-4 w-4 text-accent" /> Service-Specific Details</p>
        
        {showApostille && (
          <>
            <div>
              <Label>Destination Country</Label>
              <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                <SelectContent>
                  {HAGUE_COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other (Non-Hague)</SelectItem>
                </SelectContent>
              </Select>
              {destinationCountry && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {HAGUE_COUNTRIES.includes(destinationCountry) 
                    ? "✓ Hague Convention member — Apostille accepted" 
                    : "⚠ Non-Hague country — consular legalization may be required"}
                </p>
              )}
            </div>
            <div>
              <Label>Urgency</Label>
              <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (5-10 business days)</SelectItem>
                  <SelectItem value="rush">Rush (2-3 business days, +$50)</SelectItem>
                  <SelectItem value="same_day">Same Day (if available, +$100)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {showImmigration && (
          <>
            <div>
              <Label>USCIS Form Number</Label>
              <Select value={uscisForm} onValueChange={setUscisForm}>
                <SelectTrigger><SelectValue placeholder="Select form..." /></SelectTrigger>
                <SelectContent>
                  {USCIS_FORMS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Case Type</Label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger><SelectValue placeholder="Select case type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Family">Family-Based</SelectItem>
                  <SelectItem value="Employment">Employment-Based</SelectItem>
                  <SelectItem value="Humanitarian">Humanitarian</SelectItem>
                  <SelectItem value="Naturalization">Naturalization</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {showRealEstate && (
          <>
            <div>
              <Label>Property Address</Label>
              <Input value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="Address of the property" />
            </div>
            <div>
              <Label>Title Company (if applicable)</Label>
              <Input value={titleCompany} onChange={(e) => setTitleCompany(e.target.value)} placeholder="Title company name" />
            </div>
          </>
        )}

        {showEmployer && (
          <>
            <div>
              <Label>Employer Name</Label>
              <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Hiring company name" />
            </div>
            <div>
              <Label>New Hire Start Date</Label>
              <Input type="date" value={hireStartDate} onChange={(e) => setHireStartDate(e.target.value)} />
            </div>
          </>
        )}

        {/* I-9 List A/B/C Document Reference */}
        {showI9 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
              <Info className="h-3 w-3" /> Acceptable I-9 Documents — Bring ONE of the following:
            </p>
            <div className="text-xs text-blue-800 space-y-2">
              <div>
                <p className="font-semibold">List A — Proves Identity AND Work Authorization (need ONE):</p>
                <ul className="ml-4 list-disc text-blue-700">
                  <li>U.S. Passport or Passport Card</li>
                  <li>Permanent Resident Card (Green Card)</li>
                  <li>Employment Authorization Document (EAD / I-766)</li>
                  <li>Foreign passport with I-94 and endorsement</li>
                </ul>
              </div>
              <p className="font-semibold text-blue-900">— OR bring BOTH —</p>
              <div>
                <p className="font-semibold">List B — Proves Identity (need ONE):</p>
                <ul className="ml-4 list-disc text-blue-700">
                  <li>Driver's license or state-issued ID</li>
                  <li>School ID with photo</li>
                  <li>Voter registration card</li>
                  <li>U.S. military card or draft record</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">PLUS List C — Proves Work Authorization (need ONE):</p>
                <ul className="ml-4 list-disc text-blue-700">
                  <li>Social Security card (unrestricted)</li>
                  <li>U.S. birth certificate</li>
                  <li>Certification of Birth Abroad (FS-545 or DS-1350)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {showBusiness && (
          <div>
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your business name" />
          </div>
        )}

        {showRonOnboarding && (
          <>
            <div>
              <Label>Current Notary Commission State</Label>
              <Select value={clientState} onValueChange={setClientState}>
                <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OH">Ohio</SelectItem>
                  <SelectItem value="IN">Indiana</SelectItem>
                  <SelectItem value="KY">Kentucky</SelectItem>
                  <SelectItem value="WV">West Virginia</SelectItem>
                  <SelectItem value="PA">Pennsylvania</SelectItem>
                  <SelectItem value="MI">Michigan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>RON Platform Experience</Label>
              <Select value={notes.includes("[RON Experience:") ? "" : ""} onValueChange={(v) => setNotes(prev => prev + `\n[RON Experience: ${v}]`)}>
                <SelectTrigger><SelectValue placeholder="Select experience level..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No experience with RON platforms</SelectItem>
                  <SelectItem value="some">Some experience (used 1-2 platforms)</SelectItem>
                  <SelectItem value="experienced">Experienced (regular RON user)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {showWorkflow && (
          <>
            <div>
              <Label>Current Workflow Description</Label>
              <Textarea
                placeholder="Describe your current notarization workflow — tools used, volume, pain points..."
                rows={3}
                onChange={(e) => setNotes(prev => prev.replace(/\[Workflow:.*\]/s, "") + `\n[Workflow: ${e.target.value}]`)}
              />
            </div>
            <div>
              <Label>Approximate Monthly Transactions</Label>
              <Input type="number" placeholder="e.g., 50" min={0} onChange={(e) => setNotes(prev => prev + `\n[Monthly Volume: ${e.target.value}]`)} />
            </div>
          </>
        )}

        {showTranslation && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source Language</Label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger><SelectValue placeholder="Original language" /></SelectTrigger>
                  <SelectContent>
                    {COMMON_LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Language *</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger><SelectValue placeholder="Translate to..." /></SelectTrigger>
                  <SelectContent>
                    {COMMON_LANGUAGES.filter(l => l !== sourceLanguage).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Document Type</Label>
                <Select value={translationDocType} onValueChange={setTranslationDocType}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {TRANSLATION_DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Page Count</Label>
                <Input type="number" min="1" value={translationPageCount} onChange={(e) => setTranslationPageCount(e.target.value)} />
              </div>
            </div>
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">📄 How it works:</p>
              <p>1. Upload your document during booking or in your portal after booking</p>
              <p>2. Our AI translates your document with a Certificate of Translation Accuracy</p>
              <p>3. Review the translated document in your portal</p>
              <p>4. If notarization of the translation is needed, we can schedule that too</p>
            </div>
          </>
        )}

        {showWitness && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Number of Witnesses Needed</Label>
                <Select value={witnessCount} onValueChange={setWitnessCount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Witness</SelectItem>
                    <SelectItem value="2">2 Witnesses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Witness Mode</Label>
                <Select value={witnessMode} onValueChange={(v) => setWitnessMode(v as "in_person" | "virtual")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual (via video)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Document Type Being Witnessed</Label>
              <Input value={witnessDocType} onChange={(e) => setWitnessDocType(e.target.value)} placeholder="e.g. Will, Affidavit, Contract" />
            </div>
          </>
        )}

        {showCertifiedCopy && (
          <>
            <div>
              <Label>Document Name</Label>
              <Input value={certifiedDocName} onChange={(e) => setCertifiedDocName(e.target.value)} placeholder="e.g. Birth Certificate, Diploma" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issuing Authority</Label>
                <Input value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} placeholder="e.g. State of Ohio, County Clerk" />
              </div>
              <div>
                <Label>Number of Copies</Label>
                <Input type="number" min="1" max="20" value={copyCount} onChange={(e) => setCopyCount(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {showOnboarding && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Number of Employees</Label>
                <Input type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="e.g. 10" />
              </div>
              <div>
                <Label>Docs per Employee</Label>
                <Input type="number" min="1" value={docsPerEmployee} onChange={(e) => setDocsPerEmployee(e.target.value)} placeholder="e.g. 3" />
              </div>
              <div>
                <Label>HR Contact</Label>
                <Input value={hrContact} onChange={(e) => setHrContact(e.target.value)} placeholder="Name or email" />
              </div>
            </div>
            <div>
              <Label>Employer Name</Label>
              <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Company name" />
            </div>
          </>
        )}

        {showCustomWorkflow && (
          <>
            <div>
              <Label>Current Tools / Platforms Used</Label>
              <Input value={currentTools} onChange={(e) => setCurrentTools(e.target.value)} placeholder="e.g. DocuSign, Notarize, pen & paper" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Team Size</Label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Solo</SelectItem>
                    <SelectItem value="2-5">2–5 people</SelectItem>
                    <SelectItem value="6-20">6–20 people</SelectItem>
                    <SelectItem value="20+">20+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget Range</Label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_500">Under $500</SelectItem>
                    <SelectItem value="500_2000">$500 – $2,000</SelectItem>
                    <SelectItem value="2000_5000">$2,000 – $5,000</SelectItem>
                    <SelectItem value="5000_plus">$5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {showBulk && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estimated Monthly Volume</Label>
                <Input value={monthlyVolume} onChange={(e) => setMonthlyVolume(e.target.value)} placeholder="e.g. 50 documents/month" />
              </div>
              <div>
                <Label>Schedule Preference</Label>
                <Select value={schedulePreference} onValueChange={setSchedulePreference}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly recurring</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly batch</SelectItem>
                    <SelectItem value="on_demand">On demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Document Types</Label>
              <Input value={bulkDocTypes} onChange={(e) => setBulkDocTypes(e.target.value)} placeholder="e.g. Deeds, POAs, Affidavits" />
            </div>
          </>
        )}

        {showScanning && (
          <div>
            <Label>Document Format</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button type="button" className={`rounded-lg border p-3 text-sm text-left transition-all ${scanningMode === "digital" ? "border-accent bg-accent/10 ring-2 ring-accent" : "border-border hover:border-accent/50"}`} onClick={() => setScanningMode("digital")}>
                <p className="font-medium">Digital Files</p>
                <p className="text-xs text-muted-foreground mt-1">I have digital files to convert (PDF, images)</p>
              </button>
              <button type="button" className={`rounded-lg border p-3 text-sm text-left transition-all ${scanningMode === "physical" ? "border-accent bg-accent/10 ring-2 ring-accent" : "border-border hover:border-accent/50"}`} onClick={() => setScanningMode("physical")}>
                <p className="font-medium">Physical Documents</p>
                <p className="text-xs text-muted-foreground mt-1">I need to bring in or have someone scan paper docs</p>
              </button>
            </div>
            {scanningMode === "digital" && (
              <p className="text-xs text-muted-foreground mt-2">💡 For digital files, you can use our <a href="/digitize" className="text-accent underline">Digitize tool</a> directly — no appointment needed!</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render date/time picker section (shared between notarial step 3 and non-notarial step 2)
  const renderDateTimePicker = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
      </div>

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
              <Button key={i} variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => { setDate(s.date); setTime(s.slot.start_time); }}>
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
              <Button key={slot.id} variant={time === slot.start_time ? "default" : "outline"} size="sm" className={time === slot.start_time ? "bg-accent text-accent-foreground" : ""} onClick={() => setTime(slot.start_time)}>
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

      {/* Phase 1.6: Lead-time warning */}
      {leadTimeWarning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {leadTimeWarning}
        </div>
      )}

      {/* Phase 1.4: Skip location fields for digital-only services */}
      {!isDigitalOnly(serviceType) && notarizationType === "in_person" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Meeting Location</Label>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={handleUseLocation} disabled={locatingUser}>
              {locatingUser ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LocateFixed className="mr-1 h-3 w-3" />} Use My Location
            </Button>
          </div>
          <AddressAutocomplete value={clientAddress} onChange={setClientAddress} userLat={userLat} userLon={userLon} onSelect={(s) => { setClientAddress(s.address); setClientCity(s.city); setClientState(s.state); setClientZip(s.zip); setLocation(s.fullAddress); }} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="City" value={clientCity} onChange={(e) => setClientCity(e.target.value)} />
            <Input placeholder="State" value={clientState} onChange={(e) => setClientState(e.target.value)} maxLength={2} />
            <Input placeholder="Zip Code" value={clientZip} onChange={(e) => setClientZip(e.target.value)} maxLength={5} />
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
  );

  // Render review section (shared between notarial step 4 and non-notarial step 3)
  const renderReview = () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        {!isNonNotarial && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium flex items-center gap-1">
              {notarizationType === "in_person" ? <><MapPin className="h-3 w-3" /> In-Person</> : <><Monitor className="h-3 w-3" /> Remote (RON)</>}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{serviceType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {date && new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium">{time && formatTime(time)}</span>
        </div>
        {(clientAddress || location) && notarizationType === "in_person" && !isDigitalOnly(serviceType) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium text-right max-w-[60%]">
              {clientAddress ? `${clientAddress}, ${clientCity}, ${clientState} ${clientZip}` : location}
            </span>
          </div>
        )}
        {/* Category-specific review items */}
        {destinationCountry && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Destination</span>
            <span className="font-medium">{destinationCountry} {HAGUE_COUNTRIES.includes(destinationCountry) ? "(Hague)" : "(Non-Hague)"}</span>
          </div>
        )}
        {uscisForm && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">USCIS Form</span>
            <span className="font-medium">{uscisForm}</span>
          </div>
        )}
        {targetLanguage && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Translation</span>
            <span className="font-medium">{sourceLanguage} → {targetLanguage}</span>
          </div>
        )}
        {translationDocType && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Document</span>
            <span className="font-medium">{translationDocType} ({translationPageCount} page{parseInt(translationPageCount) !== 1 ? "s" : ""})</span>
          </div>
        )}
        {employerName && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employer</span>
            <span className="font-medium">{employerName}</span>
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

      {/* Live Cost Estimator (Phase 4.2) */}
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
            {notarizationType === "in_person" && !isDigitalOnly(serviceType) && (
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
            {urgencyLevel === "rush" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rush processing</span>
                <span>$50.00</span>
              </div>
            )}
            {urgencyLevel === "same_day" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Same-day processing</span>
                <span>$100.00</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span>Estimated Total</span>
              <span className="text-accent">${(estimatedPrice + (urgencyLevel === "rush" ? 50 : urgencyLevel === "same_day" ? 100 : 0)).toFixed(2)}</span>
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
          {guestPassword && guestPassword.length < 6 && (
            <p className="text-xs text-destructive">Password must be at least 6 characters.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="font-display text-lg font-bold text-foreground">Notar</span>
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
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step >= s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {i < arr.length - 1 && <div className={`h-0.5 w-8 transition-colors ${step > s ? "bg-accent" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {isNonNotarial
                  ? (step === 1 ? "Choose Service" : step === 2 ? "Pick Date & Time" : "Review & Confirm")
                  : (step === 1 ? "Select Notarization Type" : step === 2 ? "Choose Service" : step === 3 ? "Pick Date & Time" : "Review & Confirm")
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 */}
              {step === 1 && (serviceType && !requiresNotarizationType(serviceType) ? (
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
                  {/* Category-specific intake fields (Phase 4.1) */}
                  {renderIntakeFields()}
                </div>
              ) : (
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

              {/* Non-notarial step 2 = date/time */}
              {isNonNotarial && step === 2 && renderDateTimePicker()}

              {/* Non-notarial step 3 = review */}
              {isNonNotarial && step === 3 && renderReview()}

              {/* Phase 1.1 FIX: Only render notarial step 2 when NOT non-notarial */}
              {!isNonNotarial && step === 2 && (
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
                      <Input placeholder="What type of document do you need notarized?" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  )}

                  {serviceType && serviceDescriptions[serviceType] && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{serviceDescriptions[serviceType]}</p>
                  )}

                  {/* Category-specific intake fields (Phase 4.1) */}
                  {renderIntakeFields()}

                  {/* Document Auto-Detect */}
                  <div className="rounded-lg border border-dashed border-accent/30 bg-accent/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-accent" />
                      Upload your document for AI analysis (optional)
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      We'll identify the notarization type, who needs to be present, and any special requirements.
                    </p>
                    <Input type="file" accept="image/*" onChange={handleDocScan} disabled={docScanning} className="text-xs" />
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
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Button key={n} type="button" size="sm" variant={documentCount === n && !customDocCount ? "default" : "outline"} className={documentCount === n && !customDocCount ? "bg-accent text-accent-foreground" : ""} onClick={() => { setDocumentCount(n); setCustomDocCount(false); }}>
                          {n}
                        </Button>
                      ))}
                      <Button type="button" size="sm" variant={customDocCount ? "default" : "outline"} className={customDocCount ? "bg-accent text-accent-foreground" : ""} onClick={() => { setCustomDocCount(true); setDocumentCount(6); }}>
                        5+
                      </Button>
                      {customDocCount && (
                        <Input type="number" min={6} max={50} value={documentCount} onChange={(e) => setDocumentCount(Math.max(6, Math.min(50, parseInt(e.target.value) || 6)))} className="w-20" />
                      )}
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
                    <Input type="file" accept="image/*" onChange={handleIdScan} disabled={idScanning} className="text-xs" />
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

              {/* Phase 1.1 FIX: Only render notarial step 3 when NOT non-notarial */}
              {!isNonNotarial && step === 3 && renderDateTimePicker()}

              {/* Phase 1.1 FIX: Only render notarial step 4 when NOT non-notarial */}
              {!isNonNotarial && step === 4 && renderReview()}

              {/* Sticky cost estimator bar (Phase 4.2) */}
              {estimatedPrice !== null && step !== lastStep && (
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-accent" /> Estimated total
                  </span>
                  <span className="font-semibold text-accent">${(estimatedPrice + (urgencyLevel === "rush" ? 50 : urgencyLevel === "same_day" ? 100 : 0)).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => step > 1 && setStep((step - 1) as Step)} disabled={step === 1}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                {step < lastStep ? (
                  <Button onClick={() => setStep((step + 1) as Step)} disabled={!canProceed()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting || !canProceed()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
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
