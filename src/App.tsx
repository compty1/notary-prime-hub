import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ForgotPassword";
import BookAppointment from "./pages/BookAppointment";
import ClientPortal from "./pages/ClientPortal";
import BlueNotarySession from "./pages/BlueNotarySession";
import NotaryGuide from "./pages/NotaryGuide";
import RonInfo from "./pages/RonInfo";
import DocumentTemplates from "./pages/DocumentTemplates";
import DocumentBuilder from "./pages/DocumentBuilder";
import FeeCalculator from "./pages/FeeCalculator";
import BusinessPortal from "./pages/BusinessPortal";
import Services from "./pages/Services";
import VerifySeal from "./pages/VerifySeal";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminClients from "./pages/admin/AdminClients";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminJournal from "./pages/admin/AdminJournal";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminResources from "./pages/admin/AdminResources";
import AdminAIAssistant from "./pages/admin/AdminAIAssistant";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminApostille from "./pages/admin/AdminApostille";
import AdminChat from "./pages/admin/AdminChat";
import AdminBusinessClients from "./pages/admin/AdminBusinessClients";
import AdminServices from "./pages/admin/AdminServices";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminEmailManagement from "./pages/admin/AdminEmailManagement";
import AdminLeadPortal from "./pages/admin/AdminLeadPortal";
import NotFound from "./pages/NotFound";
import TermsPrivacy from "./pages/TermsPrivacy";
import AppointmentConfirmation from "./pages/AppointmentConfirmation";
import RonEligibilityChecker from "./pages/RonEligibilityChecker";
import LoanSigningServices from "./pages/LoanSigningServices";
import ServiceDetail from "./pages/ServiceDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/notary-guide" element={<NotaryGuide />} />
            <Route path="/ron-info" element={<RonInfo />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceId" element={<ServiceDetail />} />
            <Route path="/ron-check" element={<RonEligibilityChecker />} />
            <Route path="/loan-signing" element={<LoanSigningServices />} />
            <Route path="/verify/:id" element={<VerifySeal />} />
            <Route path="/terms" element={<TermsPrivacy />} />
            <Route path="/templates" element={<DocumentTemplates />} />
            <Route path="/builder" element={<DocumentBuilder />} />
            <Route path="/fee-calculator" element={<FeeCalculator />} />
            <Route path="/portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
            <Route path="/confirmation" element={<ProtectedRoute><AppointmentConfirmation /></ProtectedRoute>} />
            <Route path="/ron-session" element={<ProtectedRoute><BlueNotarySession /></ProtectedRoute>} />
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
              <Route path="settings" element={<ErrorBoundary fallbackMessage="Settings failed to load"><AdminSettings /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
