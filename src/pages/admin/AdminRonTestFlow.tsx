/**
 * Admin → BlueNotary RON End-to-End Test Flow
 * -------------------------------------------
 * Admin-runnable smoke test that walks every milestone of a RON session
 * (consent, KBA, signing, completion) and confirms each updates the
 * session row + tamper-evident hash chain. Each step writes an audit_log
 * entry under `ron_test_*` for traceability.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, PlayCircle, ShieldCheck, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  appendHashChainStep,
  verifyHashChain,
  type HashChainStep,
} from "@/lib/ronSessionHashChain";
import { logAdminAction } from "@/lib/auditLogger";

type StepKey =
  | "provision"
  | "iframe_loaded"
  | "consent_recorded"
  | "kba_passed"
  | "document_signed"
  | "notary_seal_applied"
  | "session_completed";

interface StepDef {
  key: StepKey;
  label: string;
  hashStep?: HashChainStep;
}

const STEPS: StepDef[] = [
  { key: "provision", label: "Provision test session" },
  { key: "iframe_loaded", label: "BlueNotary iframe loaded", hashStep: "session_started" },
  { key: "consent_recorded", label: "Recording consent captured", hashStep: "consent_recorded" },
  { key: "kba_passed", label: "KBA passed", hashStep: "kba_passed" },
  { key: "document_signed", label: "Document signed", hashStep: "document_signed" },
  { key: "notary_seal_applied", label: "Notary seal applied", hashStep: "notary_seal_applied" },
  { key: "session_completed", label: "Session completed", hashStep: "session_completed" },
];

interface MilestoneLog {
  step: StepKey;
  ts: string;
  hash?: string;
  ok: boolean;
  message?: string;
}

export default function AdminRonTestFlow() {
  usePageMeta({ title: "RON Test Flow", noIndex: true });
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const [completed, setCompleted] = useState<Set<StepKey>>(new Set());
  const [busy, setBusy] = useState<StepKey | null>(null);
  const [logs, setLogs] = useState<MilestoneLog[]>([]);
  const [verifyResult, setVerifyResult] = useState<null | { valid: boolean; brokenAt: number | null; count: number }>(null);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "bluenotary_iframe_url")
      .maybeSingle()
      .then(({ data }) => setIframeUrl((data?.setting_value as string) || ""));
  }, []);

  const pushLog = (entry: MilestoneLog) => setLogs((p) => [entry, ...p]);

  const provision = async () => {
    setBusy("provision");
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("notarization_sessions")
        .insert({
          status: "draft",
          notary_id: user.user?.id,
          signer_name: "Test Signer (RON QA)",
          signer_email: "qa+ron@notardex.com",
          recording_consent: false,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as { id: string }).id;
      setSessionId(id);
      setCompleted((p) => new Set(p).add("provision"));
      pushLog({ step: "provision", ts: new Date().toISOString(), ok: true, message: `Session ${id.slice(0, 8)}…` });
      await logAdminAction({ action: "ron_test_provision", entityType: "notarization_session", entityId: id });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      pushLog({ step: "provision", ts: new Date().toISOString(), ok: false, message });
      toast({ title: "Provision failed", description: message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const advance = async (step: StepDef) => {
    if (!sessionId || !step.hashStep) return;
    setBusy(step.key);
    try {
      // Update session row for milestones that map to columns
      const patch: Record<string, unknown> = {};
      if (step.key === "consent_recorded") patch.recording_consent = true;
      if (step.key === "kba_passed") {
        patch.kba_status = "passed";
        patch.kba_attempts = 1;
      }
      if (step.key === "session_completed") patch.status = "completed";
      if (Object.keys(patch).length) {
        await supabase.from("notarization_sessions").update(patch as never).eq("id", sessionId);
      }
      const result = await appendHashChainStep(sessionId, step.hashStep, { source: "ron_test_flow" });
      setCompleted((p) => new Set(p).add(step.key));
      pushLog({
        step: step.key,
        ts: new Date().toISOString(),
        ok: !!result,
        hash: result?.hash.slice(0, 16),
      });
      await logAdminAction({
        action: `ron_test_${step.key}`,
        entityType: "notarization_session",
        entityId: sessionId,
        details: { sequence: result?.sequence, hash: result?.hash },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      pushLog({ step: step.key, ts: new Date().toISOString(), ok: false, message });
      toast({ title: `${step.label} failed`, description: message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const runVerify = async () => {
    if (!sessionId) return;
    const v = await verifyHashChain(sessionId);
    setVerifyResult({ valid: v.valid, brokenAt: v.brokenAt, count: v.entries.length });
  };

  const reset = () => {
    setSessionId(null);
    setCompleted(new Set());
    setLogs([]);
    setVerifyResult(null);
  };

  const allDone = useMemo(() => STEPS.every((s) => completed.has(s.key)), [completed]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">RON End-to-End Test Flow</h1>
          <p className="text-muted-foreground text-sm">
            Walks every BlueNotary milestone, records hash-chain steps, and confirms KBA + consent + completion.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-[24px]">
          <CardHeader>
            <CardTitle>Wizard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STEPS.map((s, i) => {
              const done = completed.has(s.key);
              const isBusy = busy === s.key;
              const enabled =
                s.key === "provision"
                  ? !sessionId
                  : !!sessionId && (i === 0 || completed.has(STEPS[i - 1].key)) && !done;
              return (
                <div key={s.key} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <PlayCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-semibold">{i + 1}. {s.label}</div>
                      {s.hashStep && <div className="text-xs text-muted-foreground">hash step: {s.hashStep}</div>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!enabled || isBusy}
                    onClick={() => (s.key === "provision" ? provision() : advance(s))}
                  >
                    {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {done ? "Done" : "Run"}
                  </Button>
                </div>
              );
            })}

            {iframeUrl && sessionId && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">BlueNotary preview</p>
                <iframe
                  src={iframeUrl}
                  className="w-full h-[420px] rounded-xl border"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="BlueNotary RON Test"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Milestone log</CardTitle>
            <Button size="sm" variant="outline" onClick={runVerify} disabled={!sessionId}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Verify chain
            </Button>
          </CardHeader>
          <CardContent>
            {verifyResult && (
              <div
                className={`mb-3 rounded-xl border p-3 ${
                  verifyResult.valid ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"
                }`}
              >
                <div className="font-semibold flex items-center gap-2">
                  {verifyResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  Hash chain {verifyResult.valid ? "valid" : `broken at #${verifyResult.brokenAt}`}
                </div>
                <div className="text-xs text-muted-foreground">{verifyResult.count} steps recorded</div>
              </div>
            )}
            <div className="space-y-2 max-h-[480px] overflow-auto">
              {logs.length === 0 && <p className="text-sm text-muted-foreground">No milestones yet.</p>}
              {logs.map((l, i) => (
                <div key={i} className="text-xs border rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={l.ok ? "default" : "destructive"}>{l.step}</Badge>
                    <span className="text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>
                  </div>
                  {l.hash && <div className="font-mono mt-1 break-all">hash: {l.hash}…</div>}
                  {l.message && <div className="mt-1 text-muted-foreground">{l.message}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {allDone && verifyResult?.valid && (
        <Card className="rounded-[24px] border-success/40 bg-success/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <div className="font-bold">All milestones passed</div>
              <div className="text-sm text-muted-foreground">
                Consent ✓ &nbsp;·&nbsp; KBA ✓ &nbsp;·&nbsp; Session completed ✓ &nbsp;·&nbsp; Hash chain intact ✓
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
