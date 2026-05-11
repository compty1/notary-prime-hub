/**
 * Admin → RON Hash-Chain Verification
 * -----------------------------------
 * Lists recent notarization sessions, runs `verifyHashChain` per row,
 * shows pass/fail badge, and renders a per-session report drawer with
 * every chain entry. Bulk verify writes a single audit summary entry.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, ShieldCheck, ShieldAlert, ShieldOff, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import { verifyHashChain, type HashChainEntry } from "@/lib/ronSessionHashChain";
import { logAdminAction } from "@/lib/auditLogger";

interface SessionRow {
  id: string;
  appointment_id: string | null;
  status: string | null;
  signer_name: string | null;
  started_at: string | null;
  created_at: string;
  steps?: number;
  result?: "pass" | "fail" | "empty" | "pending";
  brokenAt?: number | null;
}

export default function AdminRonHashVerification() {
  usePageMeta({ title: "RON Hash Verification", noIndex: true });
  const { toast } = useToast();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [drawerSession, setDrawerSession] = useState<SessionRow | null>(null);
  const [drawerEntries, setDrawerEntries] = useState<HashChainEntry[]>([]);
  const [drawerResult, setDrawerResult] = useState<{ valid: boolean; brokenAt: number | null } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notarization_sessions")
      .select("id, appointment_id, status, signer_name, started_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const baseRows = ((data as SessionRow[]) || []).map((r) => ({ ...r, result: "pending" as const }));
    // Pull step counts in one query
    const ids = baseRows.map((r) => r.id);
    if (ids.length) {
      const { data: counts } = await supabase
        .from("ron_session_hash_chain" as never)
        .select("session_id")
        .in("session_id", ids);
      const counter: Record<string, number> = {};
      ((counts as { session_id: string }[]) || []).forEach((c) => {
        counter[c.session_id] = (counter[c.session_id] || 0) + 1;
      });
      baseRows.forEach((r) => (r.steps = counter[r.id] || 0));
    }
    setRows(baseRows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const verifyOne = async (row: SessionRow): Promise<SessionRow> => {
    if ((row.steps ?? 0) === 0) {
      return { ...row, result: "empty", brokenAt: null };
    }
    const v = await verifyHashChain(row.id);
    return {
      ...row,
      result: v.valid ? "pass" : "fail",
      brokenAt: v.brokenAt,
    };
  };

  const handleVerify = async (row: SessionRow) => {
    const updated = await verifyOne(row);
    setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
  };

  const handleBulk = async () => {
    setBulkBusy(true);
    const results: SessionRow[] = [];
    for (const r of filtered) {
      results.push(await verifyOne(r));
    }
    setRows((prev) => prev.map((r) => results.find((x) => x.id === r.id) || r));
    const summary = {
      total: results.length,
      pass: results.filter((r) => r.result === "pass").length,
      fail: results.filter((r) => r.result === "fail").length,
      empty: results.filter((r) => r.result === "empty").length,
    };
    await logAdminAction({
      action: "ron_hash_chain_bulk_verified",
      entityType: "notarization_session",
      details: summary,
    });
    toast({ title: "Bulk verification complete", description: `${summary.pass} pass, ${summary.fail} fail, ${summary.empty} empty.` });
    setBulkBusy(false);
  };

  const openDrawer = async (row: SessionRow) => {
    setDrawerSession(row);
    setDrawerEntries([]);
    setDrawerResult(null);
    const { data } = await supabase
      .from("ron_session_hash_chain" as never)
      .select("*")
      .eq("session_id", row.id)
      .order("sequence_no", { ascending: true });
    const entries = (data as unknown as HashChainEntry[]) || [];
    setDrawerEntries(entries);
    const v = await verifyHashChain(row.id);
    setDrawerResult({ valid: v.valid, brokenAt: v.brokenAt });
  };

  const downloadReport = () => {
    if (!drawerSession) return;
    const payload = {
      session_id: drawerSession.id,
      verified_at: new Date().toISOString(),
      result: drawerResult,
      entries: drawerEntries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ron-hash-report-${drawerSession.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !search ||
          r.id.includes(search) ||
          (r.signer_name || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const stats = useMemo(() => {
    const tally = { total: rows.length, pass: 0, fail: 0, empty: 0, pending: 0 };
    rows.forEach((r) => {
      if (r.result === "pass") tally.pass++;
      else if (r.result === "fail") tally.fail++;
      else if (r.result === "empty") tally.empty++;
      else tally.pending++;
    });
    return tally;
  }, [rows]);

  const badgeFor = (r: SessionRow) => {
    switch (r.result) {
      case "pass":
        return <Badge className="bg-success text-success-foreground">Pass</Badge>;
      case "fail":
        return <Badge variant="destructive">Fail @ #{r.brokenAt}</Badge>;
      case "empty":
        return <Badge variant="outline">No chain</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black">RON Hash-Chain Verification</h1>
        <p className="text-muted-foreground text-sm">
          Per-session tamper-evident verification for Ohio ORC §147.63 / §147.66 audits.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Verified ✓" value={stats.pass} tone="success" />
        <StatCard label="Broken ✗" value={stats.fail} tone="destructive" />
        <StatCard label="Empty" value={stats.empty} />
        <StatCard label="Pending" value={stats.pending} />
      </div>

      <Card className="rounded-[24px]">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Recent sessions</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search id or signer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={handleBulk} disabled={bulkBusy || !filtered.length}>
              {bulkBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify all visible
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2">Session</th>
                    <th className="p-2">Signer</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Started</th>
                    <th className="p-2">Steps</th>
                    <th className="p-2">Result</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                      <td className="p-2">{r.signer_name || "—"}</td>
                      <td className="p-2">{r.status || "—"}</td>
                      <td className="p-2">{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                      <td className="p-2">{r.steps ?? 0}</td>
                      <td className="p-2">{badgeFor(r)}</td>
                      <td className="p-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleVerify(r)}>
                          Verify
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openDrawer(r)}>
                          Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!drawerSession} onOpenChange={(o) => !o && setDrawerSession(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Hash-chain report</SheetTitle>
          </SheetHeader>
          {drawerSession && (
            <div className="space-y-4 mt-4">
              <div className="text-xs text-muted-foreground font-mono break-all">{drawerSession.id}</div>
              {drawerResult && (
                <div
                  className={`rounded-xl border p-3 flex items-center gap-3 ${
                    drawerResult.valid
                      ? "border-success/40 bg-success/10"
                      : drawerEntries.length === 0
                      ? "border-muted"
                      : "border-destructive/40 bg-destructive/10"
                  }`}
                >
                  {drawerResult.valid ? (
                    <ShieldCheck className="h-5 w-5 text-success" />
                  ) : drawerEntries.length === 0 ? (
                    <ShieldOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {drawerEntries.length === 0
                        ? "No chain recorded"
                        : drawerResult.valid
                        ? "Chain valid"
                        : `Broken at sequence #${drawerResult.brokenAt}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {drawerEntries.length} steps · ORC §147.66 retention 10 years
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={downloadReport}>
                    <Download className="mr-2 h-4 w-4" /> JSON
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {drawerEntries.map((e, i) => {
                  const prevHash = i === 0 ? null : drawerEntries[i - 1].step_hash;
                  const broken = e.previous_hash !== prevHash;
                  return (
                    <div
                      key={e.id}
                      className={`rounded-lg border p-3 ${broken ? "border-destructive bg-destructive/10" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">
                          #{e.sequence_no} · {e.step_name}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] mt-1 break-all">
                        prev: {e.previous_hash?.slice(0, 24) || "—"}
                      </div>
                      <div className="font-mono text-[11px] break-all">
                        hash: {e.step_hash.slice(0, 24)}…
                      </div>
                      {broken && (
                        <div className="text-xs text-destructive mt-1">
                          ⚠ previous_hash does not match prior step
                        </div>
                      )}
                    </div>
                  );
                })}
                {!drawerEntries.length && (
                  <p className="text-sm text-muted-foreground">No hash chain entries.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "destructive" }) {
  return (
    <Card className="rounded-[24px]">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-3xl font-black ${
            tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : ""
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
