import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense, ReactNode } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { CommandPalette } from "@/components/CommandPalette";
import { CookieConsent } from "@/components/CookieConsent";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Eager load critical pages
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// Lazy load everything else with retry
function lazyRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() =>
    factory().catch(() =>
      new Promise<{ default: React.ComponentType<any> }>(resolve =>
        setTimeout(() => resolve(factory()), 200)
      )
    )
  );
}

const Index = lazyRetry(() => import("./pages/Index"));
const ResetPassword = lazyRetry(() => import("./pages/ForgotPassword"));
const BookAppointment = lazyRetry(() => import("./pages/BookAppointment"));
const ClientPortal = lazyRetry(() => import("./pages/ClientPortal"));
const RonSession = lazyRetry(() => import("./pages/RonSession"));
const NotaryGuide = lazyRetry(() => import("./pages/NotaryGuide"));
const RonInfo = lazyRetry(() => import("./pages/RonInfo"));
const DocumentTemplates = lazyRetry(() => import("./pages/DocumentTemplates"));
const DocumentBuilder = lazyRetry(() => import("./pages/DocumentBuilder"));
const FeeCalculator = lazyRetry(() => import("./pages/FeeCalculator"));
const BusinessPortal = lazyRetry(() => import("./pages/BusinessPortal"));
const Services = lazyRetry(() => import("./pages/Services"));
const VerifySeal = lazyRetry(() => import("./pages/VerifySeal"));
const TermsPrivacy = lazyRetry(() => import("./pages/TermsPrivacy"));
const AppointmentConfirmation = lazyRetry(() => import("./pages/AppointmentConfirmation"));
const RonEligibilityChecker = lazyRetry(() => import("./pages/RonEligibilityChecker"));
const LoanSigningServices = lazyRetry(() => import("./pages/LoanSigningServices"));
const ServiceDetail = lazyRetry(() => import("./pages/ServiceDetail"));
const About = lazyRetry(() => import("./pages/About"));
const DocumentDigitize = lazyRetry(() => import("./pages/DocumentDigitize"));
const JoinPlatform = lazyRetry(() => import("./pages/JoinPlatform"));
const ServiceRequest = lazyRetry(() => import("./pages/ServiceRequest"));
const VirtualMailroom = lazyRetry(() => import("./pages/VirtualMailroom"));
const SubscriptionPlans = lazyRetry(() => import("./pages/SubscriptionPlans"));
const VerifyIdentity = lazyRetry(() => import("./pages/VerifyIdentity"));
const MobileUpload = lazyRetry(() => import("./pages/MobileUpload"));
const AIWriter = lazyRetry(() => import("./pages/AIWriter"));
const AIExtractors = lazyRetry(() => import("./pages/AIExtractors"));
const AIKnowledge = lazyRetry(() => import("./pages/AIKnowledge"));
const SignatureGeneratorPage = lazyRetry(() => import("./pages/SignatureGeneratorPage"));
const GrantDashboard = lazyRetry(() => import("./pages/GrantDashboard"));
const ResumeBuilder = lazyRetry(() => import("./pages/ResumeBuilder"));
const AITools = lazyRetry(() => import("./pages/AITools"));
const DocuDex = lazyRetry(() => import("./pages/DocuDex"));
const SessionTracker = lazyRetry(() => import("./pages/SessionTracker"));
const RescheduleAppointment = lazyRetry(() => import("./pages/RescheduleAppointment"));
const PrintMarketplace = lazyRetry(() => import("./pages/PrintMarketplace"));
const PricingMenu = lazyRetry(() => import("./pages/PricingMenu"));
const DesignStudio = lazyRetry(() => import("./pages/DesignStudio"));
const BusinessCardDesigner = lazyRetry(() => import("./pages/design/BusinessCardDesigner"));
const StickerDesigner = lazyRetry(() => import("./pages/design/StickerDesigner"));
const NotebookConfigurator = lazyRetry(() => import("./pages/design/NotebookConfigurator"));
const BookCoverDesigner = lazyRetry(() => import("./pages/design/BookCoverDesigner"));
const LetterheadDesigner = lazyRetry(() => import("./pages/design/LetterheadDesigner"));
const ApparelDesigner = lazyRetry(() => import("./pages/design/ApparelDesigner"));
const SignageDesigner = lazyRetry(() => import("./pages/design/SignageDesigner"));
const PromoDesigner = lazyRetry(() => import("./pages/design/PromoDesigner"));
const VendorPortal = lazyRetry(() => import("./pages/VendorPortal"));

// Admin pages
const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminOverview = lazyRetry(() => import("./pages/admin/AdminOverview"));
const AdminAppointments = lazyRetry(() => import("./pages/admin/AdminAppointments"));
const AdminClients = lazyRetry(() => import("./pages/admin/AdminClients"));
const AdminAvailability = lazyRetry(() => import("./pages/admin/AdminAvailability"));
const AdminDocuments = lazyRetry(() => import("./pages/admin/AdminDocuments"));
const AdminJournal = lazyRetry(() => import("./pages/admin/AdminJournal"));
const AdminRevenue = lazyRetry(() => import("./pages/admin/AdminRevenue"));
const AdminSettings = lazyRetry(() => import("./pages/admin/AdminSettings"));
const AdminResources = lazyRetry(() => import("./pages/admin/AdminResources"));
const AdminAIAssistant = lazyRetry(() => import("./pages/admin/AdminAIAssistant"));
const AdminAuditLog = lazyRetry(() => import("./pages/admin/AdminAuditLog"));
const AdminTemplates = lazyRetry(() => import("./pages/admin/AdminTemplates"));
const AdminApostille = lazyRetry(() => import("./pages/admin/AdminApostille"));
const AdminChat = lazyRetry(() => import("./pages/admin/AdminChat"));
const AdminBusinessClients = lazyRetry(() => import("./pages/admin/AdminBusinessClients"));
const AdminServices = lazyRetry(() => import("./pages/admin/AdminServices"));
const AdminTeam = lazyRetry(() => import("./pages/admin/AdminTeam"));
const AdminEmailManagement = lazyRetry(() => import("./pages/admin/AdminEmailManagement"));
const AdminLeadPortal = lazyRetry(() => import("./pages/admin/AdminLeadPortal"));
const AdminUsers = lazyRetry(() => import("./pages/admin/AdminUsers"));
const NotaryProcessGuide = lazyRetry(() => import("./pages/NotaryProcessGuide"));
const AdminIntegrationTest = lazyRetry(() => import("./pages/admin/AdminIntegrationTest"));
const AdminServiceRequests = lazyRetry(() => import("./pages/admin/AdminServiceRequests"));
const AccountSettings = lazyRetry(() => import("./pages/AccountSettings"));
const AdminContentWorkspace = lazyRetry(() => import("./pages/admin/AdminContentWorkspace"));
const AdminTaskQueue = lazyRetry(() => import("./pages/admin/AdminTaskQueue"));
const AdminCRM = lazyRetry(() => import("./pages/admin/AdminCRM"));
const AdminBuildTracker = lazyRetry(() => import("./pages/admin/AdminBuildTracker"));
const AdminDocuDexPro = lazyRetry(() => import("./pages/admin/AdminDocuDexPro"));
const AdminProcessFlows = lazyRetry(() => import("./pages/admin/AdminProcessFlows"));
const AdminClientEmails = lazyRetry(() => import("./pages/admin/AdminClientEmails"));
const AdminMailbox = lazyRetry(() => import("./pages/admin/AdminMailbox"));
const Unsubscribe = lazyRetry(() => import("./pages/Unsubscribe"));
const AdminWebhooks = lazyRetry(() => import("./pages/admin/AdminWebhooks"));
const AdminPerformance = lazyRetry(() => import("./pages/admin/AdminPerformance"));
const AdminNotaryPages = lazyRetry(() => import("./pages/admin/AdminNotaryPages"));
const AdminNotaryApproval = lazyRetry(() => import("./pages/admin/AdminNotaryApproval"));
const AdminProfessionals = lazyRetry(() => import("./pages/admin/AdminProfessionals"));
const AdminComplianceReport = lazyRetry(() => import("./pages/admin/AdminComplianceReport"));
const AdminAutomatedEmails = lazyRetry(() => import("./pages/admin/AdminAutomatedEmails"));
const AdminFinances = lazyRetry(() => import("./pages/admin/AdminFinances"));
const AdminEmailHealth = lazyRetry(() => import("./pages/admin/AdminEmailHealth"));
const AdminRonRecordings = lazyRetry(() => import("./pages/admin/AdminRonRecordings"));
const AdminLoanSigning = lazyRetry(() => import("./pages/admin/AdminLoanSigning"));
const AdminI9Verifications = lazyRetry(() => import("./pages/admin/AdminI9Verifications"));
const AdminPrintJobs = lazyRetry(() => import("./pages/admin/AdminPrintJobs"));
const AdminFingerprinting = lazyRetry(() => import("./pages/admin/AdminFingerprinting"));
const AdminProcessServing = lazyRetry(() => import("./pages/admin/AdminProcessServing"));
const AdminSkipTracing = lazyRetry(() => import("./pages/admin/AdminSkipTracing"));
const AdminVitalRecords = lazyRetry(() => import("./pages/admin/AdminVitalRecords"));
const AdminScrivener = lazyRetry(() => import("./pages/admin/AdminScrivener"));
const AdminTranslations = lazyRetry(() => import("./pages/admin/AdminTranslations"));
const AdminCourier = lazyRetry(() => import("./pages/admin/AdminCourier"));
const AdminVATasks = lazyRetry(() => import("./pages/admin/AdminVATasks"));
const AdminBackgroundChecks = lazyRetry(() => import("./pages/admin/AdminBackgroundChecks"));
const AdminIdentityCertificates = lazyRetry(() => import("./pages/admin/AdminIdentityCertificates"));
const AdminRecorderFilings = lazyRetry(() => import("./pages/admin/AdminRecorderFilings"));
const AdminSOSFilings = lazyRetry(() => import("./pages/admin/AdminSOSFilings"));
const AdminRealEstate = lazyRetry(() => import("./pages/admin/AdminRealEstate"));
const AdminPrintOrders = lazyRetry(() => import("./pages/admin/AdminPrintOrders"));
const AdminCourtForms = lazyRetry(() => import("./pages/admin/AdminCourtForms"));
const AdminPermitFilings = lazyRetry(() => import("./pages/admin/AdminPermitFilings"));
const AdminComplianceCalendars = lazyRetry(() => import("./pages/admin/AdminComplianceCalendars"));
const AdminVendors = lazyRetry(() => import("./pages/admin/AdminVendors"));
const AdminPrintPricing = lazyRetry(() => import("./pages/admin/AdminPrintPricing"));
const AdminPricing = lazyRetry(() => import("./pages/admin/AdminPricing"));
const AdminOrders = lazyRetry(() => import("./pages/admin/AdminOrders"));
const AdminAnalytics = lazyRetry(() => import("./pages/admin/AdminAnalytics"));
const AdminContractors = lazyRetry(() => import("./pages/admin/AdminContractors"));
const AdminPrintInventory = lazyRetry(() => import("./pages/admin/AdminPrintInventory"));
const AdminUXConsulting = lazyRetry(() => import("./pages/admin/AdminUXConsulting"));
const AdminBusinessFormation = lazyRetry(() => import("./pages/admin/AdminBusinessFormation"));
const AdminEstatePlanning = lazyRetry(() => import("./pages/admin/AdminEstatePlanning"));
const AdminNotaryTraining = lazyRetry(() => import("./pages/admin/AdminNotaryTraining"));
const AdminContractorOnboarding = lazyRetry(() => import("./pages/admin/AdminContractorOnboarding"));
const AdminReferralNetwork = lazyRetry(() => import("./pages/admin/AdminReferralNetwork"));
const AdminImmigration = lazyRetry(() => import("./pages/admin/AdminImmigration"));
const AdminTaxReferral = lazyRetry(() => import("./pages/admin/AdminTaxReferral"));
const AdminInsurance = lazyRetry(() => import("./pages/admin/AdminInsurance"));
const AdminMediation = lazyRetry(() => import("./pages/admin/AdminMediation"));
const AdminPhotography = lazyRetry(() => import("./pages/admin/AdminPhotography"));
const AdminContractorRegistration = lazyRetry(() => import("./pages/admin/AdminContractorRegistration"));
const AdminPowerOfAttorney = lazyRetry(() => import("./pages/admin/AdminPowerOfAttorney"));
const AdminNotaryCompliance = lazyRetry(() => import("./pages/admin/AdminNotaryCompliance"));
const AdminPromoCodeManager = lazyRetry(() => import("./pages/admin/AdminPromoCodeManager"));
const AdminSystemHealth = lazyRetry(() => import("./pages/admin/AdminSystemHealth"));
const TrackApostille = lazyRetry(() => import("./pages/TrackApostille"));
const AdminRecordingArchive = lazyRetry(() => import("./pages/admin/AdminRecordingArchive"));
const AdminRonDashboard = lazyRetry(() => import("./pages/admin/AdminRonDashboard"));
const AdminOathAdministration = lazyRetry(() => import("./pages/admin/AdminOathAdministration"));
const AdminCertifiedCopies = lazyRetry(() => import("./pages/admin/AdminCertifiedCopies"));
const AdminTravelZones = lazyRetry(() => import("./pages/admin/AdminTravelZones"));
const AdminWitnesses = lazyRetry(() => import("./pages/admin/AdminWitnesses"));
const ContractorRegistration = lazyRetry(() => import("./pages/ContractorRegistration"));
const OrderTracking = lazyRetry(() => import("./pages/OrderTracking"));
const AdminOperations = lazyRetry(() => import("./pages/admin/AdminOperations"));
const AdminSecurityCenter = lazyRetry(() => import("./pages/admin/AdminSecurityCenter"));
const NotaryGlossary = lazyRetry(() => import("./pages/NotaryGlossary"));
const Maintenance = lazyRetry(() => import("./pages/Maintenance"));
const ForNotaries = lazyRetry(() => import("./pages/solutions/ForNotaries"));
const ForHospitals = lazyRetry(() => import("./pages/solutions/ForHospitals"));
const ForRealEstate = lazyRetry(() => import("./pages/solutions/ForRealEstate"));
const ForLawFirms = lazyRetry(() => import("./pages/solutions/ForLawFirms"));
const ForSmallBusiness = lazyRetry(() => import("./pages/solutions/ForSmallBusiness"));
const ForIndividuals = lazyRetry(() => import("./pages/solutions/ForIndividuals"));
const Resources = lazyRetry(() => import("./pages/Resources"));
const HelpSupport = lazyRetry(() => import("./pages/HelpSupport"));
const SignerRights = lazyRetry(() => import("./pages/SignerRights"));
const NotaryCertificates = lazyRetry(() => import("./pages/NotaryCertificates"));
const Compliance = lazyRetry(() => import("./pages/Compliance"));
const Security = lazyRetry(() => import("./pages/Security"));
const Accessibility = lazyRetry(() => import("./pages/Accessibility"));
const NotaryPage = lazyRetry(() => import("./pages/NotaryPage"));
const NotaryDirectory = lazyRetry(() => import("./pages/NotaryDirectory"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // ARCH-003: Restored to 5min; use per-query overrides for real-time data
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // #3708: Global mutation error handler
      onError: (error: unknown) => {
        console.error("[QueryClient] Mutation error:", error);
      },
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="relative h-12 w-48 overflow-hidden rounded-full bg-muted">
      <div className="loading-bar absolute inset-y-0 w-1/3 rounded-full bg-primary" />
    </div>
  </div>
);

/** Per-route Suspense + ErrorBoundary wrapper to prevent null dispatcher on lazy mount */
function SR({ children, msg }: { children: ReactNode; msg?: string }) {
  return (
    <ErrorBoundary fallbackMessage={msg || "Page failed to load"}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<SR><Index /></SR>} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<SR><ResetPassword /></SR>} />
      <Route path="/book" element={<SR msg="Booking failed to load"><BookAppointment /></SR>} />
      <Route path="/booking" element={<SR msg="Booking failed to load"><BookAppointment /></SR>} />
      <Route path="/schedule" element={<SR msg="Booking failed to load"><BookAppointment /></SR>} />
      <Route path="/notary-guide" element={<SR><NotaryGuide /></SR>} />
      <Route path="/ron-info" element={<SR><RonInfo /></SR>} />
      <Route path="/services" element={<SR msg="Services failed to load"><Services /></SR>} />
      <Route path="/services/:serviceId" element={<SR msg="Service details failed to load"><ServiceDetail /></SR>} />
      <Route path="/ron-check" element={<SR><RonEligibilityChecker /></SR>} />
      <Route path="/loan-signing" element={<SR><LoanSigningServices /></SR>} />
      <Route path="/verify/:id" element={<SR msg="Verification failed to load"><VerifySeal /></SR>} />
      <Route path="/terms" element={<SR><TermsPrivacy /></SR>} />
      <Route path="/templates" element={<SR><DocumentTemplates /></SR>} />
      <Route path="/about" element={<SR msg="About page failed to load"><About /></SR>} />
      <Route path="/join" element={<SR><JoinPlatform /></SR>} />
      <Route path="/notary-guide-process" element={<SR><NotaryProcessGuide /></SR>} />
      <Route path="/unsubscribe" element={<SR><Unsubscribe /></SR>} />
      <Route path="/maintenance" element={<SR><Maintenance /></SR>} />
      <Route path="/track-apostille" element={<SR msg="Apostille tracker failed to load"><TrackApostille /></SR>} />
      <Route path="/apply" element={<SR msg="Contractor registration failed to load"><ContractorRegistration /></SR>} />
      <Route path="/track-order" element={<SR msg="Order tracking failed to load"><OrderTracking /></SR>} />
      <Route path="/glossary" element={<SR msg="Glossary failed to load"><NotaryGlossary /></SR>} />
      <Route path="/solutions/notaries" element={<SR><ForNotaries /></SR>} />
      <Route path="/resources" element={<SR><Resources /></SR>} />
      <Route path="/help" element={<SR><HelpSupport /></SR>} />
      <Route path="/signer-rights" element={<SR><SignerRights /></SR>} />
      <Route path="/notary-certificates" element={<SR><NotaryCertificates /></SR>} />
      <Route path="/compliance" element={<SR><Compliance /></SR>} />
      <Route path="/security" element={<SR><Security /></SR>} />
      <Route path="/accessibility" element={<SR><Accessibility /></SR>} />
      <Route path="/solutions/hospitals" element={<SR><ForHospitals /></SR>} />
      <Route path="/solutions/real-estate" element={<SR><ForRealEstate /></SR>} />
      <Route path="/solutions/law-firms" element={<SR><ForLawFirms /></SR>} />
      <Route path="/solutions/small-business" element={<SR><ForSmallBusiness /></SR>} />
      <Route path="/solutions/individuals" element={<SR><ForIndividuals /></SR>} />
      <Route path="/notaries" element={<SR msg="Notary directory failed to load"><NotaryDirectory /></SR>} />
      <Route path="/professionals" element={<SR msg="Professional directory failed to load"><NotaryDirectory /></SR>} />
      <Route path="/n/:slug" element={<SR msg="Professional page failed to load"><NotaryPage /></SR>} />
      <Route path="/notary/*" element={<Navigate to="/notaries" replace />} />
      <Route path="/digitize" element={<ProtectedRoute><SR msg="Document digitize failed to load"><DocumentDigitize /></SR></ProtectedRoute>} />
      <Route path="/request" element={<ProtectedRoute><SR msg="Service request failed to load"><ServiceRequest /></SR></ProtectedRoute>} />
      <Route path="/mailroom" element={<ProtectedRoute><SR msg="Mailroom failed to load"><VirtualMailroom /></SR></ProtectedRoute>} />
      <Route path="/subscribe" element={<ProtectedRoute><SR msg="Subscription plans failed to load"><SubscriptionPlans /></SR></ProtectedRoute>} />
      <Route path="/pricing" element={<SR msg="Pricing failed to load"><SubscriptionPlans /></SR>} />
      <Route path="/plans" element={<SR msg="Plans failed to load"><SubscriptionPlans /></SR>} />
      <Route path="/dashboard" element={<Navigate to="/portal" replace />} />
      <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      <Route path="/verify-id" element={<ProtectedRoute><SR msg="Identity verification failed to load"><VerifyIdentity /></SR></ProtectedRoute>} />
      <Route path="/mobile-upload" element={<ProtectedRoute><SR msg="Mobile upload failed to load"><MobileUpload /></SR></ProtectedRoute>} />
      <Route path="/builder" element={<ProtectedRoute><SR msg="Document builder failed to load"><DocumentBuilder /></SR></ProtectedRoute>} />
      <Route path="/fee-calculator" element={<SR msg="Fee calculator failed to load"><FeeCalculator /></SR>} />
      <Route path="/ai-writer" element={<ProtectedRoute><SR msg="AI Writer failed to load"><AIWriter /></SR></ProtectedRoute>} />
      <Route path="/ai-extractors" element={<ProtectedRoute><SR msg="AI Extractors failed to load"><AIExtractors /></SR></ProtectedRoute>} />
      <Route path="/ai-knowledge" element={<ProtectedRoute><SR msg="AI Knowledge failed to load"><AIKnowledge /></SR></ProtectedRoute>} />
      <Route path="/signature-generator" element={<ProtectedRoute><SR msg="Signature generator failed to load"><SignatureGeneratorPage /></SR></ProtectedRoute>} />
      <Route path="/grants" element={<ProtectedRoute><SR msg="Grant generator failed to load"><GrantDashboard /></SR></ProtectedRoute>} />
      <Route path="/resume-builder" element={<ProtectedRoute><SR msg="Resume builder failed to load"><ResumeBuilder /></SR></ProtectedRoute>} />
      <Route path="/ai-tools" element={<ProtectedRoute><SR msg="AI Tools failed to load"><AITools /></SR></ProtectedRoute>} />
      <Route path="/docudex" element={<ProtectedRoute><SR msg="DocuDex failed to load"><DocuDex /></SR></ProtectedRoute>} />
      <Route path="/print-shop" element={<SR msg="Print shop failed to load"><PrintMarketplace /></SR>} />
      <Route path="/pricing-menu" element={<SR msg="Pricing menu failed to load"><PricingMenu /></SR>} />
      <Route path="/design-studio" element={<ProtectedRoute><SR msg="Design studio failed to load"><DesignStudio /></SR></ProtectedRoute>} />
      <Route path="/design/business-cards" element={<ProtectedRoute><SR><BusinessCardDesigner /></SR></ProtectedRoute>} />
      <Route path="/design/stickers" element={<ProtectedRoute><SR><StickerDesigner /></SR></ProtectedRoute>} />
      <Route path="/design/notebooks" element={<ProtectedRoute><SR><NotebookConfigurator /></SR></ProtectedRoute>} />
      <Route path="/design/book-covers" element={<ProtectedRoute><SR><BookCoverDesigner /></SR></ProtectedRoute>} />
      <Route path="/design/letterhead" element={<ProtectedRoute><SR><LetterheadDesigner /></SR></ProtectedRoute>} />
      <Route path="/design/apparel" element={<ProtectedRoute><SR><ApparelDesigner /></SR></ProtectedRoute>} />
      <Route path="/design/signage" element={<ProtectedRoute><SR><SignageDesigner /></SR></ProtectedRoute>} />
      <Route path="/design/promo" element={<ProtectedRoute><SR><PromoDesigner /></SR></ProtectedRoute>} />
      <Route path="/vendor-portal" element={<ProtectedRoute><SR msg="Vendor portal failed to load"><VendorPortal /></SR></ProtectedRoute>} />
      <Route path="/track/:token" element={<SR msg="Session tracker failed to load"><SessionTracker /></SR>} />
      <Route path="/reschedule/:confirmationNumber" element={<SR msg="Reschedule failed to load"><RescheduleAppointment /></SR>} />
      <Route path="/account-settings" element={<ProtectedRoute><SR msg="Account settings failed to load"><AccountSettings /></SR></ProtectedRoute>} />
      <Route path="/portal" element={<ProtectedRoute><SR msg="Portal failed to load"><ClientPortal /></SR></ProtectedRoute>} />
      <Route path="/confirmation" element={<ProtectedRoute><SR msg="Confirmation failed to load"><AppointmentConfirmation /></SR></ProtectedRoute>} />
      <Route path="/ron-session" element={<ProtectedRoute><SR msg="RON session failed to load"><RonSession /></SR></ProtectedRoute>} />
      <Route path="/business-portal" element={<ProtectedRoute><SR msg="Business portal failed to load"><BusinessPortal /></SR></ProtectedRoute>} />
      {/* Admin routes — parent requireAdmin gate handles auth for all children (ARCH-002) */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><SR><AdminDashboard /></SR></ProtectedRoute>}>
        <Route index element={<SR msg="Overview failed to load"><AdminOverview /></SR>} />
        <Route path="appointments" element={<SR msg="Appointments failed to load"><AdminAppointments /></SR>} />
        <Route path="clients" element={<SR msg="Clients failed to load"><AdminClients /></SR>} />
        <Route path="availability" element={<SR msg="Availability failed to load"><AdminAvailability /></SR>} />
        <Route path="documents" element={<SR msg="Documents failed to load"><AdminDocuments /></SR>} />
        <Route path="journal" element={<SR msg="Journal failed to load"><AdminJournal /></SR>} />
        <Route path="revenue" element={<ProtectedRoute adminOnly><SR msg="Revenue failed to load"><AdminRevenue /></SR></ProtectedRoute>} />
        <Route path="templates" element={<SR msg="Templates failed to load"><AdminTemplates /></SR>} />
        <Route path="apostille" element={<SR msg="Apostille failed to load"><AdminApostille /></SR>} />
        <Route path="chat" element={<SR msg="Chat failed to load"><AdminChat /></SR>} />
        <Route path="business-clients" element={<SR msg="Business clients failed to load"><AdminBusinessClients /></SR>} />
        <Route path="services" element={<SR msg="Services failed to load"><AdminServices /></SR>} />
        <Route path="resources" element={<SR msg="Resources failed to load"><AdminResources /></SR>} />
        <Route path="ai-assistant" element={<SR msg="AI Assistant failed to load"><AdminAIAssistant /></SR>} />
        <Route path="audit-log" element={<ProtectedRoute adminOnly><SR msg="Audit log failed to load"><AdminAuditLog /></SR></ProtectedRoute>} />
        <Route path="team" element={<SR msg="Team failed to load"><AdminTeam /></SR>} />
        <Route path="email-management" element={<SR msg="Email management failed to load"><AdminEmailManagement /></SR>} />
        <Route path="leads" element={<SR msg="Lead portal failed to load"><AdminLeadPortal /></SR>} />
        <Route path="users" element={<ProtectedRoute adminOnly><SR msg="User management failed to load"><AdminUsers /></SR></ProtectedRoute>} />
        <Route path="service-requests" element={<SR msg="Service requests failed to load"><AdminServiceRequests /></SR>} />
        <Route path="content-workspace" element={<SR msg="Content workspace failed to load"><AdminContentWorkspace /></SR>} />
        <Route path="task-queue" element={<SR msg="Task queue failed to load"><AdminTaskQueue /></SR>} />
        <Route path="crm" element={<ProtectedRoute adminOnly><SR msg="CRM failed to load"><AdminCRM /></SR></ProtectedRoute>} />
        <Route path="build-tracker" element={<ProtectedRoute adminOnly><SR msg="Build tracker failed to load"><AdminBuildTracker /></SR></ProtectedRoute>} />
        <Route path="docudex-pro" element={<SR msg="DocuDex Pro failed to load"><AdminDocuDexPro /></SR>} />
        <Route path="process-flows" element={<SR msg="Process flows failed to load"><AdminProcessFlows /></SR>} />
        <Route path="settings" element={<ProtectedRoute adminOnly><SR msg="Settings failed to load"><AdminSettings /></SR></ProtectedRoute>} />
        <Route path="integrations" element={<ProtectedRoute adminOnly><SR msg="Integration testing failed to load"><AdminIntegrationTest /></SR></ProtectedRoute>} />
        <Route path="client-emails" element={<SR msg="Client emails failed to load"><AdminClientEmails /></SR>} />
        <Route path="mailbox" element={<SR msg="Mailbox failed to load"><AdminMailbox /></SR>} />
        <Route path="webhooks" element={<ProtectedRoute adminOnly><SR msg="Webhooks failed to load"><AdminWebhooks /></SR></ProtectedRoute>} />
        <Route path="performance" element={<ProtectedRoute adminOnly><SR msg="Performance failed to load"><AdminPerformance /></SR></ProtectedRoute>} />
        <Route path="compliance-report" element={<ProtectedRoute adminOnly><SR msg="Compliance report failed to load"><AdminComplianceReport /></SR></ProtectedRoute>} />
        <Route path="notary-pages" element={<ProtectedRoute adminOnly><SR msg="Notary pages failed to load"><AdminNotaryPages /></SR></ProtectedRoute>} />
        <Route path="notary-approval" element={<ProtectedRoute adminOnly><SR msg="Notary approval failed to load"><AdminNotaryApproval /></SR></ProtectedRoute>} />
        <Route path="professionals" element={<ProtectedRoute adminOnly><SR msg="Professionals failed to load"><AdminProfessionals /></SR></ProtectedRoute>} />
        <Route path="automated-emails" element={<ProtectedRoute adminOnly><SR msg="Automated emails failed to load"><AdminAutomatedEmails /></SR></ProtectedRoute>} />
        <Route path="finances" element={<ProtectedRoute adminOnly><SR msg="Finances failed to load"><AdminFinances /></SR></ProtectedRoute>} />
        <Route path="email-health" element={<ProtectedRoute adminOnly><SR msg="Email health failed to load"><AdminEmailHealth /></SR></ProtectedRoute>} />
        <Route path="ron-recordings" element={<SR msg="RON recordings failed to load"><AdminRonRecordings /></SR>} />
        <Route path="loan-signing" element={<SR msg="Loan signing failed to load"><AdminLoanSigning /></SR>} />
        <Route path="i9-verifications" element={<SR msg="I-9 verifications failed to load"><AdminI9Verifications /></SR>} />
        <Route path="print-jobs" element={<SR msg="Print queue failed to load"><AdminPrintJobs /></SR>} />
        <Route path="fingerprinting" element={<SR msg="Fingerprinting failed to load"><AdminFingerprinting /></SR>} />
        <Route path="process-serving" element={<SR msg="Process serving failed to load"><AdminProcessServing /></SR>} />
        <Route path="skip-tracing" element={<SR msg="Skip tracing failed to load"><AdminSkipTracing /></SR>} />
        <Route path="vital-records" element={<SR msg="Vital records failed to load"><AdminVitalRecords /></SR>} />
        <Route path="scrivener" element={<SR msg="Scrivener failed to load"><AdminScrivener /></SR>} />
        <Route path="translations" element={<SR msg="Translations failed to load"><AdminTranslations /></SR>} />
        <Route path="courier" element={<SR msg="Courier failed to load"><AdminCourier /></SR>} />
        <Route path="va-tasks" element={<SR msg="VA tasks failed to load"><AdminVATasks /></SR>} />
        <Route path="background-checks" element={<SR msg="Background checks failed to load"><AdminBackgroundChecks /></SR>} />
        <Route path="identity-certificates" element={<SR msg="Identity certificates failed to load"><AdminIdentityCertificates /></SR>} />
        <Route path="recorder-filings" element={<SR msg="Recorder filings failed to load"><AdminRecorderFilings /></SR>} />
        <Route path="sos-filings" element={<SR msg="SOS filings failed to load"><AdminSOSFilings /></SR>} />
        <Route path="real-estate" element={<SR msg="Real estate failed to load"><AdminRealEstate /></SR>} />
        <Route path="print-orders" element={<SR msg="Print orders failed to load"><AdminPrintOrders /></SR>} />
        <Route path="court-forms" element={<SR msg="Court forms failed to load"><AdminCourtForms /></SR>} />
        <Route path="permit-filings" element={<SR msg="Permit filings failed to load"><AdminPermitFilings /></SR>} />
        <Route path="compliance-calendars" element={<SR msg="Compliance calendars failed to load"><AdminComplianceCalendars /></SR>} />
        <Route path="vendors" element={<SR msg="Vendors failed to load"><AdminVendors /></SR>} />
        <Route path="print-pricing" element={<SR msg="Print pricing failed to load"><AdminPrintPricing /></SR>} />
        <Route path="pricing" element={<ProtectedRoute adminOnly><SR msg="Pricing engine failed to load"><AdminPricing /></SR></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute adminOnly><SR msg="Orders failed to load"><AdminOrders /></SR></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute adminOnly><SR msg="Analytics failed to load"><AdminAnalytics /></SR></ProtectedRoute>} />
        <Route path="contractors" element={<ProtectedRoute adminOnly><SR msg="Contractors failed to load"><AdminContractors /></SR></ProtectedRoute>} />
        <Route path="print-inventory" element={<ProtectedRoute adminOnly><SR msg="Print inventory failed to load"><AdminPrintInventory /></SR></ProtectedRoute>} />
        <Route path="ux-consulting" element={<ProtectedRoute adminOnly><SR msg="UX consulting failed to load"><AdminUXConsulting /></SR></ProtectedRoute>} />
        <Route path="business-formation" element={<ProtectedRoute adminOnly><SR msg="Business formation failed to load"><AdminBusinessFormation /></SR></ProtectedRoute>} />
        <Route path="estate-planning" element={<ProtectedRoute adminOnly><SR msg="Estate planning failed to load"><AdminEstatePlanning /></SR></ProtectedRoute>} />
        <Route path="notary-training" element={<ProtectedRoute adminOnly><SR msg="Notary training failed to load"><AdminNotaryTraining /></SR></ProtectedRoute>} />
        <Route path="contractor-onboarding" element={<ProtectedRoute adminOnly><SR msg="Contractor onboarding failed to load"><AdminContractorOnboarding /></SR></ProtectedRoute>} />
        <Route path="referral-network" element={<ProtectedRoute adminOnly><SR msg="Referral network failed to load"><AdminReferralNetwork /></SR></ProtectedRoute>} />
        <Route path="immigration" element={<ProtectedRoute adminOnly><SR msg="Immigration failed to load"><AdminImmigration /></SR></ProtectedRoute>} />
        <Route path="tax-referral" element={<ProtectedRoute adminOnly><SR msg="Tax referral failed to load"><AdminTaxReferral /></SR></ProtectedRoute>} />
        <Route path="insurance" element={<ProtectedRoute adminOnly><SR msg="Insurance failed to load"><AdminInsurance /></SR></ProtectedRoute>} />
        <Route path="mediation" element={<ProtectedRoute adminOnly><SR msg="Mediation failed to load"><AdminMediation /></SR></ProtectedRoute>} />
        <Route path="photography" element={<ProtectedRoute adminOnly><SR msg="Photography failed to load"><AdminPhotography /></SR></ProtectedRoute>} />
        <Route path="contractor-registration" element={<ProtectedRoute adminOnly><SR msg="Contractor registration failed to load"><AdminContractorRegistration /></SR></ProtectedRoute>} />
        <Route path="power-of-attorney" element={<ProtectedRoute adminOnly><SR msg="Power of Attorney failed to load"><AdminPowerOfAttorney /></SR></ProtectedRoute>} />
        <Route path="notary-compliance" element={<SR msg="Compliance dashboard failed to load"><AdminNotaryCompliance /></SR>} />
        <Route path="promo-codes" element={<ProtectedRoute adminOnly><SR msg="Promo codes failed to load"><AdminPromoCodeManager /></SR></ProtectedRoute>} />
        <Route path="system-health" element={<ProtectedRoute adminOnly><SR msg="System health failed to load"><AdminSystemHealth /></SR></ProtectedRoute>} />
        <Route path="recording-archive" element={<SR msg="Recording archive failed to load"><AdminRecordingArchive /></SR>} />
        <Route path="operations" element={<ProtectedRoute adminOnly><SR msg="Operations failed to load"><AdminOperations /></SR></ProtectedRoute>} />
        <Route path="security-center" element={<ProtectedRoute adminOnly><SR msg="Security center failed to load"><AdminSecurityCenter /></SR></ProtectedRoute>} />
        <Route path="ron-dashboard" element={<ProtectedRoute adminOnly><SR msg="RON dashboard failed to load"><AdminRonDashboard /></SR></ProtectedRoute>} />
        <Route path="oath-administration" element={<ProtectedRoute adminOnly><SR msg="Oath administration failed to load"><AdminOathAdministration /></SR></ProtectedRoute>} />
        <Route path="certified-copies" element={<ProtectedRoute adminOnly><SR msg="Certified copies failed to load"><AdminCertifiedCopies /></SR></ProtectedRoute>} />
        <Route path="travel-zones" element={<ProtectedRoute adminOnly><SR msg="Travel zones failed to load"><AdminTravelZones /></SR></ProtectedRoute>} />
        <Route path="witnesses" element={<ProtectedRoute adminOnly><SR msg="Witnesses failed to load"><AdminWitnesses /></SR></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AuthenticatedCommandPalette() {
  const { user } = useAuth();
  if (!user) return null;
  return <CommandPalette />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthenticatedCommandPalette />
          <AnimatedRoutes />
          <CookieConsent />
          <OfflineIndicator />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
