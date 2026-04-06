import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { CommandPalette } from "@/components/CommandPalette";
import { AnimatePresence } from "framer-motion";


// Eager load critical pages
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// Lazy load everything else
const Index = lazy(() => import("./pages/Index"));
const ResetPassword = lazy(() => import("./pages/ForgotPassword"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const RonSession = lazy(() => import("./pages/RonSession"));
const NotaryGuide = lazy(() => import("./pages/NotaryGuide"));
const RonInfo = lazy(() => import("./pages/RonInfo"));
const DocumentTemplates = lazy(() => import("./pages/DocumentTemplates"));
const DocumentBuilder = lazy(() => import("./pages/DocumentBuilder"));
const FeeCalculator = lazy(() => import("./pages/FeeCalculator"));
const BusinessPortal = lazy(() => import("./pages/BusinessPortal"));
const Services = lazy(() => import("./pages/Services"));
const VerifySeal = lazy(() => import("./pages/VerifySeal"));
const TermsPrivacy = lazy(() => import("./pages/TermsPrivacy"));
const AppointmentConfirmation = lazy(() => import("./pages/AppointmentConfirmation"));
const RonEligibilityChecker = lazy(() => import("./pages/RonEligibilityChecker"));
const LoanSigningServices = lazy(() => import("./pages/LoanSigningServices"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const About = lazy(() => import("./pages/About"));
const DocumentDigitize = lazy(() => import("./pages/DocumentDigitize"));
const JoinPlatform = lazy(() => import("./pages/JoinPlatform"));
const ServiceRequest = lazy(() => import("./pages/ServiceRequest"));
const VirtualMailroom = lazy(() => import("./pages/VirtualMailroom"));
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans"));
const VerifyIdentity = lazy(() => import("./pages/VerifyIdentity"));
const MobileUpload = lazy(() => import("./pages/MobileUpload"));
const AIWriter = lazy(() => import("./pages/AIWriter"));
const AIExtractors = lazy(() => import("./pages/AIExtractors"));
const AIKnowledge = lazy(() => import("./pages/AIKnowledge"));
const SignatureGeneratorPage = lazy(() => import("./pages/SignatureGeneratorPage"));
const GrantDashboard = lazy(() => import("./pages/GrantDashboard"));
const ResumeBuilder = lazy(() => import("./pages/ResumeBuilder"));
const AITools = lazy(() => import("./pages/AITools"));
const SessionTracker = lazy(() => import("./pages/SessionTracker"));
const RescheduleAppointment = lazy(() => import("./pages/RescheduleAppointment"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminAvailability = lazy(() => import("./pages/admin/AdminAvailability"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminJournal = lazy(() => import("./pages/admin/AdminJournal"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminAIAssistant = lazy(() => import("./pages/admin/AdminAIAssistant"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminApostille = lazy(() => import("./pages/admin/AdminApostille"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const AdminBusinessClients = lazy(() => import("./pages/admin/AdminBusinessClients"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminEmailManagement = lazy(() => import("./pages/admin/AdminEmailManagement"));
const AdminLeadPortal = lazy(() => import("./pages/admin/AdminLeadPortal"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const NotaryProcessGuide = lazy(() => import("./pages/NotaryProcessGuide"));
const AdminIntegrationTest = lazy(() => import("./pages/admin/AdminIntegrationTest"));
const AdminServiceRequests = lazy(() => import("./pages/admin/AdminServiceRequests"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const AdminContentWorkspace = lazy(() => import("./pages/admin/AdminContentWorkspace"));
const AdminTaskQueue = lazy(() => import("./pages/admin/AdminTaskQueue"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminBuildTracker = lazy(() => import("./pages/admin/AdminBuildTracker"));
const AdminClientEmails = lazy(() => import("./pages/admin/AdminClientEmails"));
const AdminMailbox = lazy(() => import("./pages/admin/AdminMailbox"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const AdminWebhooks = lazy(() => import("./pages/admin/AdminWebhooks"));
const AdminPerformance = lazy(() => import("./pages/admin/AdminPerformance"));
const AdminComplianceReport = lazy(() => import("./pages/admin/AdminComplianceReport"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ForNotaries = lazy(() => import("./pages/solutions/ForNotaries"));
const ForHospitals = lazy(() => import("./pages/solutions/ForHospitals"));
const ForRealEstate = lazy(() => import("./pages/solutions/ForRealEstate"));
const ForLawFirms = lazy(() => import("./pages/solutions/ForLawFirms"));
const ForSmallBusiness = lazy(() => import("./pages/solutions/ForSmallBusiness"));
const ForIndividuals = lazy(() => import("./pages/solutions/ForIndividuals"));
const Resources = lazy(() => import("./pages/Resources"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const SignerRights = lazy(() => import("./pages/SignerRights"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
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

function AnimatedRoutes() {
  const location = useLocation();
  const routeKey = location.pathname;

  return (
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/book" element={<ErrorBoundary fallbackMessage="Booking failed to load"><BookAppointment /></ErrorBoundary>} />
        <Route path="/booking" element={<ErrorBoundary fallbackMessage="Booking failed to load"><BookAppointment /></ErrorBoundary>} />
        <Route path="/schedule" element={<ErrorBoundary fallbackMessage="Booking failed to load"><BookAppointment /></ErrorBoundary>} />
        <Route path="/notary-guide" element={<NotaryGuide />} />
        <Route path="/ron-info" element={<RonInfo />} />
        <Route path="/services" element={<ErrorBoundary fallbackMessage="Services failed to load"><Services /></ErrorBoundary>} />
        <Route path="/services/:serviceId" element={<ErrorBoundary fallbackMessage="Service details failed to load"><ServiceDetail /></ErrorBoundary>} />
        <Route path="/ron-check" element={<RonEligibilityChecker />} />
        <Route path="/loan-signing" element={<LoanSigningServices />} />
        <Route path="/verify/:id" element={<ErrorBoundary fallbackMessage="Verification failed to load"><VerifySeal /></ErrorBoundary>} />
        <Route path="/terms" element={<TermsPrivacy />} />
        <Route path="/templates" element={<DocumentTemplates />} />
        <Route path="/about" element={<ErrorBoundary fallbackMessage="About page failed to load"><About /></ErrorBoundary>} />
        <Route path="/join" element={<JoinPlatform />} />
        <Route path="/notary-guide-process" element={<NotaryProcessGuide />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/solutions/notaries" element={<ForNotaries />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/signer-rights" element={<SignerRights />} />
        <Route path="/solutions/hospitals" element={<ForHospitals />} />
        <Route path="/solutions/real-estate" element={<ForRealEstate />} />
        <Route path="/solutions/law-firms" element={<ForLawFirms />} />
        <Route path="/solutions/small-business" element={<ForSmallBusiness />} />
        <Route path="/solutions/individuals" element={<ForIndividuals />} />
        <Route path="/digitize" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Document digitize failed to load"><DocumentDigitize /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Service request failed to load"><ServiceRequest /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/mailroom" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Mailroom failed to load"><VirtualMailroom /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/subscribe" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Subscription plans failed to load"><SubscriptionPlans /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/verify-id" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Identity verification failed to load"><VerifyIdentity /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/mobile-upload" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Mobile upload failed to load"><MobileUpload /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/builder" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Document builder failed to load"><DocumentBuilder /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/fee-calculator" element={<ErrorBoundary fallbackMessage="Fee calculator failed to load"><FeeCalculator /></ErrorBoundary>} />
        <Route path="/ai-writer" element={<ProtectedRoute><ErrorBoundary fallbackMessage="AI Writer failed to load"><AIWriter /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/ai-extractors" element={<ProtectedRoute><ErrorBoundary fallbackMessage="AI Extractors failed to load"><AIExtractors /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/ai-knowledge" element={<ProtectedRoute><ErrorBoundary fallbackMessage="AI Knowledge failed to load"><AIKnowledge /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/signature-generator" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Signature generator failed to load"><SignatureGeneratorPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/grants" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Grant generator failed to load"><GrantDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/resume-builder" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Resume builder failed to load"><ResumeBuilder /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><ErrorBoundary fallbackMessage="AI Tools failed to load"><AITools /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/track/:token" element={<ErrorBoundary fallbackMessage="Session tracker failed to load"><SessionTracker /></ErrorBoundary>} />
        <Route path="/reschedule/:confirmationNumber" element={<ErrorBoundary fallbackMessage="Reschedule failed to load"><RescheduleAppointment /></ErrorBoundary>} />
        <Route path="/account-settings" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Account settings failed to load"><AccountSettings /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Portal failed to load"><ClientPortal /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/confirmation" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Confirmation failed to load"><AppointmentConfirmation /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/ron-session" element={<ProtectedRoute><ErrorBoundary fallbackMessage="RON session failed to load"><RonSession /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/business-portal" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Business portal failed to load"><BusinessPortal /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>}>
          <Route index element={<ErrorBoundary fallbackMessage="Overview failed to load"><AdminOverview /></ErrorBoundary>} />
          <Route path="appointments" element={<ErrorBoundary fallbackMessage="Appointments failed to load"><AdminAppointments /></ErrorBoundary>} />
          <Route path="clients" element={<ErrorBoundary fallbackMessage="Clients failed to load"><AdminClients /></ErrorBoundary>} />
          <Route path="availability" element={<ErrorBoundary fallbackMessage="Availability failed to load"><AdminAvailability /></ErrorBoundary>} />
          <Route path="documents" element={<ErrorBoundary fallbackMessage="Documents failed to load"><AdminDocuments /></ErrorBoundary>} />
          <Route path="journal" element={<ErrorBoundary fallbackMessage="Journal failed to load"><AdminJournal /></ErrorBoundary>} />
          <Route path="revenue" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Revenue failed to load"><AdminRevenue /></ErrorBoundary></ProtectedRoute>} />
          <Route path="templates" element={<ErrorBoundary fallbackMessage="Templates failed to load"><AdminTemplates /></ErrorBoundary>} />
          <Route path="apostille" element={<ErrorBoundary fallbackMessage="Apostille failed to load"><AdminApostille /></ErrorBoundary>} />
          <Route path="chat" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Chat failed to load"><AdminChat /></ErrorBoundary></ProtectedRoute>} />
          <Route path="business-clients" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Business clients failed to load"><AdminBusinessClients /></ErrorBoundary></ProtectedRoute>} />
          <Route path="services" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Services failed to load"><AdminServices /></ErrorBoundary></ProtectedRoute>} />
          <Route path="resources" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Resources failed to load"><AdminResources /></ErrorBoundary></ProtectedRoute>} />
          <Route path="ai-assistant" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="AI Assistant failed to load"><AdminAIAssistant /></ErrorBoundary></ProtectedRoute>} />
          <Route path="audit-log" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Audit log failed to load"><AdminAuditLog /></ErrorBoundary></ProtectedRoute>} />
          <Route path="team" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Team failed to load"><AdminTeam /></ErrorBoundary></ProtectedRoute>} />
          <Route path="email-management" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Email management failed to load"><AdminEmailManagement /></ErrorBoundary></ProtectedRoute>} />
          <Route path="leads" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Lead portal failed to load"><AdminLeadPortal /></ErrorBoundary></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="User management failed to load"><AdminUsers /></ErrorBoundary></ProtectedRoute>} />
          <Route path="service-requests" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Service requests failed to load"><AdminServiceRequests /></ErrorBoundary></ProtectedRoute>} />
          <Route path="content-workspace" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Content workspace failed to load"><AdminContentWorkspace /></ErrorBoundary></ProtectedRoute>} />
          <Route path="task-queue" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Task queue failed to load"><AdminTaskQueue /></ErrorBoundary></ProtectedRoute>} />
          <Route path="crm" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="CRM failed to load"><AdminCRM /></ErrorBoundary></ProtectedRoute>} />
          <Route path="build-tracker" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Build tracker failed to load"><AdminBuildTracker /></ErrorBoundary></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Settings failed to load"><AdminSettings /></ErrorBoundary></ProtectedRoute>} />
          <Route path="integrations" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Integration testing failed to load"><AdminIntegrationTest /></ErrorBoundary></ProtectedRoute>} />
          <Route path="client-emails" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Client emails failed to load"><AdminClientEmails /></ErrorBoundary></ProtectedRoute>} />
          <Route path="mailbox" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Mailbox failed to load"><AdminMailbox /></ErrorBoundary></ProtectedRoute>} />
          <Route path="webhooks" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Webhooks failed to load"><AdminWebhooks /></ErrorBoundary></ProtectedRoute>} />
          <Route path="performance" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Performance failed to load"><AdminPerformance /></ErrorBoundary></ProtectedRoute>} />
          <Route path="compliance-report" element={<ProtectedRoute adminOnly><ErrorBoundary fallbackMessage="Compliance report failed to load"><AdminComplianceReport /></ErrorBoundary></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function AuthenticatedCommandPalette() {
  const { user } = useAuth();
  if (!user) return null; // Bug 476: Only render for authenticated users
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
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
