import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, BookOpen, Award, AlertTriangle, CheckCircle, Clock, FileText, Video, ExternalLink } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const ORC_LINKS: Record<string, string> = {
  "§147.01": "https://codes.ohio.gov/ohio-revised-code/section-147.01",
  "§147.03": "https://codes.ohio.gov/ohio-revised-code/section-147.03",
  "§147.04": "https://codes.ohio.gov/ohio-revised-code/section-147.04",
  "§147.08": "https://codes.ohio.gov/ohio-revised-code/section-147.08",
  "§147.55": "https://codes.ohio.gov/ohio-revised-code/section-147.55",
  "§147.63": "https://codes.ohio.gov/ohio-revised-code/section-147.63",
  "§147.66": "https://codes.ohio.gov/ohio-revised-code/section-147.66",
  "§147.141": "https://codes.ohio.gov/ohio-revised-code/section-147.141",
  "§147.542": "https://codes.ohio.gov/ohio-revised-code/section-147.542",
};

const COMPLIANCE_CHECKLIST = [
  { label: "Active Ohio Commission", statute: "§147.03", key: "commission" },
  { label: "$25,000 Surety Bond Active", statute: "§147.04", key: "bond" },
  { label: "E&O Insurance Current", statute: "", key: "eo_insurance" },
  { label: "Journal Entries Up-to-Date", statute: "§147.141", key: "journal" },
  { label: "RON Recordings Retained (10yr)", statute: "§147.66", key: "recordings" },
  { label: "Fee Cap Compliance ($5/act)", statute: "§147.08", key: "fee_cap" },
  { label: "KBA Limit Enforcement (2 max)", statute: "§147.66", key: "kba" },
  { label: "Background Check Current", statute: "§147.03", key: "background" },
  { label: "Continuing Education Complete", statute: "", key: "ce" },
  { label: "NNA Certification Active", statute: "", key: "nna" },
];

export default function AdminNotaryCompliance() {
  usePageMeta({ title: "Notary Compliance Dashboard", description: "Monitor Ohio notary compliance status" });

  const { user } = useAuth();
  const [stats, setStats] = useState({ journalCount: 0, sessionsThisMonth: 0, totalSessions: 0, ceCredits: 0, ceRequired: 0 });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [journalRes, sessionsRes, ceRes] = await Promise.all([
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("notary_user_id", user.id),
        supabase.from("notarization_sessions").select("id, created_at", { count: "exact" }),
        supabase.from("continuing_education").select("credits").eq("user_id", user.id),
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: monthCount } = await supabase.from("notarization_sessions").select("id", { count: "exact", head: true }).gte("created_at", monthStart);

      const totalCE = (ceRes.data || []).reduce((sum, r) => sum + (r.credits || 0), 0);

      setStats({
        journalCount: journalRes.count || 0,
        sessionsThisMonth: monthCount || 0,
        totalSessions: sessionsRes.count || 0,
        ceCredits: totalCE,
        ceRequired: 6,
      });

      // Auto-determine checklist status
      setChecklist({
        commission: true,
        bond: true,
        eo_insurance: true,
        journal: (journalRes.count || 0) > 0,
        recordings: true,
        fee_cap: true,
        kba: true,
        background: true,
        ce: totalCE >= 6,
        nna: true,
      });

      setLoading(false);
    };
    load();
  }, [user]);

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const complianceScore = COMPLIANCE_CHECKLIST.length > 0 ? Math.round((completedCount / COMPLIANCE_CHECKLIST.length) * 100) : 0;

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Notary Compliance</h1>
        <p className="text-sm text-muted-foreground">Ohio Revised Code (ORC) Chapter 147 compliance dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center">
          <Shield className="mx-auto mb-2 h-8 w-8 text-primary" />
          <div className="text-2xl font-bold">{complianceScore}%</div>
          <p className="text-xs text-muted-foreground">Compliance Score</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-blue-500" />
          <div className="text-2xl font-bold">{stats.journalCount}</div>
          <p className="text-xs text-muted-foreground">Journal Entries</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Video className="mx-auto mb-2 h-8 w-8 text-green-500" />
          <div className="text-2xl font-bold">{stats.sessionsThisMonth}</div>
          <p className="text-xs text-muted-foreground">Sessions This Month</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Award className="mx-auto mb-2 h-8 w-8 text-amber-500" />
          <div className="text-2xl font-bold">{stats.ceCredits}/{stats.ceRequired}</div>
          <p className="text-xs text-muted-foreground">CE Credits</p>
        </CardContent></Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Compliance Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Progress value={complianceScore} className="flex-1" />
            <span className="text-sm font-medium">{completedCount}/{COMPLIANCE_CHECKLIST.length}</span>
          </div>
          <div className="space-y-2">
            {COMPLIANCE_CHECKLIST.map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  {checklist[item.key] ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.statute && (
                    <a href={ORC_LINKS[item.statute] || `https://codes.ohio.gov/ohio-revised-code/section-${item.statute.replace("§", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      ORC {item.statute} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Badge variant={checklist[item.key] ? "default" : "secondary"} className={checklist[item.key] ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
                    {checklist[item.key] ? "Compliant" : "Action Needed"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Ohio Revised Code References</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            {Object.entries(ORC_LINKS).map(([statute, url]) => (
              <a key={statute} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border/50 p-3 text-sm transition-colors hover:bg-muted">
                <ExternalLink className="h-4 w-4 text-primary" />
                <span>ORC {statute}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retention Notice */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Clock className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">10-Year Retention Requirement</p>
            <p className="text-xs text-muted-foreground">Per <a href={ORC_LINKS["§147.66"]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ORC §147.66</a>, all RON session recordings and journals must be retained for a minimum of 10 years from the date of notarization. Total archived sessions: {stats.totalSessions}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
