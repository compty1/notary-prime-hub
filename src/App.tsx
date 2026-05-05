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
// CookieConsent and OfflineIndicator are rendered by PageShell — not duplicated here

// Eager load critical landing page only — auth pages and 404 are lazy for perf
import ComingSoon from "./pages/ComingSoon";

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

// BUG-0581/0582/0583: lazy-load auth pages + 404 (previously eager)
const Login = lazyRetry(() => import("./pages/Login"));
const SignUp = lazyRetry(() => import("./pages/SignUp"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));

const Index = lazyRetry(() => import("./pages/Index"));
const AdminShopOrders = lazyRetry(() => import("./pages/admin/AdminShopOrders"));
const AdminServiceCatalogAudit = lazyRetry(() => import("./pages/admin/AdminServiceCatalogAudit"));
const ResetPassword = lazyRetry(() => import("./pages/ForgotPassword"));
const BookAppointment = lazyRetry(() => import("./pages/BookAppointment"));
const ClientPortal = lazyRetry(() => import("./pages/ClientPortal"));
const RonSession = lazyRetry(() => import("./pages/RonSession"));
const NotaryGuide = lazyRetry(() => import("./pages/NotaryGuide"));
const RonInfo = lazyRetry(() => import("./pages/RonInfo"));
const BookRonConsult = lazyRetry(() => import("./pages/BookRonConsult"));
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
const AnimationGallery = lazyRetry(() => import("./pages/AnimationGallery"));

// Shop pages
const ShopLanding = lazyRetry(() => import("./pages/shop/ShopLanding"));
const ShopPackageDetail = lazyRetry(() => import("./pages/shop/ShopPackageDetail"));
const ShopAddons = lazyRetry(() => import("./pages/shop/ShopAddons"));
const ShopCart = lazyRetry(() => import("./pages/shop/ShopCart"));
const ShopPackages = lazyRetry(() => import("./pages/shop/ShopPackages"));
const ShopCheckout = lazyRetry(() => import("./pages/shop/ShopCheckout"));

// Service module pages
const EstatePlanningServices = lazyRetry(() => import("./pages/services/EstatePlanningServices"));
const BusinessContractsServices = lazyRetry(() => import("./pages/services/BusinessContractsServices"));
const RealEstateClosingsServices = lazyRetry(() => import("./pages/services/RealEstateClosingsServices"));

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
const AdminVendorProducts = lazyRetry(() => import("./pages/admin/AdminVendorProducts"));
const AdminEquipment = lazyRetry(() => import("./pages/admin/AdminEquipment"));
const AdminECourses = lazyRetry(() => import("./pages/admin/AdminECourses"));
const AdminAccounting = lazyRetry(() => import("./pages/admin/AdminAccounting"));
const AdminDocCollaboration = lazyRetry(() => import("./pages/admin/AdminDocCollaboration"));
const AdminEmbeddableWidgets = lazyRetry(() => import("./pages/admin/AdminEmbeddableWidgets"));
const AdminDispatch = lazyRetry(() => import("./pages/admin/AdminDispatch"));
const AdminMessagingHub = lazyRetry(() => import("./pages/admin/AdminMessagingHub"));
const AdminMicroTools = lazyRetry(() => import("./pages/admin/AdminMicroTools"));
const AdminEventBus = lazyRetry(() => import("./pages/admin/AdminEventBus"));
const AdminBusinessGrowth = lazyRetry(() => import("./pages/admin/AdminBusinessGrowth"));
const AdminClientTimeline = lazyRetry(() => import("./pages/admin/AdminClientTimeline"));
const AdminPlatformHealth = lazyRetry(() => import("./pages/admin/AdminPlatformHealth"));
const AdminReportsCenter = lazyRetry(() => import("./pages/admin/AdminReportsCenter"));
const AdminSLAMonitor = lazyRetry(() => import("./pages/admin/AdminSLAMonitor"));
const AdminPrintPricing = lazyRetry(() => import("./pages/admin/AdminPrintPricing"));
const AcademyLanding = lazyRetry(() => import("./pages/AcademyLanding"));
const AcademyCourseDetail = lazyRetry(() => import("./pages/AcademyCourseDetail"));
const AcademyLessonViewer = lazyRetry(() => import("./pages/AcademyLessonViewer"));
const AcademyQuiz = lazyRetry(() => import("./pages/AcademyQuiz"));
const AcademyCertificate = lazyRetry(() => import("./pages/AcademyCertificate"));
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
const AdminCredentials = lazyRetry(() => import("./pages/admin/AdminCredentials"));
const AdminTodos = lazyRetry(() => import("./pages/admin/AdminTodos"));
const AdminFinancialServices = lazyRetry(() => import("./pages/admin/AdminFinancialServices"));
const AdminCreativeServices = lazyRetry(() => import("./pages/admin/AdminCreativeServices"));
const AdminSalesCX = lazyRetry(() => import("./pages/admin/AdminSalesCX"));
const AdminContentCreation = lazyRetry(() => import("./pages/admin/AdminContentCreation"));
const NotaryGlossary = lazyRetry(() => import("./pages/NotaryGlossary"));
const Maintenance = lazyRetry(() => import("./pages/Maintenance"));

// Enterprise Tools
const EnterpriseDashboard = lazyRetry(() => import("./pages/enterprise/EnterpriseDashboard"));
const AIGrader = lazyRetry(() => import("./pages/enterprise/AIGrader"));
const KYCSearch = lazyRetry(() => import("./pages/enterprise/KYCSearch"));
const IPHub = lazyRetry(() => import("./pages/enterprise/IPHub"));
const CertificateGenerator = lazyRetry(() => import("./pages/enterprise/CertificateGenerator"));
const ExhibitStamper = lazyRetry(() => import("./pages/enterprise/ExhibitStamper"));
const DigitalVault = lazyRetry(() => import("./pages/enterprise/DigitalVault"));
const AutoFleetDesk = lazyRetry(() => import("./pages/enterprise/AutoFleetDesk"));
const LienCommandCenter = lazyRetry(() => import("./pages/enterprise/LienCommandCenter"));
const TrustScheduler = lazyRetry(() => import("./pages/enterprise/TrustScheduler"));
const B2BDispatch = lazyRetry(() => import("./pages/enterprise/B2BDispatch"));
const CorporateCompliance = lazyRetry(() => import("./pages/enterprise/CorporateCompliance"));
const ImmigrationHub = lazyRetry(() => import("./pages/enterprise/ImmigrationHub"));
const ApostilleMatrix = lazyRetry(() => import("./pages/enterprise/ApostilleMatrix"));
const BrandSettings = lazyRetry(() => import("./pages/enterprise/BrandSettings"));
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
const ClericalDocPrep = lazyRetry(() => import("./pages/services/ClericalDocPrep"));
const DocumentCleanup = lazyRetry(() => import("./pages/services/DocumentCleanup"));
const FormFilling = lazyRetry(() => import("./pages/services/FormFilling"));
const PdfServices = lazyRetry(() => import("./pages/services/PdfServices"));
const DocumentScanning = lazyRetry(() => import("./pages/services/DocumentScanning"));
const DocumentTranslation = lazyRetry(() => import("./pages/services/DocumentTranslation"));
const ApostilleCoordination = lazyRetry(() => import("./pages/services/ApostilleCoordination"));
const ConsularLegalization = lazyRetry(() => import("./pages/services/ConsularLegalization"));
const KycVerification = lazyRetry(() => import("./pages/services/KycVerification"));
const BackgroundCheckService = lazyRetry(() => import("./pages/services/BackgroundCheck"));
const PassportPhoto = lazyRetry(() => import("./pages/services/PassportPhoto"));
const FingerprintingService = lazyRetry(() => import("./pages/services/Fingerprinting"));
const InterpreterServices = lazyRetry(() => import("./pages/services/InterpreterServices"));
const DocumentPrinting = lazyRetry(() => import("./pages/services/DocumentPrinting"));
const EstatePlanningService = lazyRetry(() => import("./pages/services/EstatePlanningService"));
const BusinessFormationService = lazyRetry(() => import("./pages/services/BusinessFormationService"));
const CourtFormPreparation = lazyRetry(() => import("./pages/services/CourtFormPreparation"));
const ProcessServingService = lazyRetry(() => import("./pages/services/ProcessServingService"));
const CourierService = lazyRetry(() => import("./pages/services/CourierService"));

// Sprint 2: New service intake pages
const StandardTranslation = lazyRetry(() => import("./pages/services/StandardTranslation"));
const CertifiedTranslation = lazyRetry(() => import("./pages/services/CertifiedTranslation"));
const CourtCertifiedTranslation = lazyRetry(() => import("./pages/services/CourtCertifiedTranslation"));
const CredentialEvaluation = lazyRetry(() => import("./pages/services/CredentialEvaluation"));
const BusinessSubscriptions = lazyRetry(() => import("./pages/services/BusinessSubscriptions"));
const ApiIntegration = lazyRetry(() => import("./pages/services/ApiIntegration"));
const WhiteLabelPartner = lazyRetry(() => import("./pages/services/WhiteLabelPartner"));
const TemplateLibrary = lazyRetry(() => import("./pages/services/TemplateLibrary"));
const RonOnboardingConsulting = lazyRetry(() => import("./pages/services/RonOnboardingConsulting"));
const WorkflowAudit = lazyRetry(() => import("./pages/services/WorkflowAudit"));
const EmailManagement = lazyRetry(() => import("./pages/services/EmailManagement"));
const CertifiedDocPrepAgencies = lazyRetry(() => import("./pages/services/CertifiedDocPrepAgencies"));
const RegisteredAgent = lazyRetry(() => import("./pages/services/RegisteredAgent"));
const DataEntry = lazyRetry(() => import("./pages/services/DataEntry"));
const TravelArrangements = lazyRetry(() => import("./pages/services/TravelArrangements"));
const BlogWriting = lazyRetry(() => import("./pages/services/BlogWriting"));
const SocialMediaContent = lazyRetry(() => import("./pages/services/SocialMediaContent"));
const NewsletterDesign = lazyRetry(() => import("./pages/services/NewsletterDesign"));
const MarketResearch = lazyRetry(() => import("./pages/services/MarketResearch"));
const LeadGeneration = lazyRetry(() => import("./pages/services/LeadGeneration"));
const EmailSupport = lazyRetry(() => import("./pages/services/EmailSupport"));
const LiveChatSupport = lazyRetry(() => import("./pages/services/LiveChatSupport"));
const WebsiteContentUpdates = lazyRetry(() => import("./pages/services/WebsiteContentUpdates"));
const UxAudit = lazyRetry(() => import("./pages/services/UxAudit"));

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
      {/* Sprint B (B-01): Allow guest booking but gate verified-only features inside the page */}
      <Route path="/book" element={<SR msg="Booking failed to load"><BookAppointment /></SR>} />
      {/* H-02: Consolidate /booking and /schedule to /book */}
      <Route path="/booking" element={<Navigate to="/book" replace />} />
      <Route path="/schedule" element={<Navigate to="/book" replace />} />
      <Route path="/notary-guide" element={<SR><NotaryGuide /></SR>} />
      <Route path="/ron-info" element={<SR><RonInfo /></SR>} />
      <Route path="/services" element={<SR msg="Services failed to load"><Services /></SR>} />
      <Route path="/services/:serviceId" element={<SR msg="Service details failed to load"><ServiceDetail /></SR>} />
      <Route path="/ron-check" element={<SR><RonEligibilityChecker /></SR>} />
      <Route path="/ron-consult" element={<SR msg="Consult booking failed to load"><BookRonConsult /></SR>} />
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
      {/* Sprint 3-5: Service intake routes */}
      <Route path="/services/clerical-document-preparation" element={<SR><ClericalDocPrep /></SR>} />
      <Route path="/services/document-cleanup" element={<SR><DocumentCleanup /></SR>} />
      <Route path="/services/form-filling" element={<SR><FormFilling /></SR>} />
      <Route path="/services/pdf-services" element={<SR><PdfServices /></SR>} />
      <Route path="/services/document-scanning" element={<SR><DocumentScanning /></SR>} />
      <Route path="/services/document-translation" element={<SR><DocumentTranslation /></SR>} />
      <Route path="/services/apostille-coordination" element={<SR><ApostilleCoordination /></SR>} />
      <Route path="/services/consular-legalization" element={<SR><ConsularLegalization /></SR>} />
      <Route path="/services/kyc-verification" element={<SR><KycVerification /></SR>} />
      <Route path="/services/background-check" element={<SR><BackgroundCheckService /></SR>} />
      <Route path="/services/passport-photo" element={<SR><PassportPhoto /></SR>} />
      <Route path="/services/fingerprinting" element={<SR><FingerprintingService /></SR>} />
      <Route path="/services/interpreter" element={<SR><InterpreterServices /></SR>} />
      <Route path="/services/document-printing" element={<SR><DocumentPrinting /></SR>} />
      <Route path="/services/estate-planning" element={<SR><EstatePlanningService /></SR>} />
      <Route path="/services/business-formation" element={<SR><BusinessFormationService /></SR>} />
      <Route path="/services/court-form-preparation" element={<SR><CourtFormPreparation /></SR>} />
      <Route path="/services/process-serving" element={<SR><ProcessServingService /></SR>} />
      <Route path="/services/courier-service" element={<SR><CourierService /></SR>} />
      {/* Sprint 2: New service intake routes */}
      <Route path="/services/standard-translation" element={<SR><StandardTranslation /></SR>} />
      <Route path="/services/certified-translation" element={<SR><CertifiedTranslation /></SR>} />
      <Route path="/services/court-certified-translation" element={<SR><CourtCertifiedTranslation /></SR>} />
      <Route path="/services/credential-evaluation" element={<SR><CredentialEvaluation /></SR>} />
      <Route path="/services/business-subscriptions" element={<SR><BusinessSubscriptions /></SR>} />
      <Route path="/services/api-integration" element={<SR><ApiIntegration /></SR>} />
      <Route path="/services/white-label-partner" element={<SR><WhiteLabelPartner /></SR>} />
      <Route path="/services/template-library" element={<SR><TemplateLibrary /></SR>} />
      <Route path="/services/ron-onboarding-consulting" element={<SR><RonOnboardingConsulting /></SR>} />
      <Route path="/services/workflow-audit" element={<SR><WorkflowAudit /></SR>} />
      <Route path="/services/email-management" element={<SR><EmailManagement /></SR>} />
      <Route path="/services/certified-doc-prep-agencies" element={<SR><CertifiedDocPrepAgencies /></SR>} />
      <Route path="/services/registered-agent" element={<SR><RegisteredAgent /></SR>} />
      <Route path="/services/data-entry" element={<SR><DataEntry /></SR>} />
      <Route path="/services/travel-arrangements" element={<SR><TravelArrangements /></SR>} />
      <Route path="/services/blog-writing" element={<SR><BlogWriting /></SR>} />
      <Route path="/services/social-media-content" element={<SR><SocialMediaContent /></SR>} />
      <Route path="/services/newsletter-design" element={<SR><NewsletterDesign /></SR>} />
      <Route path="/services/market-research" element={<SR><MarketResearch /></SR>} />
      <Route path="/services/lead-generation" element={<SR><LeadGeneration /></SR>} />
      <Route path="/services/email-support" element={<SR><EmailSupport /></SR>} />
      <Route path="/services/live-chat-support" element={<SR><LiveChatSupport /></SR>} />
      <Route path="/services/website-content-updates" element={<SR><WebsiteContentUpdates /></SR>} />
      <Route path="/services/ux-audit" element={<SR><UxAudit /></SR>} />
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
      {/* H-04: Redirect /professionals to /notaries */}
      <Route path="/professionals" element={<Navigate to="/notaries" replace />} />
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
      {/* /verify-id route moved below to use requireVerifiedEmail gate (Sprint B) */}
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
      <Route path="/shop" element={<SR msg="Shop failed to load"><ShopLanding /></SR>} />
      <Route path="/shop/packages" element={<SR msg="Packages failed to load"><ShopPackages /></SR>} />
      <Route path="/shop/add-ons" element={<SR msg="Add-ons failed to load"><ShopAddons /></SR>} />
      <Route path="/shop/cart" element={<SR msg="Cart failed to load"><ShopCart /></SR>} />
      <Route path="/shop/checkout" element={<SR msg="Checkout failed to load"><ShopCheckout /></SR>} />
      <Route path="/shop/:tier" element={<SR msg="Package detail failed to load"><ShopPackageDetail /></SR>} />
      {/* Duplicate /services/estate-planning removed — defined at line 356 */}
      <Route path="/services/business-contracts" element={<SR msg="Business contracts failed to load"><BusinessContractsServices /></SR>} />
      <Route path="/services/real-estate-closings" element={<SR msg="Real estate closings failed to load"><RealEstateClosingsServices /></SR>} />
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
      <Route path="/animations" element={<SR><AnimationGallery /></SR>} />
      <Route path="/academy" element={<SR msg="Academy failed to load"><AcademyLanding /></SR>} />
      <Route path="/academy/course/:slug" element={<SR msg="Course failed to load"><AcademyCourseDetail /></SR>} />
      <Route path="/academy/lesson/:id" element={<ProtectedRoute><SR msg="Lesson failed to load"><AcademyLessonViewer /></SR></ProtectedRoute>} />
      <Route path="/academy/quiz/:id" element={<ProtectedRoute><SR msg="Quiz failed to load"><AcademyQuiz /></SR></ProtectedRoute>} />
      <Route path="/academy/certificate/:id" element={<ProtectedRoute><SR msg="Certificate failed to load"><AcademyCertificate /></SR></ProtectedRoute>} />
      <Route path="/track/:token" element={<SR msg="Session tracker failed to load"><SessionTracker /></SR>} />
      <Route path="/reschedule/:confirmationNumber" element={<SR msg="Reschedule failed to load"><RescheduleAppointment /></SR>} />
      <Route path="/account-settings" element={<ProtectedRoute><SR msg="Account settings failed to load"><AccountSettings /></SR></ProtectedRoute>} />
      <Route path="/portal" element={<ProtectedRoute><SR msg="Portal failed to load"><ClientPortal /></SR></ProtectedRoute>} />
      <Route path="/confirmation" element={<ProtectedRoute requireVerifiedEmail gateAction="appointment confirmation"><SR msg="Confirmation failed to load"><AppointmentConfirmation /></SR></ProtectedRoute>} />
      {/* Sprint B (B-11): /ron-session enforces email verification AND MFA via routeRequiresMFA */}
      <Route path="/ron-session" element={<ProtectedRoute requireVerifiedEmail gateAction="remote online notarization sessions"><SR msg="RON session failed to load"><RonSession /></SR></ProtectedRoute>} />
      <Route path="/business-portal" element={<ProtectedRoute requireVerifiedEmail gateAction="the business portal"><SR msg="Business portal failed to load"><BusinessPortal /></SR></ProtectedRoute>} />
      <Route path="/verify-id" element={<ProtectedRoute requireVerifiedEmail gateAction="identity verification"><SR msg="Identity verification failed to load"><VerifyIdentity /></SR></ProtectedRoute>} />
      {/* Admin routes — parent requireAdmin gate handles auth for all children (ARCH-002) */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><SR><AdminDashboard /></SR></ProtectedRoute>}>
        <Route index element={<SR msg="Overview failed to load"><AdminOverview /></SR>} />
        <Route path="appointments" element={<SR msg="Appointments failed to load"><AdminAppointments /></SR>} />
        <Route path="clients" element={<SR msg="Clients failed to load"><AdminClients /></SR>} />
        <Route path="availability" element={<SR msg="Availability failed to load"><AdminAvailability /></SR>} />
        <Route path="documents" element={<SR msg="Documents failed to load"><AdminDocuments /></SR>} />
        <Route path="journal" element={<SR msg="Journal failed to load"><AdminJournal /></SR>} />
        {/* M-05: Removed redundant ProtectedRoute — parent already gates admin */}
        <Route path="revenue" element={<SR msg="Revenue failed to load"><AdminRevenue /></SR>} />
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
        <Route path="vendor-products" element={<SR msg="Vendor products failed to load"><AdminVendorProducts /></SR>} />
        <Route path="equipment" element={<SR msg="Equipment failed to load"><AdminEquipment /></SR>} />
        <Route path="e-courses" element={<SR msg="E-Courses failed to load"><AdminECourses /></SR>} />
        <Route path="print-pricing" element={<SR msg="Print pricing failed to load"><AdminPrintPricing /></SR>} />
        <Route path="pricing" element={<ProtectedRoute adminOnly><SR msg="Pricing engine failed to load"><AdminPricing /></SR></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute adminOnly><SR msg="Orders failed to load"><AdminOrders /></SR></ProtectedRoute>} />
        <Route path="shop-orders" element={<ProtectedRoute adminOnly><SR msg="Shop orders failed to load"><AdminShopOrders /></SR></ProtectedRoute>} />
        <Route path="service-catalog-audit" element={<ProtectedRoute adminOnly><SR msg="Catalog audit failed to load"><AdminServiceCatalogAudit /></SR></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute adminOnly><SR msg="Analytics failed to load"><AdminAnalytics /></SR></ProtectedRoute>} />
        <Route path="contractors" element={<ProtectedRoute adminOnly><SR msg="Contractors failed to load"><AdminContractors /></SR></ProtectedRoute>} />
        <Route path="accounting" element={<ProtectedRoute adminOnly><SR msg="Accounting failed to load"><AdminAccounting /></SR></ProtectedRoute>} />
        <Route path="doc-collaboration" element={<ProtectedRoute adminOnly><SR msg="Doc collaboration failed to load"><AdminDocCollaboration /></SR></ProtectedRoute>} />
        <Route path="embeddable-widgets" element={<ProtectedRoute adminOnly><SR msg="Widgets failed to load"><AdminEmbeddableWidgets /></SR></ProtectedRoute>} />
        <Route path="dispatch" element={<ProtectedRoute adminOnly><SR msg="Dispatch failed to load"><AdminDispatch /></SR></ProtectedRoute>} />
        <Route path="messaging-hub" element={<ProtectedRoute adminOnly><SR msg="Messaging hub failed to load"><AdminMessagingHub /></SR></ProtectedRoute>} />
        <Route path="micro-tools" element={<ProtectedRoute adminOnly><SR msg="Micro-tools failed to load"><AdminMicroTools /></SR></ProtectedRoute>} />
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
        <Route path="credentials" element={<SR msg="Credentials failed to load"><AdminCredentials /></SR>} />
        <Route path="todos" element={<SR msg="Todos failed to load"><AdminTodos /></SR>} />
        <Route path="financial-services" element={<ProtectedRoute adminOnly><SR msg="Financial services failed to load"><AdminFinancialServices /></SR></ProtectedRoute>} />
        <Route path="creative-services" element={<ProtectedRoute adminOnly><SR msg="Creative services failed to load"><AdminCreativeServices /></SR></ProtectedRoute>} />
        <Route path="sales-cx" element={<ProtectedRoute adminOnly><SR msg="Sales CX failed to load"><AdminSalesCX /></SR></ProtectedRoute>} />
        <Route path="content-creation" element={<ProtectedRoute adminOnly><SR msg="Content creation failed to load"><AdminContentCreation /></SR></ProtectedRoute>} />
        <Route path="event-bus" element={<ProtectedRoute adminOnly><SR msg="Event bus failed to load"><AdminEventBus /></SR></ProtectedRoute>} />
        <Route path="business-growth" element={<ProtectedRoute adminOnly><SR msg="Business growth failed to load"><AdminBusinessGrowth /></SR></ProtectedRoute>} />
        <Route path="client-timeline" element={<ProtectedRoute adminOnly><SR msg="Client timeline failed to load"><AdminClientTimeline /></SR></ProtectedRoute>} />
        <Route path="platform-health" element={<ProtectedRoute adminOnly><SR msg="Platform health failed to load"><AdminPlatformHealth /></SR></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute adminOnly><SR msg="Reports failed to load"><AdminReportsCenter /></SR></ProtectedRoute>} />
        <Route path="sla-monitor" element={<ProtectedRoute adminOnly><SR msg="SLA monitor failed to load"><AdminSLAMonitor /></SR></ProtectedRoute>} />
        <Route path="ron-dashboard" element={<ProtectedRoute adminOnly><SR msg="RON dashboard failed to load"><AdminRonDashboard /></SR></ProtectedRoute>} />
        <Route path="oath-administration" element={<ProtectedRoute adminOnly><SR msg="Oath administration failed to load"><AdminOathAdministration /></SR></ProtectedRoute>} />
        <Route path="certified-copies" element={<ProtectedRoute adminOnly><SR msg="Certified copies failed to load"><AdminCertifiedCopies /></SR></ProtectedRoute>} />
        <Route path="travel-zones" element={<ProtectedRoute adminOnly><SR msg="Travel zones failed to load"><AdminTravelZones /></SR></ProtectedRoute>} />
        <Route path="witnesses" element={<ProtectedRoute adminOnly><SR msg="Witnesses failed to load"><AdminWitnesses /></SR></ProtectedRoute>} />
        {/* Enterprise Tools */}
        <Route path="enterprise" element={<ProtectedRoute adminOnly><SR msg="Enterprise dashboard failed to load"><EnterpriseDashboard /></SR></ProtectedRoute>} />
        <Route path="enterprise/ai-grader" element={<ProtectedRoute adminOnly><SR msg="AI Grader failed to load"><AIGrader /></SR></ProtectedRoute>} />
        <Route path="enterprise/kyc-search" element={<ProtectedRoute adminOnly><SR msg="KYC Search failed to load"><KYCSearch /></SR></ProtectedRoute>} />
        <Route path="enterprise/ip-hub" element={<ProtectedRoute adminOnly><SR msg="IP Hub failed to load"><IPHub /></SR></ProtectedRoute>} />
        <Route path="enterprise/certificates" element={<ProtectedRoute adminOnly><SR msg="Certificate Generator failed to load"><CertificateGenerator /></SR></ProtectedRoute>} />
        <Route path="enterprise/exhibit-stamper" element={<ProtectedRoute adminOnly><SR msg="Exhibit Stamper failed to load"><ExhibitStamper /></SR></ProtectedRoute>} />
        <Route path="enterprise/digital-vault" element={<ProtectedRoute adminOnly><SR msg="Digital Vault failed to load"><DigitalVault /></SR></ProtectedRoute>} />
        <Route path="enterprise/auto-fleet" element={<ProtectedRoute adminOnly><SR msg="Auto Fleet failed to load"><AutoFleetDesk /></SR></ProtectedRoute>} />
        <Route path="enterprise/lien-center" element={<ProtectedRoute adminOnly><SR msg="Lien Center failed to load"><LienCommandCenter /></SR></ProtectedRoute>} />
        <Route path="enterprise/trust-scheduler" element={<ProtectedRoute adminOnly><SR msg="Trust Scheduler failed to load"><TrustScheduler /></SR></ProtectedRoute>} />
        <Route path="enterprise/b2b-dispatch" element={<ProtectedRoute adminOnly><SR msg="B2B Dispatch failed to load"><B2BDispatch /></SR></ProtectedRoute>} />
        <Route path="enterprise/corporate-compliance" element={<ProtectedRoute adminOnly><SR msg="Corporate Compliance failed to load"><CorporateCompliance /></SR></ProtectedRoute>} />
        <Route path="enterprise/immigration-hub" element={<ProtectedRoute adminOnly><SR msg="Immigration Hub failed to load"><ImmigrationHub /></SR></ProtectedRoute>} />
        <Route path="enterprise/apostille-matrix" element={<ProtectedRoute adminOnly><SR msg="Apostille Matrix failed to load"><ApostilleMatrix /></SR></ProtectedRoute>} />
        <Route path="enterprise/brand-settings" element={<ProtectedRoute adminOnly><SR msg="Brand Settings failed to load"><BrandSettings /></SR></ProtectedRoute>} />
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
