import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Shield, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { callEdgeFunction } from "@/lib/edgeFunctionAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";

interface HealthCheck { name: string; status: "ok" | "error" | "pending"; latencyMs?: number; detail?: string }

export default function AdminSystemHealth() {
  usePageMeta({ title: "System Health", description: "Platform system health monitoring" });
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runChecks = async () => {
    setRunning(true);
    const results: HealthCheck[] = [];

    // 1. Edge function health
    const t0 = Date.now();
    try {
      const r = await callEdgeFunction("health-check");
      results.push({ name: "Edge Functions", status: r ? "ok" : "error", latencyMs: Date.now() - t0, detail: "health-check responded" });
    } catch {
      results.push({ name: "Edge Functions", status: "error", latencyMs: Date.now() - t0, detail: "health-check failed" });
    }

    // 2. Database
    const t1 = Date.now();
    try {
      const { error } = await supabase.from("platform_settings").select("setting_key").limit(1);
      results.push({ name: "Database", status: error ? "error" : "ok", latencyMs: Date.now() - t1, detail: error?.message || "Connected" });
    } catch {
      results.push({ name: "Database", status: "error", latencyMs: Date.now() - t1 });
    }

    // 3. Storage
    const t2 = Date.now();
    try {
      const { error } = await supabase.storage.from("documents").list("", { limit: 1 });
      results.push({ name: "File Storage", status: error ? "error" : "ok", latencyMs: Date.now() - t2, detail: error?.message || "Accessible" });
    } catch {
      results.push({ name: "File Storage", status: "error", latencyMs: Date.now() - t2 });
    }

    // 4. Auth
    const t3 = Date.now();
    try {
      const { data } = await supabase.auth.getSession();
      results.push({ name: "Authentication", status: data.session ? "ok" : "error", latencyMs: Date.now() - t3, detail: data.session ? "Active session" : "No session" });
    } catch {
      results.push({ name: "Authentication", status: "error", latencyMs: Date.now() - t3 });
    }

    setChecks(results);
    setLastRun(new Date().toLocaleTimeString());
    setRunning(false);
  };

  const overallStatus = checks.length === 0 ? "pending" : checks.every(c => c.status === "ok") ? "ok" : "error";
  const icons: Record<string, typeof Database> = { "Database": Database, "Edge Functions": Server, "File Storage": Shield, "Authentication": Activity };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">System Health</h1>
          <p className="text-sm text-muted-foreground">{lastRun ? `Last checked: ${lastRun}` : "Run a health check to see system status"}</p>
        </div>
        <Button onClick={runChecks} disabled={running}>
          {running ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
          Run Health Check
        </Button>
      </div>

      {checks.length > 0 && (
        <Card className={overallStatus === "ok" ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="flex items-center gap-3 pt-6">
            {overallStatus === "ok" ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-destructive" />}
            <div>
              <p className="font-medium">{overallStatus === "ok" ? "All Systems Operational" : "Issues Detected"}</p>
              <p className="text-xs text-muted-foreground">{checks.filter(c => c.status === "ok").length}/{checks.length} services healthy</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {checks.map(c => {
          const Icon = icons[c.name] || Activity;
          return (
            <Card key={c.name}>
              <CardContent className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.detail || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.latencyMs !== undefined && <span className="text-xs text-muted-foreground">{c.latencyMs}ms</span>}
                  <Badge variant={c.status === "ok" ? "default" : "destructive"} className={c.status === "ok" ? "bg-green-500/10 text-green-700 dark:text-green-400" : ""}>
                    {c.status === "ok" ? "Healthy" : "Error"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
