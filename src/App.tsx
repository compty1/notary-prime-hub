import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";
import TermsPrivacy from "./pages/TermsPrivacy";
import AppointmentConfirmation from "./pages/AppointmentConfirmation";

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
              <Route index element={<AdminOverview />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="availability" element={<AdminAvailability />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="journal" element={<AdminJournal />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="apostille" element={<AdminApostille />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="business-clients" element={<AdminBusinessClients />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="ai-assistant" element={<AdminAIAssistant />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
