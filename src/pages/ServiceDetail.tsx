import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ServicePreQualifier from "@/components/ServicePreQualifier";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import {
  ChevronLeft, ChevronRight, CheckCircle, FileText, Loader2, ArrowRight,
  Monitor, MapPin, Shield, Lock, Briefcase, Globe, Users, Home, Clock, AlertTriangle,
  MessageSquare, ExternalLink, Sparkles, User
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageTitle } from "@/lib/usePageTitle";

const iconMap: Record<string, any> = {
  Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home,
  Copy: FileText, ScanFace: Shield, ClipboardCheck: FileText, Search: FileText,
  FileEdit: FileText, FileType: FileText, Scan: FileText, Paintbrush: FileText,
  FormInput: FileText, Building: Briefcase, Flag: Globe, Languages: Globe,
  Layers: FileText, CreditCard: Briefcase, Code: FileText, Award: Shield,
  Building2: Briefcase, Inbox: FileText, Bell: FileText, Layout: FileText,
  GraduationCap: Briefcase, ClipboardList: FileText, Workflow: FileText, Plane: Globe,
};

// Phase 3.1: Category-specific resource links
const categoryResources: Record<string, { label: string; url: string; icon: any }[]> = {
  authentication: [
    { label: "Ohio SOS Apostille", url: "https://www.ohiosos.gov/businesses/apostille-and-certification/", icon: ExternalLink },
    { label: "Hague Member Countries", url: "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41", icon: Globe },
    { label: "Embassy Finder", url: "https://www.usembassy.gov/", icon: Globe },
  ],
  verification: [
    { label: "USCIS I-9 Central", url: "https://www.uscis.gov/i-9-central", icon: ExternalLink },
    { label: "E-Verify", url: "https://www.e-verify.gov/", icon: Shield },
    { label: "Acceptable Documents (Lists A/B/C)", url: "https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents", icon: FileText },
  ],
  notarization: [
    { label: "RON Eligibility Checker", url: "/ron-check", icon: Monitor },
    { label: "Ohio Notary Statutes", url: "https://codes.ohio.gov/ohio-revised-code/chapter-147", icon: Shield },
    { label: "Notary Guide", url: "/notary-guide", icon: FileText },
  ],
  consulting: [
    { label: "Schedule Consultation", url: "/book?service=Consultation", icon: Monitor },
    { label: "Join as Provider", url: "/join", icon: Users },
  ],
  document_services: [
    { label: "Document Templates", url: "/templates", icon: FileText },
    { label: "Document Builder", url: "/builder", icon: FileText },
  ],
  business: [
    { label: "Business Portal", url: "/business-portal", icon: Briefcase },
    { label: "Loan Signing Partnership", url: "/loan-signing", icon: Briefcase },
  ],
  admin_support: [
    { label: "Service Request Form", url: "/request", icon: FileText },
    { label: "Fee Calculator", url: "/fee-calculator", icon: Shield },
  ],
  content_creation: [
    { label: "AI Writing Tools", url: "/ai-writer", icon: FileText },
    { label: "Request Content", url: "/request", icon: FileText },
  ],
  research: [
    { label: "Submit Research Request", url: "/request", icon: FileText },
    { label: "Services Overview", url: "/services", icon: Shield },
  ],
  customer_service: [
    { label: "Submit Support Request", url: "/request", icon: FileText },
    { label: "Contact Us", url: "/#contact", icon: ExternalLink },
  ],
  technical_support: [
    { label: "Website Update Request", url: "/request", icon: FileText },
    { label: "Services Overview", url: "/services", icon: Shield },
  ],
  ux_testing: [
    { label: "Request UX Audit", url: "/request", icon: FileText },
    { label: "Services Overview", url: "/services", icon: Shield },
  ],
};

// Service-specific FAQs (checked before category FAQs)
const serviceFaqs: Record<string, { q: string; a: string }[]> = {
  "ron onboarding": [
    { q: "What equipment do I need for RON?", a: "A computer with webcam, microphone, stable internet, and a RON-compliant platform like SignNow." },
    { q: "How long is the RON onboarding process?", a: "Typically 1-2 weeks including platform setup, training, and practice sessions." },
    { q: "What states authorize RON?", a: "Over 40 states now authorize RON. Ohio has authorized RON under ORC §147.65-.66 since 2019." },
    { q: "Do I need a separate RON commission?", a: "Yes. Ohio requires a separate RON authorization in addition to your traditional notary commission." },
  ],
  "workflow": [
    { q: "What does a workflow audit include?", a: "We review your current document handling, signing, and notarization processes to identify inefficiencies and recommend improvements." },
    { q: "How long does a workflow audit take?", a: "Initial assessment takes 1-2 hours via Zoom. Full recommendations delivered within 3-5 business days." },
    { q: "Can you automate our notarization process?", a: "Yes. We can design custom workflows integrating digital document prep, scheduling, and RON platforms." },
  ],
  "closing coordination": [
    { q: "What does closing coordination include?", a: "We coordinate document preparation, scheduling, notarization, and delivery for real estate closings." },
    { q: "Do you work with title companies?", a: "Yes. We partner with title companies across Ohio for seamless closing experiences." },
    { q: "Can you handle out-of-state closings?", a: "We can notarize documents for out-of-state transactions if the signer is in Ohio, using RON for remote parties." },
  ],
  "pdf": [
    { q: "What PDF operations do you offer?", a: "Merge, split, compress, convert (Word to PDF, image to PDF), OCR text extraction, and form field creation." },
    { q: "Can you convert scanned documents to editable text?", a: "Yes. Our AI-powered OCR service transcribes scanned documents while preserving original formatting." },
    { q: "What about large files?", a: "We handle files up to 100MB. For larger files, contact us for custom solutions." },
  ],
  "storage": [
    { q: "How does document storage work?", a: "Documents are encrypted and stored in our secure cloud vault. Access them anytime from your client portal." },
    { q: "How long are documents retained?", a: "Documents are retained indefinitely while your account is active. Notary journal entries are kept per Ohio law (minimum 5 years)." },
    { q: "Can I access my vault anytime?", a: "Yes. Log into your client portal to view, download, or share your stored documents 24/7." },
  ],
  "immigration": [
    { q: "What forms can a notary help with?", a: "A notary can administer oaths, witness signatures, and certify copies for USCIS forms including I-130, I-485, I-765, N-400, I-90, I-131, I-864, and DS-160." },
    { q: "Can a notary provide legal advice?", a: "No. A notary cannot provide legal advice, fill out forms for you, or represent you before USCIS. Consult an immigration attorney." },
    { q: "Which USCIS forms require notarization?", a: "Most forms with affidavits (like I-864 Affidavit of Support) require notarization. Translations also typically need a notarized certificate of accuracy." },
    { q: "What's the notary's role vs. an attorney?", a: "The notary verifies identity and witnesses signatures. An attorney provides legal advice and represents you." },
  ],
  "translation": [
    { q: "What languages do you support?", a: "We support 18+ languages including Spanish, French, German, Chinese, Japanese, Korean, Arabic, Russian, Vietnamese, Tagalog, and more." },
    { q: "Is AI translation accurate enough for official use?", a: "Our AI-assisted translations are reviewed for accuracy. For USCIS submissions, a notarized Certificate of Translation Accuracy is included." },
    { q: "Do you provide certified translations?", a: "Yes. Every translation includes a Certificate of Translation Accuracy that can be notarized for official submissions." },
    { q: "How long does translation take?", a: "Most documents are translated within 1-2 business days. Simple documents can be same-day." },
  ],
};

// Phase 3.2: Category-specific FAQs
const categoryFaqs: Record<string, { q: string; a: string }[]> = {
  authentication: [
    { q: "What is an apostille?", a: "An apostille is a certificate that authenticates a document for use in countries that are part of the Hague Apostille Convention. It's issued by the Ohio Secretary of State." },
    { q: "How long does apostille processing take?", a: "Standard processing takes 5-10 business days from submission to the Ohio SOS. Rush processing (2-3 days) is available for an additional fee." },
    { q: "Hague vs. Non-Hague countries?", a: "Hague Convention member countries accept apostilles directly. For non-member countries, you'll need consular legalization (authentication by the embassy), which takes longer." },
    { q: "What documents can be apostilled?", a: "Birth certificates, marriage certificates, articles of incorporation, court documents, notarized documents, and other official documents. The document must first be notarized if it's not already an official government document." },
  ],
  consulting: [
    { q: "What consulting services do you offer?", a: "RON onboarding and training, workflow audits, custom workflow design, closing coordination, and immigration document assistance." },
    { q: "How do consultations work?", a: "Most consultations are conducted via Zoom. Book a session and we'll discuss your specific needs and provide personalized guidance." },
    { q: "Can you help me set up a notary business?", a: "Yes. Our RON onboarding and workflow services help new and experienced notaries optimize their operations." },
    { q: "Do you provide ongoing support?", a: "Yes. We offer follow-up sessions and can design custom recurring support packages for your business." },
  ],
  verification: [
    { q: "When must the I-9 be completed?", a: "Section 1 must be completed by the employee's first day of work. Section 2 must be completed within 3 business days of the start date." },
    { q: "What are acceptable I-9 documents?", a: "You need ONE List A document (U.S. Passport, Passport Card, Permanent Resident Card/Green Card, Employment Authorization Document/EAD I-766, or Foreign passport with I-94) — which proves both identity AND work authorization. OR you can bring ONE List B document (driver's license, state ID, school ID with photo, voter registration card, or U.S. military card) PLUS ONE List C document (unrestricted Social Security card, U.S. birth certificate, or Certification of Birth Abroad FS-545/DS-1350)." },
    { q: "Can I-9 verification be done remotely?", a: "DHS has authorized remote document examination as an alternative procedure. However, in-person physical examination is still the standard method." },
    { q: "What is the notary's role in I-9?", a: "The notary acts as an authorized representative to examine the employee's identity and work authorization documents in Section 2. The notary does not provide legal advice — for immigration questions, consult an attorney." },
  ],
  notarization: [
    { q: "What is RON?", a: "Remote Online Notarization (RON) allows you to have documents notarized via a secure video call. Ohio authorizes RON under ORC §147.65-.66." },
    { q: "Am I eligible for RON?", a: "Most people are eligible. You'll need a valid government ID, a computer with camera/microphone, and stable internet. Some document types have restrictions." },
    { q: "What do I need for RON?", a: "A government-issued photo ID, computer with webcam and mic, stable internet connection, and the documents to be notarized in digital format." },
    { q: "What is notarization?", a: "Notarization is a fraud-deterrent process where a state-commissioned notary verifies the identity of signers and witnesses their signatures on important documents." },
    { q: "What ID do I need?", a: "A valid, unexpired government-issued photo ID such as a driver's license, state ID card, or passport." },
  ],
  document_services: [
    { q: "What file formats do you accept?", a: "PDF, Word (.doc/.docx), images (JPG, PNG, TIFF), and most common document formats." },
    { q: "How long does digitization take?", a: "Most documents are processed within 1-3 business days. Rush service is available." },
    { q: "Can you preserve original formatting?", a: "Yes. Our AI-powered OCR preserves headings, paragraphs, tables, lists, and formatting from the original." },
    { q: "How do I access my digitized documents?", a: "Digitized documents are saved to your secure vault in the client portal." },
  ],
  business: [
    { q: "Do you offer volume discounts?", a: "Yes. Contact us for custom pricing on bulk notarization and recurring services." },
    { q: "Can I set up a recurring schedule?", a: "Yes. We offer subscription plans for businesses with regular notarization needs." },
    { q: "Do you support multiple authorized signers?", a: "Yes. Business accounts can register multiple authorized signers with verified identities." },
    { q: "What industries do you serve?", a: "Real estate, legal, healthcare, financial services, education, and more." },
  ],
  recurring: [
    { q: "How does document storage work?", a: "Encrypted cloud storage accessible 24/7 from your client portal." },
    { q: "How long are documents retained?", a: "Documents are retained indefinitely while your account is active." },
    { q: "Can I access my vault anytime?", a: "Yes. Your portal is available 24/7 for viewing, downloading, and sharing documents." },
    { q: "How are compliance reminders configured?", a: "Set custom reminders for document renewals, filing deadlines, and notary commission expiration." },
  ],
};

// Phase 3.4: Timeline estimates (items 147-153)
const categoryTimelines: Record<string, string> = {
  notarization: "Same day",
  authentication: "5-10 business days",
  verification: "Within 3 days of hire",
  consulting: "Varies by case",
  document_services: "1-3 business days",
  business: "Custom timeline",
  recurring: "Ongoing",
  admin_support: "3-5 business days",
  content_creation: "3-7 business days",
  research: "5-10 business days",
  customer_service: "1-3 business days setup",
  technical_support: "1-3 business days",
  ux_testing: "5-14 business days",
  business_services: "2-5 business days",
};

// Phase 3.6: Complexity indicators (items 154-160)
const categoryComplexity: Record<string, { level: string; duration: string }> = {
  notarization: { level: "Simple", duration: "10-30 min" },
  authentication: { level: "Complex", duration: "5-10 business days" },
  verification: { level: "Moderate", duration: "15-30 min" },
  consulting: { level: "Complex", duration: "30-60 min session" },
  document_services: { level: "Simple", duration: "1-3 days" },
  business: { level: "Moderate", duration: "Custom" },
  recurring: { level: "Simple", duration: "Ongoing" },
  admin_support: { level: "Simple", duration: "1-5 days" },
  content_creation: { level: "Moderate", duration: "3-7 days" },
  research: { level: "Complex", duration: "5-10 days" },
  customer_service: { level: "Moderate", duration: "Ongoing" },
  technical_support: { level: "Moderate", duration: "1-5 days" },
  ux_testing: { level: "Complex", duration: "1-2 weeks" },
  business_services: { level: "Simple", duration: "Ongoing" },
};

// Phase 3.8: Bundle suggestions
const bundleSuggestions: Record<string, string[]> = {
  authentication: ["Translation Coordination", "Certified Copy", "Document Preparation"],
  notarization: ["Witness Service", "Certified Copy", "Document Storage Vault"],
  verification: ["Document Preparation", "Certified Copy"],
  consulting: ["Translation Coordination", "Apostille Facilitation", "Document Preparation"],
};

// Phase 3.3: Legal disclaimers
const LEGAL_DISCLAIMER_CATEGORIES = ["consulting", "authentication"];

interface ServiceData {
  id: string; name: string; category: string; description: string | null;
  short_description: string | null; price_from: number | null; price_to: number | null;
  pricing_model: string; icon: string | null;
}

interface Requirement {
  id: string; description: string; requirement_type: string; is_required: boolean;
  ohio_statute_ref: string | null; display_order: number;
}

interface WorkflowStep {
  id: string; step_number: number; step_name: string; step_description: string | null;
  requires_client_action: boolean; requires_admin_action: boolean;
}

const PRE_QUALIFY_CATEGORIES = ["authentication", "consulting", "verification"];

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceData | null>(null);
  const [allServices, setAllServices] = useState<ServiceData[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [relatedServices, setRelatedServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showPreQualifier, setShowPreQualifier] = useState(false);
  usePageTitle(service?.name || "Service Details");

  useEffect(() => {
    if (!serviceId) return;
    const load = async () => {
      setLoading(true);
      const [svcRes, reqRes, wfRes] = await Promise.all([
        supabase.from("services").select("*").eq("id", serviceId).eq("is_active", true).single(),
        supabase.from("service_requirements").select("*").eq("service_id", serviceId).order("display_order"),
        supabase.from("service_workflows").select("*").eq("service_id", serviceId).order("step_number"),
      ]);
      if (svcRes.data) {
        setService(svcRes.data as ServiceData);
        const [relRes, allSvcRes] = await Promise.all([
          supabase.from("services").select("*").eq("is_active", true).eq("category", svcRes.data.category).neq("id", serviceId).limit(3),
          supabase.from("services").select("id, name, category").eq("is_active", true),
        ]);
        setRelatedServices((relRes.data || []) as ServiceData[]);
        setAllServices((allSvcRes.data || []) as ServiceData[]);
      } else {
        setService(null);
        setLoading(false);
        return;
      }
      setRequirements((reqRes.data || []) as Requirement[]);
      setWorkflow((wfRes.data || []) as WorkflowStep[]);
      setCheckedItems(new Set());
      setLoading(false);
    };
    load();
  }, [serviceId]);

  // AI Chat handler
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("client-assistant", {
        body: {
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: `Service: ${service?.name}. Category: ${service?.category}. Description: ${service?.description || ""}`,
        },
      });
      if (error) throw error;
      const reply = data?.choices?.[0]?.message?.content || data?.reply || "I'm sorry, I couldn't process that request.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "AI assistant is temporarily unavailable. Please contact us directly." }]);
    }
    setChatLoading(false);
  };

  // Bundle link lookup helper
  const getBundleServiceId = (name: string) => {
    const match = allServices.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
    return match ? `/services/${match.id}` : `/services`;
  };


  const formatPrice = (s: ServiceData) => {
    if (s.pricing_model === "custom") return "Custom Quote";
    const from = Number(s.price_from || 0);
    const to = Number(s.price_to || 0);
    if (from === 0 && to === 0) return "Contact Us";
    const suffix = s.pricing_model === "monthly" ? "/mo" : "";
    return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="font-sans text-2xl font-bold">Service Not Found</h1>
        <p className="text-muted-foreground">This service may no longer be available.</p>
        <Link to="/services"><Button variant="outline"><ChevronLeft className="mr-1 h-4 w-4" /> Back to Services</Button></Link>
      </div>
    );
  }

  const IconComp = iconMap[service.icon || "FileText"] || FileText;
  // Get service-specific resources for consulting (immigration vs non-immigration)
  const getResources = () => {
    if (service.category === "consulting" && (service.name.toLowerCase().includes("immigration") || service.name.toLowerCase().includes("uscis"))) {
      return [
        { label: "USCIS Forms Portal", url: "https://www.uscis.gov/forms/all-forms", icon: ExternalLink },
        { label: "Common USCIS Forms", url: "https://www.uscis.gov/forms", icon: FileText },
      ];
    }
    return categoryResources[service.category] || categoryResources.notarization;
  };
  const resources = getResources();

  // Try service-specific FAQs first, then fall back to category
  const getServiceFaqs = () => {
    const nameLower = service.name.toLowerCase();
    for (const [key, faqs] of Object.entries(serviceFaqs)) {
      if (nameLower.includes(key)) return faqs;
    }
    return categoryFaqs[service.category] || categoryFaqs.notarization;
  };
  const faqs = getServiceFaqs();
  const timeline = categoryTimelines[service.category] || "Contact Us";
  const complexity = categoryComplexity[service.category] || { level: "Moderate", duration: "Varies" };
  const bundles = bundleSuggestions[service.category] || [];
  const showDisclaimer = LEGAL_DISCLAIMER_CATEGORIES.includes(service.category);
  const bookUrl = `/book?service=${encodeURIComponent(service.name)}${!["notarization", "authentication"].includes(service.category) ? "&type=in_person" : ""}`;

  const readinessPercent = requirements.length > 0 
    ? Math.round((checkedItems.size / requirements.filter(r => r.is_required).length) * 100)
    : 0;

  return (
    <PageShell>
      <div className="container mx-auto max-w-4xl px-4 pt-4"><Breadcrumbs /></div>
      {/* Hero with complexity & timeline badges (Phase 3.4, 3.6) */}
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
              <IconComp className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 text-primary">{service.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                <Badge variant="outline" className="text-primary-foreground/60 border-primary-foreground/20 text-xs">
                  <Clock className="mr-1 h-3 w-3" /> {timeline}
                </Badge>
                <Badge variant="outline" className={`text-xs border-primary-foreground/20 ${
                  complexity.level === "Simple" ? "text-primary" : complexity.level === "Complex" ? "text-amber-300" : "text-blue-300"
                }`}>
                  {complexity.level} · {complexity.duration}
                </Badge>
              </div>
              <h1 className="mb-2 font-sans text-3xl font-bold text-primary-foreground md:text-4xl">{service.name}</h1>
              <p className="text-primary-foreground/70">{service.description || service.short_description}</p>
              <div className="mt-4 flex items-center gap-3">
                <Badge variant="outline" className="text-primary-foreground/80 border-primary-foreground/20 text-base px-3 py-1">{formatPrice(service)}</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Phase 3.3: Legal disclaimer */}
      {showDisclaimer && (
        <div className="border-b border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30">
          <div className="container mx-auto max-w-4xl px-4 py-3">
            <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <strong>Disclaimer:</strong> This service does not constitute legal advice. A notary can administer oaths, witness signatures, and certify copies but cannot provide legal counsel. Consult an attorney for specific legal questions.
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Phase 3.5: Interactive readiness checklist */}
            {requirements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-sans text-xl font-bold">Preparation Checklist</h2>
                  {requirements.filter(r => r.is_required).length > 0 && (
                    <Badge variant="outline" className={readinessPercent === 100 ? "border-primary text-primary" : ""}>
                      {readinessPercent}% ready
                    </Badge>
                  )}
                </div>
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    {requirements.map(req => (
                      <div key={req.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={checkedItems.has(req.id)}
                          onCheckedChange={(checked) => {
                            setCheckedItems(prev => {
                              const next = new Set(prev);
                              if (checked) next.add(req.id); else next.delete(req.id);
                              return next;
                            });
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className={`text-sm ${checkedItems.has(req.id) ? "line-through text-muted-foreground" : ""}`}>
                            {req.description}
                            {!req.is_required && <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>}
                          </p>
                          {req.ohio_statute_ref && (
                            <p className="text-xs text-muted-foreground mt-0.5">Ref: {req.ohio_statute_ref}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Phase 3.7: Visual workflow timeline */}
            {workflow.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="mb-4 font-sans text-xl font-bold">How It Works</h2>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {workflow.map((wfStep, i) => (
                      <div key={wfStep.id} className="relative flex items-start gap-4 pl-0">
                        <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 border-2 border-accent">
                          <span className="font-sans text-xs font-bold text-primary">{wfStep.step_number}</span>
                        </div>
                        <div className="flex-1 pb-2">
                          <h3 className="font-sans font-semibold text-sm">{wfStep.step_name}</h3>
                          {wfStep.step_description && <p className="text-xs text-muted-foreground mt-0.5">{wfStep.step_description}</p>}
                          <div className="mt-1 flex gap-1">
                            {wfStep.requires_client_action && (
                              <Badge variant="secondary" className="text-xs gap-1"><User className="h-3 w-3" /> Your action</Badge>
                            )}
                            {wfStep.requires_admin_action && (
                              <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" /> Notary action</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Phase 3.2: Category-specific FAQs */}
            {faqs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="mb-4 font-sans text-xl font-bold">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                      <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            )}

            {/* Partner Services for Estate Planning */}
            {(service.name.toLowerCase().includes("will") || service.name.toLowerCase().includes("estate") || service.name.toLowerCase().includes("trust")) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-sans text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600" /> Partner Services
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Complex estate planning documents such as wills, trusts, and advanced directives are drafted in partnership with licensed attorneys. We provide notarization, witnessing, and coordination services.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>How it works:</strong> We connect you with our legal partners who draft your documents, then we handle the notarization and witnessing. This ensures your documents are legally sound and properly executed.
                    </p>
                    <p className="text-xs italic text-muted-foreground">
                      Will drafting and legal document creation are performed by our legal partners. Notar Services provides notarization, witnessing, and coordination only.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Zoom consultation CTA on ALL service pages */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-sans text-sm font-semibold flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" /> Have Questions?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Schedule a free Zoom consultation to discuss this service and get personalized guidance.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Or message us for a response within 24 hours — we typically respond within 2 hours during business hours.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can also <Link to="/digitize" className="text-primary underline">upload your document</Link> for instant AI-powered answers about what's needed.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Link to="/book?service=Consultation"><Button size="sm" className=""><Monitor className="mr-1 h-3 w-3" /> Schedule Zoom</Button></Link>
                    <Link to="/notary-guide"><Button size="sm" variant="outline">Browse Guides</Button></Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* I-9 Acceptable Documents (List A/B/C) for verification services */}
            {service.category === "verification" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-sans text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" /> Acceptable I-9 Documents
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-3">
                      <div>
                        <p className="font-semibold text-foreground">List A — Proves Identity AND Work Authorization (need ONE):</p>
                        <ul className="ml-4 list-disc mt-1">
                          <li>U.S. Passport or Passport Card</li>
                          <li>Permanent Resident Card (Green Card / I-551)</li>
                          <li>Employment Authorization Document (EAD / I-766)</li>
                          <li>Foreign passport with I-94 arrival/departure record</li>
                        </ul>
                      </div>
                      <p className="font-semibold text-foreground text-center">— OR bring BOTH —</p>
                      <div>
                        <p className="font-semibold text-foreground">List B — Proves Identity (need ONE):</p>
                        <ul className="ml-4 list-disc mt-1">
                          <li>Driver's license or state-issued ID card</li>
                          <li>School ID card with photograph</li>
                          <li>Voter registration card</li>
                          <li>U.S. military card or draft record</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">PLUS List C — Proves Work Authorization (need ONE):</p>
                        <ul className="ml-4 list-disc mt-1">
                          <li>Social Security card (unrestricted)</li>
                          <li>U.S. birth certificate (original or certified copy)</li>
                          <li>Certification of Birth Abroad (FS-545 or DS-1350)</li>
                          <li>U.S. Citizen ID Card (I-197 or I-179)</li>
                        </ul>
                      </div>
                    </div>
                    <a href="https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs"><ExternalLink className="mr-1 h-3 w-3" /> Full USCIS Document List</Button>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {/* Immigration-specific content — only for immigration consulting */}
            {service.category === "consulting" && (service.name.toLowerCase().includes("immigration") || service.name.toLowerCase().includes("uscis")) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-sans text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" /> Important: Notary Role Clarification
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      A notary can administer oaths, witness signatures, and certify copies. A notary <strong>cannot</strong> provide legal advice, fill out forms for you, or represent you before USCIS. For legal counsel, please consult a licensed immigration attorney.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We provide service in English. For translations, please bring your own certified translator or request our Translation Coordination service.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {showPreQualifier && service ? (
              <ServicePreQualifier
                category={service.category}
                serviceName={service.name}
                onComplete={(params) => {
                  setShowPreQualifier(false);
                  const extra = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
                  navigate(`${bookUrl}${extra ? "&" + extra : ""}`);
                }}
                onCancel={() => setShowPreQualifier(false)}
              />
            ) : (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-sans text-lg font-semibold">Ready to Get Started?</h3>
                  {(() => {
                    const SAAS_LINKS: Record<string, string> = {
                      "Document Storage Vault": "/portal", "Cloud Document Storage": "/portal",
                      "PDF Services": "/digitize", "Document Digitization": "/digitize",
                      "Document Translation": "/digitize", "Document Scanning & Digitization": "/digitize",
                      "Template Library & Form Builder": "/templates", "Virtual Mailroom": "/mailroom",
                      "ID Verification / KYC Checks": "/verify-id",
                    };
                    const INTAKE_ONLY = new Set([
                      "Apostille Facilitation","Consular Legalization Prep","Background Check Coordination",
                      "Clerical Document Preparation","Document Cleanup & Formatting","Form Filling Assistance",
                      "Certified Document Prep for Agencies","Registered Agent Coordination",
                      "Email Management & Correspondence","Notarized Translation Coordination",
                    ]);
                    const SUBSCRIPTION = new Set(["Business Subscription Plans","API & Integration Services","White-Label Partner Programs"]);

                    if (SAAS_LINKS[service.name]) {
                      return (
                        <Link to={SAAS_LINKS[service.name]} className="block">
                          <Button className="w-full " size="lg">
                            Use This Service <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      );
                    }
                    if (INTAKE_ONLY.has(service.name)) {
                      return (
                        <Link to={`/request?service=${encodeURIComponent(service.name)}`} className="block">
                          <Button className="w-full " size="lg">
                            Get Started <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      );
                    }
                    if (SUBSCRIPTION.has(service.name)) {
                      return (
                        <Link to="/subscribe" className="block">
                          <Button className="w-full " size="lg">
                            View Plans <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      );
                    }
                    if (PRE_QUALIFY_CATEGORIES.includes(service?.category || "")) {
                      return (
                        <Button className="w-full " size="lg" onClick={() => setShowPreQualifier(true)}>
                          Book This Service <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      );
                    }
                    return (
                      <Link to={bookUrl} className="block">
                        <Button className="w-full " size="lg">
                          {["notarization", "authentication", "verification"].includes(service.category) ? "Book This Service" : "Get Started"} <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    );
                  })()}
                  <Link to="/#contact" className="block">
                    <Button variant="outline" className="w-full">Contact Us</Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Mon–Wed 10 AM – 7 PM · Responses within 2 hours
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Phase 3.1: Dynamic resource links */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="font-sans text-sm font-semibold mb-3">Helpful Resources</h3>
                <div className="space-y-2 text-sm">
                  {resources.map((r, i) => (
                    <a key={i} href={r.url} target={r.url.startsWith("http") ? "_blank" : undefined} rel={r.url.startsWith("http") ? "noreferrer" : undefined} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      {r.url.startsWith("http") ? <ExternalLink className="h-3 w-3" /> : <r.icon className="h-3 w-3" />}
                      {r.label}
                    </a>
                  ))}
                  <Link to="/fee-calculator" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Shield className="h-3 w-3" /> Fee Calculator
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Phase 3.8: Bundle suggestions */}
            {bundles.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-sans text-sm font-semibold mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-primary" /> Often Paired With
                  </h3>
                  <div className="space-y-2 text-sm">
                    {bundles.map((b, i) => (
                      <Link key={i} to={getBundleServiceId(b)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowRight className="h-3 w-3" /> {b}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-sans text-xl font-bold">Related Services</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedServices.map(s => {
                const Icon = iconMap[s.icon || "FileText"] || FileText;
                return (
                  <Link key={s.id} to={`/services/${s.id}`}>
                    <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <Icon className="mb-2 h-5 w-5 text-primary" />
                        <h3 className="font-sans text-sm font-semibold mb-1">{s.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{s.short_description || s.description}</p>
                        <p className="mt-2 text-xs font-medium text-primary flex items-center gap-1">Learn More <ArrowRight className="h-3 w-3" /></p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Bubble */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-colors"
        aria-label="Ask a question about this service"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {showChat && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-lg border border-border bg-card shadow-2xl flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Ask About {service.name}
            </span>
            <button onClick={() => setShowChat(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[150px]">
            {chatMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Ask any question about {service.name} and our AI will help you.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`text-xs rounded-lg p-2 ${msg.role === "user" ? "bg-primary/10 text-foreground ml-6" : "bg-muted text-foreground mr-6"}`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && <div className="text-xs text-muted-foreground animate-pulse">Thinking...</div>}
          </div>
          <div className="border-t border-border p-2 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChatMessage()}
              placeholder="Type a question..."
              className="flex-1 bg-transparent text-sm outline-none px-2"
            />
            <Button size="sm" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

    </PageShell>
  );
}
