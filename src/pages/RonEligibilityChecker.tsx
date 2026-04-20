import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Shield, ChevronRight, ArrowRight, Globe, FileText, Briefcase, Scale, Sparkles, Loader2, RotateCcw, BookOpen } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useRonAdvisor } from "@/hooks/useRonAdvisor";
import { US_STATES, DOCUMENT_CATEGORIES, NOTARIAL_ACT_TYPES, RECIPIENT_TYPES } from "@/lib/ronStateData";
import type { AdvisorInput, SimpleInput, RiskLevel } from "@/lib/ronLegalityEngine";

interface Props {
  mode?: "public" | "dashboard";
}

export default function RonEligibilityChecker({ mode = "public" }: Props) {
  usePageMeta({
    title: "RON Legality & Acceptance Advisor",
    description: "Check if your document is eligible for Remote Online Notarization. Get instant legal analysis with Ohio RON law citations."
  });

  const { result, explanation, loadingExplanation, analyzeQuick, analyze, getExplanation, reset } = useRonAdvisor();

  // Form state
  const [signerState, setSignerState] = useState("");
  const [docUseState, setDocUseState] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [docSubtype, setDocSubtype] = useState("");
  const [notarialAct, setNotarialAct] = useState("");

  // Dashboard-only fields
  const [recipientType, setRecipientType] = useState("");
  const [signerCountry, setSignerCountry] = useState<"us" | "non_us">("us");
  const [isRecordable, setIsRecordable] = useState(false);
  const [requiresApostille, setRequiresApostille] = useState(false);
  const [extraNotes, setExtraNotes] = useState("");

  const isDashboard = mode === "dashboard";

  const subtypes = useMemo(() => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.value === docCategory);
    return cat?.subtypes || [];
  }, [docCategory]);

  const canCheck = isDashboard
    ? signerState && docUseState && docCategory && docSubtype && notarialAct && recipientType
    : signerState && docUseState && docCategory && docSubtype && notarialAct;

  const handleCheck = () => {
    if (!canCheck) return;

    if (isDashboard) {
      const input: AdvisorInput = {
        notary_state: "Ohio",
        signer_state: signerState,
        document_use_state: docUseState,
        document_category: docCategory,
        document_subtype: docSubtype,
        notarial_act_type: notarialAct,
        signer_location_country: signerCountry,
        is_recordable_in_land_records: isRecordable,
        requires_apostille: requiresApostille,
        intended_recipient_type: recipientType,
        extra_notes: extraNotes || undefined,
      };
      const r = analyze(input);
      getExplanation(input, r);
    } else {
      const input: SimpleInput = {
        signer_state: signerState,
        document_use_state: docUseState,
        document_category: docCategory,
        document_subtype: docSubtype,
        notarial_act_type: notarialAct,
      };
      const r = analyzeQuick(input);
      getExplanation(input, r);
    }
  };

  const handleReset = () => {
    setSignerState("");
    setDocUseState("");
    setDocCategory("");
    setDocSubtype("");
    setNotarialAct("");
    setRecipientType("");
    setSignerCountry("us");
    setIsRecordable(false);
    setRequiresApostille(false);
    setExtraNotes("");
    reset();
  };

  const levelConfig: Record<RiskLevel, { icon: typeof CheckCircle; color: string; bg: string; badge: string; badgeLabel: string }> = {
    low: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/5 border-primary/20", badge: "bg-primary/10 text-primary", badgeLabel: "Widely Accepted" },
    medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10 border-warning/30", badge: "bg-warning/10 text-warning", badgeLabel: "Verify First" },
    high: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", badge: "bg-destructive/10 text-destructive", badgeLabel: "Challenges Expected" },
  };

  return (
    <PageShell>
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <Breadcrumbs />
          <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
            <Scale className="mr-1 h-3 w-3" /> RON Legality Advisor
          </Badge>
          <h1 className="mb-3 font-sans text-3xl font-bold text-foreground md:text-4xl">
            Will Remote Notarization Work for You?
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {isDashboard
              ? "Full legal analysis with 10-field assessment, statutory citations, and AI-powered explanations for your clients."
              : "Answer a few questions to find out if your document can be notarized remotely. Based on Ohio RON law (ORC §147.60-.66) and 50-state acceptance data."
            }
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  {/* Signer State */}
                  <div>
                    <Label className="text-base font-semibold">1. Where is the signer located?</Label>
                    <p className="text-sm text-muted-foreground mb-2">The state where the person signing is physically present.</p>
                    <Select value={signerState} onValueChange={setSignerState}>
                      <SelectTrigger><SelectValue placeholder="Select signer's state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Document Use State */}
                  <div>
                    <Label className="text-base font-semibold">2. Where will this document be used?</Label>
                    <p className="text-sm text-muted-foreground mb-2">The state where the document will be filed, recorded, or presented.</p>
                    <Select value={docUseState} onValueChange={setDocUseState}>
                      <SelectTrigger><SelectValue placeholder="Select document use state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Document Category → Subtype (cascading) */}
                  <div>
                    <Label className="text-base font-semibold">3. What type of document?</Label>
                    <div className="grid gap-2 mt-2 sm:grid-cols-2">
                      <Select value={docCategory} onValueChange={(v) => { setDocCategory(v); setDocSubtype(""); }}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={docSubtype} onValueChange={setDocSubtype} disabled={!docCategory}>
                        <SelectTrigger><SelectValue placeholder="Specific document" /></SelectTrigger>
                        <SelectContent>
                          {subtypes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notarial Act */}
                  <div>
                    <Label className="text-base font-semibold">{isDashboard ? "4" : "4"}. What notarial act is needed?</Label>
                    <Select value={notarialAct} onValueChange={setNotarialAct}>
                      <SelectTrigger><SelectValue placeholder="Select notarial act" /></SelectTrigger>
                      <SelectContent>
                        {NOTARIAL_ACT_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dashboard-only fields */}
                  {isDashboard && (
                    <>
                      <div>
                        <Label className="text-base font-semibold">5. Who is the receiving entity?</Label>
                        <Select value={recipientType} onValueChange={setRecipientType}>
                          <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                          <SelectContent>
                            {RECIPIENT_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base font-semibold">6. Signer location</Label>
                        <Select value={signerCountry} onValueChange={(v) => setSignerCountry(v as "us" | "non_us")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="non_us">Outside the United States</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <div>
                          <Label className="font-semibold">Recordable in land records?</Label>
                          <p className="text-xs text-muted-foreground">Will this be filed at a county recorder's office?</p>
                        </div>
                        <Switch checked={isRecordable} onCheckedChange={setIsRecordable} />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <div>
                          <Label className="font-semibold">Requires Apostille?</Label>
                          <p className="text-xs text-muted-foreground">For international use requiring legalization</p>
                        </div>
                        <Switch checked={requiresApostille} onCheckedChange={setRequiresApostille} />
                      </div>

                      <div>
                        <Label className="text-base font-semibold">Additional notes (optional)</Label>
                        <Textarea
                          value={extraNotes}
                          onChange={(e) => setExtraNotes(e.target.value)}
                          placeholder="Any special circumstances..."
                          className="mt-1"
                          maxLength={500}
                        />
                      </div>
                    </>
                  )}

                  <Button onClick={handleCheck} disabled={!canCheck} className="w-full" size="lg">
                    <Shield className="mr-2 h-4 w-4" /> Analyze Eligibility
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Main Result Card */}
              {(() => {
                const cfg = levelConfig[result.risk_level];
                const Icon = cfg.icon;
                return (
                  <Card className={`border ${cfg.bg}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Icon className={`h-8 w-8 flex-shrink-0 mt-1 ${cfg.color}`} />
                        <div className="flex-1">
                          <Badge className={`mb-2 ${cfg.badge}`}>{cfg.badgeLabel}</Badge>
                          <h2 className="font-sans text-xl font-bold mb-2 text-foreground">{result.headline}</h2>

                          {/* Ohio Analysis */}
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-1">
                              <BookOpen className="h-3.5 w-3.5" /> Ohio RON Analysis
                            </h3>
                            <ul className="space-y-1">
                              {result.notary_state_analysis.notes.map((n, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                                  <span>{n}</span>
                                </li>
                              ))}
                            </ul>
                            {result.notary_state_analysis.statutory_citation && (
                              <p className="text-xs text-muted-foreground mt-1 italic">Citation: {result.notary_state_analysis.statutory_citation}</p>
                            )}
                          </div>

                          {/* Receiving State Analysis */}
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-1">
                              <Globe className="h-3.5 w-3.5" /> {result.receiving_state_analysis.state_name} Acceptance
                            </h3>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                RON {result.receiving_state_analysis.ron_authorized ? "Authorized" : "Not Authorized"}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {result.receiving_state_analysis.acceptance_rating} acceptance
                              </Badge>
                            </div>
                            <ul className="space-y-1">
                              {result.receiving_state_analysis.notes.map((n, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                  <span>{n}</span>
                                </li>
                              ))}
                            </ul>
                            {result.receiving_state_analysis.statutory_citation && (
                              <p className="text-xs text-muted-foreground mt-1 italic">Citation: {result.receiving_state_analysis.statutory_citation}</p>
                            )}
                          </div>

                          {/* Risk Factors */}
                          {result.risk_reasons.length > 0 && result.risk_reasons[0] !== "No significant risk factors identified" && (
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-foreground mb-1">Risk Factors</h3>
                              <ul className="space-y-1">
                                {result.risk_reasons.map((r, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-warning" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommended Actions */}
                          <div className="rounded-lg bg-background/80 p-3 border border-border/50">
                            <p className="text-sm font-semibold mb-1">Recommended Next Steps:</p>
                            <ul className="space-y-1">
                              {result.recommended_actions.map((a, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* AI Explanation */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI-Powered Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingExplanation ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating plain-language explanation...
                    </div>
                  ) : explanation ? (
                    <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{explanation}</div>
                  ) : (
                    <p className="text-sm text-muted-foreground">AI explanation was not available. The analysis above is based on current Ohio RON law and is still fully accurate.</p>
                  )}
                </CardContent>
              </Card>

              {/* Citations */}
              {result.citations.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" /> Legal Citations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.citations.map((c, i) => (
                        <li key={i} className="text-xs text-muted-foreground font-mono">{c}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/book" className="flex-1">
                  <Button className="w-full" size="lg">
                    {result.status === "not_eligible" ? "Book In-Person Appointment" : "Book RON Session"} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleReset} size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" /> Check Another
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center">{result.disclaimer}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cross-sell cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5 text-center">
              <Globe className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold mb-1">Learn About RON</h3>
              <p className="text-xs text-muted-foreground mb-3">Full comparison, state acceptance, and FAQ</p>
              <Link to="/ron-info"><Button variant="outline" size="sm" className="w-full">RON Info <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold mb-1">Document Templates</h3>
              <p className="text-xs text-muted-foreground mb-3">Free templates for common documents</p>
              <Link to="/templates"><Button variant="outline" size="sm" className="w-full">View Templates <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5 text-center">
              <Briefcase className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold mb-1">All Services</h3>
              <p className="text-xs text-muted-foreground mb-3">View our full catalog of notary & document services</p>
              <Link to="/services"><Button variant="outline" size="sm" className="w-full">View Services <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
