import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEdgeFunctionHeaders } from "@/lib/edgeFunctionAuth";
import {
  Wifi, WifiOff, CheckCircle, XCircle, Loader2, Play, ArrowRight,
  Monitor, CreditCard, UserPlus, FileText, Shield, Clock, Video,
  Database, HardDrive, Mail
} from "lucide-react";

type TestStatus = "idle" | "running" | "success" | "error";

interface StepResult {
  status: TestStatus;
  message: string;
  responseTime?: number;
}

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

export default function AdminIntegrationTest() {
  const { toast } = useToast();
  const [apiTest, setApiTest] = useState<StepResult>({ status: "idle", message: "" });
  const [stripeTest, setStripeTest] = useState<StepResult>({ status: "idle", message: "" });
  const [dbTest, setDbTest] = useState<StepResult>({ status: "idle", message: "" });
  const [storageTest, setStorageTest] = useState<StepResult>({ status: "idle", message: "" });
  const [emailTest, setEmailTest] = useState<StepResult>({ status: "idle", message: "" });

  const testSignNowConnection = async () => {
    setApiTest({ status: "running", message: "Pinging SignNow API..." });
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signnow`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "list_documents" }),
      });
      const elapsed = Date.now() - start;
      const data = await resp.json();
      if (resp.ok && !data.error) {
        setApiTest({ status: "success", message: `Connected successfully.`, responseTime: elapsed });
      } else {
        setApiTest({ status: "error", message: data.error || `HTTP ${resp.status}`, responseTime: elapsed });
      }
    } catch (e: any) {
      setApiTest({ status: "error", message: e.message, responseTime: Date.now() - start });
    }
  };

  const testStripeConnection = async () => {
    setStripeTest({ status: "running", message: "Checking Stripe configuration..." });
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-config`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const elapsed = Date.now() - start;
      const data = await resp.json();
      if (resp.ok && data.publishableKey) {
        setStripeTest({ status: "success", message: "Stripe keys configured and responding.", responseTime: elapsed });
      } else {
        setStripeTest({ status: "error", message: data.error || "Missing publishable key", responseTime: elapsed });
      }
    } catch (e: any) {
      setStripeTest({ status: "error", message: e.message, responseTime: Date.now() - start });
    }
  };

  const testDatabaseConnection = async () => {
    setDbTest({ status: "running", message: "Querying database..." });
    const start = Date.now();
    try {
      const { data, error } = await supabase.from("platform_settings").select("setting_key").limit(1);
      const elapsed = Date.now() - start;
      if (error) {
        setDbTest({ status: "error", message: error.message, responseTime: elapsed });
      } else {
        setDbTest({ status: "success", message: `Database connected. Query returned ${data?.length ?? 0} row(s).`, responseTime: elapsed });
      }
    } catch (e: any) {
      setDbTest({ status: "error", message: e.message, responseTime: Date.now() - start });
    }
  };

  const testStorageConnection = async () => {
    setStorageTest({ status: "running", message: "Listing storage bucket..." });
    const start = Date.now();
    try {
      const { data, error } = await supabase.storage.from("documents").list("", { limit: 1 });
      const elapsed = Date.now() - start;
      if (error) {
        setStorageTest({ status: "error", message: error.message, responseTime: elapsed });
      } else {
        setStorageTest({ status: "success", message: `Storage bucket accessible. Found ${data?.length ?? 0} item(s).`, responseTime: elapsed });
      }
    } catch (e: any) {
      setStorageTest({ status: "error", message: e.message, responseTime: Date.now() - start });
    }
  };

  const testEmailFunction = async () => {
    setEmailTest({ status: "running", message: "Testing email function..." });
    const start = Date.now();
    try {
      const headers = await getEdgeFunctionHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-correspondence`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dry_run: true }),
      });
      const elapsed = Date.now() - start;
      if (resp.ok) {
        setEmailTest({ status: "success", message: "Email function reachable and responding.", responseTime: elapsed });
      } else {
        const data = await resp.json().catch(() => ({}));
        setEmailTest({ status: "error", message: data.error || `HTTP ${resp.status}`, responseTime: elapsed });
      }
    } catch (e: any) {
      setEmailTest({ status: "error", message: e.message, responseTime: Date.now() - start });
    }
  };

  const StatusIcon = ({ status }: { status: TestStatus }) => {
    if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    if (status === "success") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const TestCard = ({ title, icon: Icon, result, onTest, description }: {
    title: string;
    icon: React.ElementType;
    result: StepResult;
    onTest: () => void;
    description: string;
  }) => (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-sans text-lg flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button onClick={onTest} disabled={result.status === "running"} variant="outline">
            {result.status === "running" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Test Connection
          </Button>
          <div className="flex items-center gap-2">
            <StatusIcon status={result.status} />
            <span className="text-sm text-muted-foreground">{result.message || "Not tested"}</span>
          </div>
          {result.responseTime !== undefined && (
            <Badge variant="outline" className="text-xs">{result.responseTime}ms</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-bold text-foreground">Integration Testing & Process Flows</h1>
        <p className="text-sm text-muted-foreground">Test API connections, database, storage, and view integration process documentation</p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connection Tests</TabsTrigger>
          <TabsTrigger value="flows">Process Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                testDatabaseConnection();
                testStorageConnection();
                testSignNowConnection();
                testStripeConnection();
                testEmailFunction();
              }}
            >
              <Play className="mr-2 h-4 w-4" /> Run All Tests
            </Button>
          </div>

          <TestCard title="Database" icon={Database} result={dbTest} onTest={testDatabaseConnection} description="Queries the platform_settings table to verify database connectivity and RLS policies." />
          <TestCard title="File Storage" icon={HardDrive} result={storageTest} onTest={testStorageConnection} description="Lists the documents storage bucket to verify file storage access." />
          <TestCard title="SignNow API" icon={Monitor} result={apiTest} onTest={testSignNowConnection} description="Tests the SignNow REST API connection by listing documents. Requires SIGNNOW_API_TOKEN secret." />
          <TestCard title="Stripe Payment Gateway" icon={CreditCard} result={stripeTest} onTest={testStripeConnection} description="Verifies Stripe publishable key is configured and the get-stripe-config function responds." />
          <TestCard title="Email Function" icon={Mail} result={emailTest} onTest={testEmailFunction} description="Sends a dry-run request to the send-correspondence edge function to verify it's deployed and reachable." />
        </TabsContent>

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
