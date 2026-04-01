import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { CommandPalette } from "@/components/CommandPalette";
import { AnimatePresence } from "framer-motion";
import LegalGlossaryProvider from "@/components/LegalGlossaryProvider";

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
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ForNotaries = lazy(() => import("./pages/solutions/ForNotaries"));
const ForHospitals = lazy(() => import("./pages/solutions/ForHospitals"));
const ForRealEstate = lazy(() => import("./pages/solutions/ForRealEstate"));
const ForLawFirms = lazy(() => import("./pages/solutions/ForLawFirms"));
const ForSmallBusiness = lazy(() => import("./pages/solutions/ForSmallBusiness"));
const ForIndividuals = lazy(() => import("./pages/solutions/ForIndividuals"));
const Resources = lazy(() => import("./pages/Resources"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));

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
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<Index />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/booking" element={<BookAppointment />} />
        <Route path="/schedule" element={<BookAppointment />} />
        <Route path="/notary-guide" element={<NotaryGuide />} />
        <Route path="/ron-info" element={<RonInfo />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:serviceId" element={<ServiceDetail />} />
        <Route path="/ron-check" element={<RonEligibilityChecker />} />
        <Route path="/loan-signing" element={<LoanSigningServices />} />
        <Route path="/verify/:id" element={<VerifySeal />} />
        <Route path="/terms" element={<TermsPrivacy />} />
        <Route path="/templates" element={<DocumentTemplates />} />
        <Route path="/about" element={<About />} />
        <Route path="/join" element={<JoinPlatform />} />
        <Route path="/notary-guide-process" element={<NotaryProcessGuide />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/solutions/notaries" element={<ForNotaries />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/solutions/hospitals" element={<ForHospitals />} />
        <Route path="/solutions/real-estate" element={<ForRealEstate />} />
        <Route path="/solutions/law-firms" element={<ForLawFirms />} />
        <Route path="/solutions/small-business" element={<ForSmallBusiness />} />
        <Route path="/solutions/individuals" element={<ForIndividuals />} />
        <Route path="/digitize" element={<ProtectedRoute><DocumentDigitize /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><ServiceRequest /></ProtectedRoute>} />
        <Route path="/mailroom" element={<ProtectedRoute><VirtualMailroom /></ProtectedRoute>} />
        <Route path="/subscribe" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
        <Route path="/verify-id" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />
        <Route path="/mobile-upload" element={<ProtectedRoute><MobileUpload /></ProtectedRoute>} />
        <Route path="/builder" element={<ProtectedRoute><DocumentBuilder /></ProtectedRoute>} />
        <Route path="/fee-calculator" element={<FeeCalculator />} />
        <Route path="/ai-writer" element={<ProtectedRoute><AIWriter /></ProtectedRoute>} />
        <Route path="/ai-extractors" element={<ProtectedRoute><AIExtractors /></ProtectedRoute>} />
        <Route path="/ai-knowledge" element={<ProtectedRoute><AIKnowledge /></ProtectedRoute>} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
        <Route path="/confirmation" element={<ProtectedRoute><AppointmentConfirmation /></ProtectedRoute>} />
        <Route path="/ron-session" element={<ProtectedRoute><RonSession /></ProtectedRoute>} />
        <Route path="/business-portal" element={<ProtectedRoute><BusinessPortal /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>}>
          <Route index element={<ErrorBoundary fallbackMessage="Overview failed to load"><AdminOverview /></ErrorBoundary>} />
          <Route path="appointments" element={<ErrorBoundary fallbackMessage="Appointments failed to load"><AdminAppointments /></ErrorBoundary>} />
          <Route path="clients" element={<ErrorBoundary fallbackMessage="Clients failed to load"><AdminClients /></ErrorBoundary>} />
          <Route path="availability" element={<ErrorBoundary fallbackMessage="Availability failed to load"><AdminAvailability /></ErrorBoundary>} />
          <Route path="documents" element={<ErrorBoundary fallbackMessage="Documents failed to load"><AdminDocuments /></ErrorBoundary>} />
          <Route path="journal" element={<ErrorBoundary fallbackMessage="Journal failed to load"><AdminJournal /></ErrorBoundary>} />
          <Route path="revenue" element={<ErrorBoundary fallbackMessage="Revenue failed to load"><AdminRevenue /></ErrorBoundary>} />
          <Route path="templates" element={<ErrorBoundary fallbackMessage="Templates failed to load"><AdminTemplates /></ErrorBoundary>} />
          <Route path="apostille" element={<ErrorBoundary fallbackMessage="Apostille failed to load"><AdminApostille /></ErrorBoundary>} />
          <Route path="chat" element={<ErrorBoundary fallbackMessage="Chat failed to load"><AdminChat /></ErrorBoundary>} />
          <Route path="business-clients" element={<ErrorBoundary fallbackMessage="Business clients failed to load"><AdminBusinessClients /></ErrorBoundary>} />
          <Route path="services" element={<ErrorBoundary fallbackMessage="Services failed to load"><AdminServices /></ErrorBoundary>} />
          <Route path="resources" element={<ErrorBoundary fallbackMessage="Resources failed to load"><AdminResources /></ErrorBoundary>} />
          <Route path="ai-assistant" element={<ErrorBoundary fallbackMessage="AI Assistant failed to load"><AdminAIAssistant /></ErrorBoundary>} />
          <Route path="audit-log" element={<ErrorBoundary fallbackMessage="Audit log failed to load"><AdminAuditLog /></ErrorBoundary>} />
          <Route path="team" element={<ErrorBoundary fallbackMessage="Team failed to load"><AdminTeam /></ErrorBoundary>} />
          <Route path="email-management" element={<ErrorBoundary fallbackMessage="Email management failed to load"><AdminEmailManagement /></ErrorBoundary>} />
          <Route path="leads" element={<ErrorBoundary fallbackMessage="Lead portal failed to load"><AdminLeadPortal /></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary fallbackMessage="User management failed to load"><AdminUsers /></ErrorBoundary>} />
          <Route path="service-requests" element={<ErrorBoundary fallbackMessage="Service requests failed to load"><AdminServiceRequests /></ErrorBoundary>} />
          <Route path="content-workspace" element={<ErrorBoundary fallbackMessage="Content workspace failed to load"><AdminContentWorkspace /></ErrorBoundary>} />
          <Route path="task-queue" element={<ErrorBoundary fallbackMessage="Task queue failed to load"><AdminTaskQueue /></ErrorBoundary>} />
          <Route path="crm" element={<ErrorBoundary fallbackMessage="CRM failed to load"><AdminCRM /></ErrorBoundary>} />
          <Route path="build-tracker" element={<ErrorBoundary fallbackMessage="Build tracker failed to load"><AdminBuildTracker /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary fallbackMessage="Settings failed to load"><AdminSettings /></ErrorBoundary>} />
          <Route path="integrations" element={<ErrorBoundary fallbackMessage="Integration testing failed to load"><AdminIntegrationTest /></ErrorBoundary>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <CommandPalette />
          <LegalGlossaryProvider>
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </LegalGlossaryProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
