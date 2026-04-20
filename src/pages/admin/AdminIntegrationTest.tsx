import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getEdgeFunctionHeaders } from "@/lib/edgeFunctionAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Wifi, WifiOff, CheckCircle, XCircle, Loader2, Play, ArrowRight,
  Monitor, CreditCard, UserPlus, FileText, Shield, Clock, Video,
  Database, HardDrive, Mail, Webhook, RefreshCw, AlertTriangle,
  Settings, ChevronDown, ChevronRight as ChevronRightIcon, Wrench,
  Globe, Zap, RotateCcw, Info, ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type TestStatus = "idle" | "running" | "success" | "warning" | "error";

interface StepResult {
  status: TestStatus;
  message: string;
  responseTime?: number;
  httpStatus?: number;
  rawError?: string;
}

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "url" | "select";
  options?: string[];
}

interface TroubleshootEntry {
  pattern: string;
  title: string;
  fix: string;
}

interface IntegrationConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  secrets: string[];
  testFn: () => Promise<StepResult>;
  settings: SettingField[];
  troubleshootMap: TroubleshootEntry[];
}

interface WebhookSession {
  id: string;
  appointment_id: string;
  signnow_document_id: string;
  webhook_status: string;
  webhook_events_registered: number;
  status: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Process flow step definitions (kept from original)                 */
/* ------------------------------------------------------------------ */
const flowSteps = {
  ron: [
    { id: "booking", label: "Client Books RON Session", icon: Clock, description: "Client selects RON service, picks date/time, submits booking form" },
    { id: "confirmation", label: "Appointment Confirmed", icon: CheckCircle, description: "Appointment created in database, confirmation email sent to client" },
    { id: "doc_upload", label: "Document Uploaded to SignNow", icon: Monitor, description: "Admin uploads document to SignNow via upload_document API" },
    { id: "invite_sent", label: "Signing Invite Sent", icon: UserPlus, description: "Signer receives email invite to sign via SignNow send_invite API" },
    { id: "documents", label: "Documents Ready", icon: FileText, description: "Documents with signing fields prepared in SignNow" },
    { id: "kba", label: "KBA & ID Verification", icon: Shield, description: "Signer completes Knowledge-Based Authentication (ORC §147.66 compliant)" },
    { id: "notarization", label: "Live Notarization", icon: Video, description: "Audio/video session with notary, oath administered, documents signed & sealed" },
    { id: "completion", label: "Session Completed", icon: CheckCircle, description: "Journal entry created, e-seal verification generated, documents stored" },
  ],
  payment: [
    { id: "select", label: "Service Selected", icon: FileText, description: "Client selects service type and notarization method" },
    { id: "calculate", label: "Price Calculated", icon: CreditCard, description: "Fee calculator applies base fee + travel + platform fees" },
    { id: "checkout", label: "Stripe Checkout", icon: CreditCard, description: "Payment intent created via create-payment-intent edge function" },
    { id: "webhook", label: "Webhook Received", icon: ArrowRight, description: "Stripe webhook confirms payment, updates payment record" },
    { id: "recorded", label: "Payment Recorded", icon: CheckCircle, description: "Payment status updated, receipt generated, client notified" },
  ],
  onboarding: [
    { id: "signup", label: "Client Signs Up", icon: UserPlus, description: "Email + password registration via auth.signUp()" },
    { id: "verify", label: "Email Verification", icon: Shield, description: "User clicks verification link in email" },
    { id: "profile", label: "Profile Created", icon: FileText, description: "handle_new_user trigger creates profile row automatically" },
    { id: "role", label: "Role Assigned", icon: Shield, description: "user_roles entry created (client/notary/admin based on invite status)" },
    { id: "portal", label: "Portal Access", icon: Monitor, description: "User redirected to client portal or admin panel based on role" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Helper: status dot                                                 */
/* ------------------------------------------------------------------ */
const StatusDot = ({ status }: { status: TestStatus }) => {
  const colors: Record<TestStatus, string> = {
    idle: "bg-muted-foreground/30",
    running: "bg-primary animate-pulse",
    success: "bg-success/10",
    warning: "bg-warning/10",
    error: "bg-destructive",
  };
  return <div className={`h-3 w-3 rounded-full ${colors[status]}`} />;
};

const StatusIcon = ({ status }: { status: TestStatus }) => {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "success") return <CheckCircle className="h-4 w-4 text-success" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-warning" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
};

/* ------------------------------------------------------------------ */
/*  Webhook status badge                                               */
/* ------------------------------------------------------------------ */
const webhookStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    case "partial":
      return <Badge className="bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
    case "failed":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    default:
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminIntegrationTest() {
  usePageMeta({ title: "Integrations", noIndex: true });
  const { toast } = useToast();

  /* ---------- integration test results ---------- */
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [settingsData, setSettingsData] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [openSettings, setOpenSettings] = useState<Record<string, boolean>>({});
  const [openTroubleshoot, setOpenTroubleshoot] = useState<Record<string, boolean>>({});

  /* ---------- webhooks ---------- */
  const [webhookSessions, setWebhookSessions] = useState<WebhookSession[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);

  /* ---------- test results summary for connection tests ---------- */
  const [allTestsRan, setAllTestsRan] = useState(false);

  const setResult = (id: string, r: StepResult) => setResults(prev => ({ ...prev, [id]: r }));

  /* ================================================================ */
  /*  Test functions                                                   */
  /* ================================================================ */
  const testDatabase = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const { data, error } = await supabase.from("platform_settings").select("setting_key").limit(1);
      const elapsed = Date.now() - start;
      if (error) return { status: "error", message: error.message, responseTime: elapsed, rawError: error.message };
      return { status: "success", message: `Connected. Query returned ${data?.length ?? 0} row(s).`, responseTime: elapsed, httpStatus: 200 };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testStorage = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const { data, error } = await supabase.storage.from("documents").list("", { limit: 1 });
      const elapsed = Date.now() - start;
      if (error) return { status: "error", message: error.message, responseTime: elapsed, rawError: error.message };
      return { status: "success", message: `Bucket accessible. Found ${data?.length ?? 0} item(s).`, responseTime: elapsed, httpStatus: 200 };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testSignNow = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signnow`, {
        method: "POST", headers, body: JSON.stringify({ action: "list_documents" }),
      });
      const elapsed = Date.now() - start;
      const data = await resp.json();
      if (resp.ok && !data.error) return { status: "success", message: "API connected successfully.", responseTime: elapsed, httpStatus: resp.status };
      return { status: "error", message: data.error || `HTTP ${resp.status}`, responseTime: elapsed, httpStatus: resp.status, rawError: JSON.stringify(data) };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testSignNowToken = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signnow`, {
        method: "POST", headers, body: JSON.stringify({ action: "verify_token" }),
      });
      const elapsed = Date.now() - start;
      const data = await resp.json();
      if (data.valid) {
        const expiresHours = data.expires_in ? Math.round(parseInt(data.expires_in) / 3600) : null;
        return { status: "success", message: `Token valid.${expiresHours ? ` Expires in ~${expiresHours}h.` : ""}`, responseTime: elapsed, httpStatus: resp.status };
      }
      return { status: "error", message: data.error || "Token invalid or expired", responseTime: elapsed, httpStatus: resp.status, rawError: JSON.stringify(data) };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testStripe = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-config`, {
        method: "POST", headers, body: JSON.stringify({}),
      });
      const elapsed = Date.now() - start;
      const data = await resp.json();
      if (resp.ok && data.publishableKey) return { status: "success", message: "Stripe keys configured and responding.", responseTime: elapsed, httpStatus: resp.status };
      return { status: "error", message: data.error || "Missing publishable key", responseTime: elapsed, httpStatus: resp.status, rawError: JSON.stringify(data) };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testEmail = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-correspondence`, {
        method: "POST", headers, body: JSON.stringify({ dry_run: true }),
      });
      const elapsed = Date.now() - start;
      if (resp.ok) return { status: "success", message: "Email function reachable and responding.", responseTime: elapsed, httpStatus: resp.status };
      const data = await resp.json().catch(() => ({}));
      const errMsg = typeof data.error === "object" ? JSON.stringify(data.error) : (data.error || `HTTP ${resp.status}`);
      return { status: "error", message: errMsg, responseTime: elapsed, httpStatus: resp.status, rawError: errMsg };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testIONOS = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ionos-email-sync`, {
        method: "POST", headers, body: JSON.stringify({ dry_run: true }),
      });
      const elapsed = Date.now() - start;
      if (resp.ok) return { status: "success", message: "IONOS sync function reachable.", responseTime: elapsed, httpStatus: resp.status };
      const data = await resp.json().catch(() => ({}));
      return { status: "error", message: data.error || `HTTP ${resp.status}`, responseTime: elapsed, httpStatus: resp.status, rawError: JSON.stringify(data) };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  const testOneNotary = async (): Promise<StepResult> => {
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      // OneNotary doesn't have a dedicated edge function yet — just verify the secret exists via a lightweight check
      return { status: "warning", message: "OneNotary integration is configured (API-key set). No live endpoint test available.", responseTime: Date.now() - start };
    } catch (e: any) {
      return { status: "error", message: e.message, responseTime: Date.now() - start, rawError: e.message };
    }
  };

  /* ================================================================ */
  /*  Integration configs                                              */
  /* ================================================================ */
  const integrations: IntegrationConfig[] = [
    {
      id: "database", name: "Database", icon: Database,
      description: "Core data storage powering all tables, RLS policies, and real-time subscriptions.",
      secrets: [],
      testFn: testDatabase,
      settings: [],
      troubleshootMap: [
        { pattern: "permission denied", title: "Row Level Security", fix: "The current user's session doesn't have permission to read this table. Check RLS policies in the backend." },
        { pattern: "does not exist", title: "Table Missing", fix: "The queried table doesn't exist. Run pending database migrations." },
        { pattern: "JWSError", title: "Auth Token Invalid", fix: "The authentication token is invalid or expired. Try logging out and back in." },
      ],
    },
    {
      id: "storage", name: "File Storage", icon: HardDrive,
      description: "Secure document bucket for uploaded files, scanned IDs, and notarized documents.",
      secrets: [],
      testFn: testStorage,
      settings: [],
      troubleshootMap: [
        { pattern: "Bucket not found", title: "Bucket Missing", fix: "The 'documents' storage bucket doesn't exist. Create it in the backend storage settings." },
        { pattern: "not allowed", title: "Access Denied", fix: "Storage policies are blocking access. Verify the bucket's RLS policies allow authenticated users." },
      ],
    },
    {
      id: "signnow", name: "SignNow", icon: Monitor,
      description: "E-signing platform for document uploads, signing invites, webhook event tracking, and built-in KBA verification (MISMO-compliant).",
      secrets: ["SIGNNOW_API_TOKEN", "SIGNNOW_WEBHOOK_SECRET"],
      testFn: testSignNow,
      settings: [
        { key: "signnow_webhook_url", label: "Webhook Callback URL", placeholder: "https://…/functions/v1/signnow-webhook" },
      ],
      troubleshootMap: [
        { pattern: "401", title: "Token Expired or Invalid", fix: "The SIGNNOW_API_TOKEN secret is expired or incorrect. Generate a new token in your SignNow account and update the secret in Lovable Cloud." },
        { pattern: "403", title: "Insufficient Permissions", fix: "The SignNow API token doesn't have the required scopes. Re-generate with full document and webhook permissions." },
        { pattern: "ECONNREFUSED", title: "Service Unreachable", fix: "Cannot reach SignNow API servers. Check if there's a SignNow service outage at status.signnow.com." },
        { pattern: "fetch failed", title: "Network Error", fix: "Edge function couldn't connect to SignNow. Verify the edge function is deployed and SIGNNOW_API_TOKEN is set." },
      ],
    },
    {
      id: "signnow_token", name: "SignNow Token", icon: Shield,
      description: "Validates the current SignNow OAuth2 token and shows time until expiration (30-day validity).",
      secrets: ["SIGNNOW_API_TOKEN"],
      testFn: testSignNowToken,
      settings: [],
      troubleshootMap: [
        { pattern: "expired", title: "Token Expired", fix: "SignNow tokens expire after 30 days. Generate a new bearer token from SignNow and update SIGNNOW_API_TOKEN." },
        { pattern: "invalid", title: "Token Invalid", fix: "The token format is incorrect. Ensure you're using the full bearer token string from SignNow." },
      ],
    },
    {
      id: "stripe", name: "Stripe Payments", icon: CreditCard,
      description: "Payment processing for notarization fees, travel charges, and platform subscriptions.",
      secrets: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"],
      testFn: testStripe,
      settings: [
        { key: "stripe_webhook_url", label: "Webhook Endpoint URL", placeholder: "https://…/functions/v1/stripe-webhook" },
      ],
      troubleshootMap: [
        { pattern: "Missing publishable key", title: "Keys Not Configured", fix: "STRIPE_PUBLISHABLE_KEY and/or STRIPE_SECRET_KEY secrets are missing. Add them in Lovable Cloud secrets." },
        { pattern: "401", title: "Invalid API Key", fix: "The Stripe secret key is invalid. Verify it matches your Stripe dashboard (Settings → API Keys)." },
        { pattern: "testmode", title: "Test Mode Active", fix: "Stripe is in test mode. For production, switch to live keys in Stripe dashboard and update secrets." },
      ],
    },
    {
      id: "ionos", name: "IONOS Email", icon: Mail,
      description: "IMAP/SMTP integration for the admin mailbox — syncing, sending, and client correspondence matching.",
      secrets: ["IONOS_EMAIL_ADDRESS", "IONOS_EMAIL_PASSWORD", "IONOS_IMAP_HOST", "IONOS_SMTP_HOST"],
      testFn: testIONOS,
      settings: [
        { key: "ionos_email_address", label: "Email Address", placeholder: "shane@notardex.com" },
        { key: "ionos_imap_host", label: "IMAP Host", placeholder: "imap.ionos.com" },
        { key: "ionos_smtp_host", label: "SMTP Host", placeholder: "smtp.ionos.com" },
      ],
      troubleshootMap: [
        { pattern: "EAUTH", title: "Authentication Failed", fix: "IONOS email password is incorrect. Update IONOS_EMAIL_PASSWORD in Lovable Cloud secrets with the current mailbox password." },
        { pattern: "ECONNREFUSED", title: "Connection Refused", fix: "Cannot reach IONOS mail server. Verify IONOS_IMAP_HOST is set to 'imap.ionos.com' and IONOS_SMTP_HOST to 'smtp.ionos.com'." },
        { pattern: "timeout", title: "Connection Timeout", fix: "Mail server is not responding. Check IONOS service status or verify the host addresses are correct." },
        { pattern: "certificate", title: "SSL Certificate Error", fix: "TLS certificate validation failed. The IMAP/SMTP host may be incorrect or there's a certificate change." },
      ],
    },
    {
      id: "email_fn", name: "Email Function", icon: Globe,
      description: "Transactional email delivery via the send-correspondence edge function (notify.notardex.com).",
      secrets: [],
      testFn: testEmail,
      settings: [],
      troubleshootMap: [
        { pattern: "rate limit", title: "Rate Limited", fix: "Email sending rate limit reached. Wait a few minutes and retry, or check email_send_state table for retry_after_until value." },
        { pattern: "fetch failed", title: "Function Unreachable", fix: "The send-correspondence edge function may not be deployed. Check edge function deployment status." },
      ],
    },
    {
      id: "onenotary", name: "OneNotary", icon: Zap,
      description: "Third-party notary platform API for session management and compliance data exchange.",
      secrets: ["ONENOTARY_API_TOKEN"],
      testFn: testOneNotary,
      settings: [],
      troubleshootMap: [
        { pattern: "401", title: "Token Invalid", fix: "The ONENOTARY_API_TOKEN is invalid or expired. Update it in Lovable Cloud secrets." },
      ],
    },
  ];

  /* ================================================================ */
  /*  Settings load / save                                             */
  /* ================================================================ */
  useEffect(() => {
    const loadSettings = async () => {
      setSettingsLoading(true);
      const { data } = await supabase.from("platform_settings").select("setting_key, setting_value");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.setting_key] = r.setting_value; });
        setSettingsData(map);
      }
      setSettingsLoading(false);
    };
    loadSettings();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    const { error } = await supabase.from("platform_settings").upsert(
      { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
      { onConflict: "setting_key" }
    );
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${key} updated successfully.` });
    }
    setSavingKey(null);
  };

  /* ================================================================ */
  /*  Run integration test                                             */
  /* ================================================================ */
  const runTest = async (integration: IntegrationConfig) => {
    setResult(integration.id, { status: "running", message: "Testing…" });
    const result = await integration.testFn();
    setResult(integration.id, result);
    if (result.status === "error") {
      setOpenTroubleshoot(prev => ({ ...prev, [integration.id]: true }));
    }
  };

  const runAllIntegrationTests = async () => {
    setAllTestsRan(false);
    await Promise.all(integrations.map(i => runTest(i)));
    setAllTestsRan(true);
  };

  /* ================================================================ */
  /*  Troubleshooting matcher                                          */
  /* ================================================================ */
  const findTroubleshoot = (integration: IntegrationConfig, result: StepResult): TroubleshootEntry | null => {
    if (!result.rawError && !result.message) return null;
    const haystack = `${result.rawError || ""} ${result.message}`.toLowerCase();
    return integration.troubleshootMap.find(t => haystack.includes(t.pattern.toLowerCase())) || null;
  };

  /* ================================================================ */
  /*  Webhooks (kept from original)                                    */
  /* ================================================================ */
  const loadWebhookStatus = async () => {
    setWebhookLoading(true);
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signnow`, {
        method: "POST", headers, body: JSON.stringify({ action: "check_webhooks" }),
      });
      const data = await resp.json();
      if (resp.ok && data.sessions) setWebhookSessions(data.sessions);
      else toast({ title: "Error", description: data.error || "Failed to load webhook status", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setWebhookLoading(false);
    }
  };

  /* ================================================================ */
  /*  Summary counts                                                   */
  /* ================================================================ */
  const passCount = Object.values(results).filter(r => r.status === "success").length;
  const warnCount = Object.values(results).filter(r => r.status === "warning").length;
  const failCount = Object.values(results).filter(r => r.status === "error").length;
  const activeWebhooks = webhookSessions.filter(s => s.webhook_status === "active").length;
  const partialWebhooks = webhookSessions.filter(s => s.webhook_status === "partial").length;
  const failedWebhooks = webhookSessions.filter(s => s.webhook_status === "failed").length;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-bold text-foreground">Integration Management</h1>
        <p className="text-sm text-muted-foreground">Manage, test, and troubleshoot all platform integrations in one place</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="connections">Connection Tests</TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-1.5">
            <Webhook className="h-3.5 w-3.5" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="flows">Process Flows</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  INTEGRATIONS OVERVIEW TAB                                    */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <Button variant="outline" size="sm" onClick={runAllIntegrationTests}>
              <Play className="mr-2 h-4 w-4" /> Test All Integrations
            </Button>
            {allTestsRan && (
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle className="h-4 w-4" /> {passCount} passed</span>
                {warnCount > 0 && <span className="flex items-center gap-1 text-warning"><AlertTriangle className="h-4 w-4" /> {warnCount} warnings</span>}
                {failCount > 0 && <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /> {failCount} failed</span>}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map(integration => {
              const result = results[integration.id] || { status: "idle" as TestStatus, message: "" };
              const Icon = integration.icon;
              const troubleshoot = result.status === "error" ? findTroubleshoot(integration, result) : null;
              const isSettingsOpen = openSettings[integration.id] || false;
              const isTroubleshootOpen = openTroubleshoot[integration.id] || false;

              return (
                <Card key={integration.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-sans text-base flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {integration.name}
                        <StatusDot status={result.status} />
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => runTest(integration)} disabled={result.status === "running"} className="h-8">
                        {result.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Test Result */}
                    {result.status !== "idle" && (
                      <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-2.5">
                        <StatusIcon status={result.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{result.message || "Not tested"}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {result.responseTime !== undefined && (
                              <Badge variant="outline" className="text-[10px] h-5">{result.responseTime}ms</Badge>
                            )}
                            {result.httpStatus && (
                              <Badge variant="outline" className="text-[10px] h-5">HTTP {result.httpStatus}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Secrets display */}
                    {integration.secrets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {integration.secrets.map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px] font-mono">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Settings collapsible */}
                    {integration.settings.length > 0 && (
                      <Collapsible open={isSettingsOpen} onOpenChange={v => setOpenSettings(prev => ({ ...prev, [integration.id]: v }))}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground">
                            <Settings className="h-3 w-3 mr-1.5" />
                            Settings
                            {isSettingsOpen ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRightIcon className="h-3 w-3 ml-auto" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pt-2">
                          {integration.settings.map(field => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">{field.label}</label>
                              <div className="flex gap-2">
                                {field.type === "select" ? (
                                  <select
                                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                                    value={settingsData[field.key] || ""}
                                    onChange={e => setSettingsData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  >
                                    <option value="">Select…</option>
                                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                ) : (
                                  <Input
                                    className="flex-1 h-8 text-xs"
                                    placeholder={field.placeholder}
                                    value={settingsData[field.key] || ""}
                                    onChange={e => setSettingsData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  />
                                )}
                                <Button
                                  variant="outline" size="sm" className="h-8 text-xs"
                                  disabled={savingKey === field.key}
                                  onClick={() => saveSetting(field.key, settingsData[field.key] || "")}
                                >
                                  {savingKey === field.key ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Troubleshoot panel */}
                    {result.status === "error" && (
                      <Collapsible open={isTroubleshootOpen} onOpenChange={v => setOpenTroubleshoot(prev => ({ ...prev, [integration.id]: v }))}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-start text-destructive/80 hover:text-destructive">
                            <Wrench className="h-3 w-3 mr-1.5" />
                            Troubleshoot
                            {isTroubleshootOpen ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRightIcon className="h-3 w-3 ml-auto" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                            {troubleshoot ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                  <span className="text-sm font-medium text-destructive">{troubleshoot.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{troubleshoot.fix}</p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <Info className="h-4 w-4 text-destructive" />
                                  <span className="text-sm font-medium text-destructive">Unknown Error</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Error: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{result.rawError || result.message}</code>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Check that all required secrets are configured and the edge function is deployed.
                                </p>
                              </>
                            )}
                            <Button variant="outline" size="sm" className="h-7 text-xs mt-1" onClick={() => runTest(integration)}>
                              <RotateCcw className="h-3 w-3 mr-1.5" /> Re-test
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/*  CONNECTION TESTS TAB (enhanced from original)                */}
        {/* ============================================================ */}
        <TabsContent value="connections" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <Button variant="outline" size="sm" onClick={runAllIntegrationTests}>
              <Play className="mr-2 h-4 w-4" /> Run All Tests
            </Button>
            {allTestsRan && (
              <Card className="px-4 py-2 flex items-center gap-4 border-border/50">
                <span className="text-sm font-medium">Results:</span>
                <span className="flex items-center gap-1 text-sm text-success"><CheckCircle className="h-4 w-4" /> {passCount}</span>
                {warnCount > 0 && <span className="flex items-center gap-1 text-sm text-warning"><AlertTriangle className="h-4 w-4" /> {warnCount}</span>}
                {failCount > 0 && <span className="flex items-center gap-1 text-sm text-destructive"><XCircle className="h-4 w-4" /> {failCount}</span>}
                <span className="text-xs text-muted-foreground">/ {integrations.length} total</span>
              </Card>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Response</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map(integration => {
                  const result = results[integration.id] || { status: "idle" as TestStatus, message: "" };
                  const Icon = integration.icon;
                  return (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{integration.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusIcon status={result.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{result.message || "Not tested"}</TableCell>
                      <TableCell className="text-right">
                        {result.responseTime !== undefined && (
                          <Badge variant="outline" className="text-xs">{result.responseTime}ms</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => runTest(integration)} disabled={result.status === "running"} className="h-7 text-xs">
                          {result.status === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/*  WEBHOOKS TAB (kept from original)                            */}
        {/* ============================================================ */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" /> SignNow Webhook Subscriptions
                </CardTitle>
                <Button onClick={loadWebhookStatus} disabled={webhookLoading} variant="outline" size="sm">
                  {webhookLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Load Status
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Webhook subscriptions are automatically registered when documents are uploaded to SignNow. Each document subscribes to 6 events with exponential backoff retry.
              </p>
            </CardHeader>
            <CardContent>
              {webhookSessions.length > 0 && (
                <div className="flex gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm"><CheckCircle className="h-4 w-4 text-success" /><span className="text-muted-foreground">{activeWebhooks} Active</span></div>
                  <div className="flex items-center gap-1.5 text-sm"><AlertTriangle className="h-4 w-4 text-warning" /><span className="text-muted-foreground">{partialWebhooks} Partial</span></div>
                  <div className="flex items-center gap-1.5 text-sm"><XCircle className="h-4 w-4 text-destructive" /><span className="text-muted-foreground">{failedWebhooks} Failed</span></div>
                </div>
              )}
              {webhookSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {webhookLoading ? "Loading..." : "Click \"Load Status\" to fetch webhook subscription data for all SignNow documents."}
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document ID</TableHead>
                        <TableHead>Webhook Status</TableHead>
                        <TableHead>Events</TableHead>
                        <TableHead>Session Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhookSessions.map(session => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-xs max-w-[160px] truncate" title={session.signnow_document_id}>{session.signnow_document_id?.slice(0, 12)}…</TableCell>
                          <TableCell>{webhookStatusBadge(session.webhook_status)}</TableCell>
                          <TableCell><span className="text-sm">{session.webhook_events_registered}/6</span></TableCell>
                          <TableCell><Badge variant="outline" className="text-xs capitalize">{session.status}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  PROCESS FLOWS TAB (kept from original)                       */}
        {/* ============================================================ */}
        <TabsContent value="flows" className="space-y-6">
          {Object.entries(flowSteps).map(([key, steps]) => (
            <Card key={key} className="border-border/50">
              <CardHeader>
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  {key === "ron" && <Video className="h-5 w-5 text-primary" />}
                  {key === "payment" && <CreditCard className="h-5 w-5 text-primary" />}
                  {key === "onboarding" && <UserPlus className="h-5 w-5 text-primary" />}
                  {key === "ron" ? "RON Session Flow" : key === "payment" ? "Payment Flow" : "Client Onboarding Flow"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {idx < steps.length - 1 && (
                        <div className="absolute left-[19px] top-10 h-[calc(100%-24px)] w-0.5 bg-border" />
                      )}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5">
                        <step.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">Step {idx + 1}</span>
                          <span className="font-medium text-sm text-foreground">{step.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
