import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ShieldCheck, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

interface Finding {
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
  location?: string;
  source_quote?: string;
  suggested_fix: string;
}

interface ScanResult {
  overall_status: "compliant" | "issues_found" | "non_compliant";
  score: number;
  findings: Finding[];
  summary: string;
}

interface ComplianceWatchdogProps {
  documentText: string;
  className?: string;
}

const RULE_SETS = [
  { value: "ohio_orc_147", label: "Ohio ORC §147 (Notary)" },
  { value: "gdpr", label: "GDPR Privacy" },
  { value: "general_legal", label: "General Legal" },
  { value: "brand_guidelines", label: "Brand Guidelines" },
];

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", badge: "secondary" as const },
  info: { icon: Info, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", badge: "outline" as const },
};

export function ComplianceWatchdog({ documentText, className }: ComplianceWatchdogProps) {
  const [ruleSet, setRuleSet] = useState("ohio_orc_147");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const runScan = async () => {
    if (!documentText || documentText.trim().length < 20) {
      setError("Document text is too short to scan.");
      return;
    }
    setScanning(true);
    setError("");
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-compliance-scan", {
        body: { document_text: documentText, rule_set: ruleSet },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResult(data.scan);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || "Scan failed");
    }
    setScanning(false);
  };

  const statusColor = result?.overall_status === "compliant"
    ? "text-primary"
    : result?.overall_status === "non_compliant"
    ? "text-destructive"
    : "text-yellow-600 dark:text-yellow-400";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Compliance Watchdog
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={ruleSet} onValueChange={setRuleSet}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_SETS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runScan} disabled={scanning} size="sm">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3">
            {/* Score overview */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className={`text-2xl font-bold ${statusColor}`}>{result.score}/100</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {result.overall_status.replace("_", " ")}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{result.findings.filter(f => f.severity === "critical").length} critical</p>
                <p>{result.findings.filter(f => f.severity === "warning").length} warnings</p>
                <p>{result.findings.filter(f => f.severity === "info").length} info</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{result.summary}</p>

            {/* Findings */}
            {result.findings.length > 0 && (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {result.findings.map((finding, i) => {
                    const config = severityConfig[finding.severity];
                    const Icon = config.icon;
                    const expanded = expandedIndex === i;
                    return (
                      <div key={i} className={`rounded-lg border p-3 ${config.bg}`}>
                        <button
                          className="flex w-full items-start gap-2 text-left"
                          onClick={() => setExpandedIndex(expanded ? null : i)}
                        >
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={config.badge} className="text-[10px]">
                                {finding.severity}
                              </Badge>
                              <span className="text-xs font-medium truncate">{finding.rule}</span>
                            </div>
                            <p className="mt-1 text-sm text-foreground">{finding.description}</p>
                          </div>
                          {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                        </button>
                        {expanded && (
                          <div className="mt-2 ml-6 space-y-2 text-sm">
                            {finding.location && (
                              <p className="text-muted-foreground"><strong>Location:</strong> {finding.location}</p>
                            )}
                            {finding.source_quote && (
                              <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic">
                                "{finding.source_quote}"
                              </blockquote>
                            )}
                            <div className="rounded bg-primary/5 p-2">
                              <p className="font-medium text-primary text-xs">Suggested Fix:</p>
                              <p className="text-foreground">{finding.suggested_fix}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
