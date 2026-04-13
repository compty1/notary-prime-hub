import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, Shield, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useRonAdvisor } from "@/hooks/useRonAdvisor";
import { US_STATES, DOCUMENT_CATEGORIES, NOTARIAL_ACT_TYPES } from "@/lib/ronStateData";
import type { RiskLevel } from "@/lib/ronLegalityEngine";
import { Link } from "react-router-dom";

interface Props {
  compact?: boolean;
  onResultChange?: (eligible: boolean) => void;
}

export function RonAdvisorWidget({ compact = false, onResultChange }: Props) {
  const { result, explanation, loadingExplanation, analyzeQuick, getExplanation, reset } = useRonAdvisor();

  const [docUseState, setDocUseState] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [docSubtype, setDocSubtype] = useState("");
  const [notarialAct, setNotarialAct] = useState("");

  const subtypes = useMemo(() => {
    return DOCUMENT_CATEGORIES.find(c => c.value === docCategory)?.subtypes || [];
  }, [docCategory]);

  const canCheck = docUseState && docCategory && docSubtype && notarialAct;

  const handleCheck = () => {
    if (!canCheck) return;
    const input = {
      signer_state: docUseState,
      document_use_state: docUseState,
      document_category: docCategory,
      document_subtype: docSubtype,
      notarial_act_type: notarialAct,
    };
    const r = analyzeQuick(input);
    onResultChange?.(r.status !== "not_eligible");
    getExplanation(input, r);
  };

  const handleReset = () => {
    setDocUseState("");
    setDocCategory("");
    setDocSubtype("");
    setNotarialAct("");
    reset();
    onResultChange?.(true);
  };

  const iconMap: Record<RiskLevel, typeof CheckCircle> = { low: CheckCircle, medium: AlertTriangle, high: XCircle };
  const colorMap: Record<RiskLevel, string> = { low: "text-primary", medium: "text-amber-600", high: "text-red-600" };
  const labelMap: Record<RiskLevel, string> = { low: "Eligible", medium: "Verify First", high: "Challenges Expected" };

  if (result) {
    const Icon = iconMap[result.risk_level];
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colorMap[result.risk_level]}`} />
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="mb-1 text-xs">{labelMap[result.risk_level]}</Badge>
              <p className="text-sm font-medium text-foreground">{result.headline}</p>
              {loadingExplanation ? (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating explanation...
                </p>
              ) : explanation ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{explanation}</p>
              ) : null}
              <div className="flex gap-2 mt-2">
                <Link to="/ron-check">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">Full details</Button>
                </Link>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleReset}>Check another</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className={compact ? "p-3 space-y-2" : "p-4 space-y-3"}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Can this be done online?</span>
        </div>

        <Select value={docUseState} onValueChange={setDocUseState}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Document use state" /></SelectTrigger>
          <SelectContent>{US_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Select value={docCategory} onValueChange={(v) => { setDocCategory(v); setDocSubtype(""); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{DOCUMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={docSubtype} onValueChange={setDocSubtype} disabled={!docCategory}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Document" /></SelectTrigger>
            <SelectContent>{subtypes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <Select value={notarialAct} onValueChange={setNotarialAct}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Notarial act" /></SelectTrigger>
          <SelectContent>{NOTARIAL_ACT_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
        </Select>

        <Button onClick={handleCheck} disabled={!canCheck} size="sm" className="w-full">
          <Shield className="mr-1 h-3 w-3" /> Check
        </Button>
      </CardContent>
    </Card>
  );
}
