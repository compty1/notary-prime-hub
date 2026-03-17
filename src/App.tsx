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
import BookAppointment from "./pages/BookAppointment";
import ClientPortal from "./pages/ClientPortal";
import BlueNotarySession from "./pages/BlueNotarySession";
import NotaryGuide from "./pages/NotaryGuide";
import RonInfo from "./pages/RonInfo";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminClients from "./pages/admin/AdminClients";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminJournal from "./pages/admin/AdminJournal";
import AdminResources from "./pages/admin/AdminResources";
import AdminAIAssistant from "./pages/admin/AdminAIAssistant";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import NotFound from "./pages/NotFound";

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
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/notary-guide" element={<NotaryGuide />} />
            <Route path="/ron-info" element={<RonInfo />} />
            <Route path="/portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
            <Route path="/ron-session" element={<ProtectedRoute><BlueNotarySession /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="availability" element={<AdminAvailability />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="journal" element={<AdminJournal />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="ai-assistant" element={<AdminAIAssistant />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
