import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Palette, Type, Users, TrendingUp, AlertTriangle, Eye } from "lucide-react";

const STORAGE_KEY = "build-tracker-brand-analysis";

type BrandScore = {
  professionalism: number;
  trustworthiness: number;
  modernity: number;
  approachability: number;
  uniqueness: number;
};

type SalesMetrics = {
  ctaVisibility: number;
  visualHierarchy: number;
  scarcityCues: number;
  socialProof: number;
  urgencySignals: number;
};

type BrandAnalysis = {
  colorPsychology: string;
  typographyAnalysis: string;
  audienceImpact: string;
  brandScores: BrandScore;
  salesMetrics: SalesMetrics;
  brandGaps: string[];
  recommendations: string[];
  timestamp: string;
};

const BRAND_PROMPT = `Analyze the NotaryDex platform's brand identity. The platform is a professional Ohio-based remote online notarization service.

Current brand uses:
- Primary: Navy/deep blue (#1a365d-ish) for trust and authority
- Accent: Gold/amber for premium positioning
- Typography: Plus Jakarta Sans with clean sans-serif
- Target audience: Legal professionals, real estate agents, hospitals, individuals needing notarization

Provide a JSON response with this EXACT structure (no markdown, just raw JSON):
{
  "colorPsychology": "analysis of the color choices and their psychological impact",
  "typographyAnalysis": "analysis of typography choices",
  "audienceImpact": "how the brand resonates with target audiences",
  "brandScores": {
    "professionalism": 0-100,
    "trustworthiness": 0-100,
    "modernity": 0-100,
    "approachability": 0-100,
    "uniqueness": 0-100
  },
  "salesMetrics": {
    "ctaVisibility": 0-100,
    "visualHierarchy": 0-100,
    "scarcityCues": 0-100,
    "socialProof": 0-100,
    "urgencySignals": 0-100
  },
  "brandGaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"]
}`;

function ScoreBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 80 ? "text-green-500" : value >= 60 ? "text-yellow-500" : "text-orange-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">{icon}{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

/** Live color swatch read from CSS custom properties */
function BrandColorPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<{ name: string; value: string; hsl: string }[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const tokens = [
      { name: "Primary", var: "--primary" },
      { name: "Primary FG", var: "--primary-foreground" },
      { name: "Secondary", var: "--secondary" },
      { name: "Accent", var: "--accent" },
      { name: "Background", var: "--background" },
      { name: "Foreground", var: "--foreground" },
      { name: "Muted", var: "--muted" },
      { name: "Destructive", var: "--destructive" },
      { name: "Card", var: "--card" },
      { name: "Border", var: "--border" },
    ];
    const result = tokens.map((t) => {
      const raw = style.getPropertyValue(t.var).trim();
      return { name: t.name, value: `hsl(${raw})`, hsl: raw };
    });
    setColors(result);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Live Brand Colors</CardTitle>
      </CardHeader>
      <CardContent ref={ref}>
        <div className="grid grid-cols-5 gap-3">
          {colors.map((c) => (
            <div key={c.name} className="text-center space-y-1.5">
              <div
                className="h-12 w-full rounded-lg border shadow-sm"
                style={{ backgroundColor: c.value }}
              />
              <p className="text-xs font-medium">{c.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{c.hsl || "—"}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">Typography Preview</p>
          <p className="font-sans text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            NotaryDex — Ohio Notary Services
          </p>
          <p className="text-sm text-muted-foreground">
            Professional remote online notarization, document services, and e-seal verification for Ohio residents and businesses.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm">Primary CTA</Button>
            <Button size="sm" variant="outline">Secondary CTA</Button>
            <Button size="sm" variant="accent">Accent CTA</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrandAnalysisTab() {
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-analyst`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: BRAND_PROMPT }],
          context: "Brand analysis mode — return only valid JSON, no markdown wrapping.",
        }),
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);

      const contentType = resp.headers.get("content-type") || "";
      let fullContent = "";

      // Handle both streaming SSE and plain JSON responses
      if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
        if (!resp.body) throw new Error("No response body");
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* partial chunk */ }
          }
        }
        // Process any remaining buffer
        if (textBuffer.trim()) {
          const remaining = textBuffer.trim();
          if (remaining.startsWith("data: ") && remaining.slice(6).trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(remaining.slice(6).trim());
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* partial */ }
          }
        }
      } else {
        // Plain JSON response
        const json = await resp.json();
        fullContent = json.choices?.[0]?.message?.content || json.content || JSON.stringify(json);
      }

      if (!fullContent.trim()) throw new Error("Empty response from AI");

      // Extract JSON from response (might be wrapped in markdown code blocks)
      let jsonContent = fullContent;
      const jsonMatch = fullContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1];
      const rawJsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (rawJsonMatch) jsonContent = rawJsonMatch[0];

      const parsed = JSON.parse(jsonContent);

      // Validate required fields exist with defaults
      const result: BrandAnalysis = {
        colorPsychology: parsed.colorPsychology || "Analysis unavailable",
        typographyAnalysis: parsed.typographyAnalysis || "Analysis unavailable",
        audienceImpact: parsed.audienceImpact || "Analysis unavailable",
        brandScores: {
          professionalism: parsed.brandScores?.professionalism ?? 70,
          trustworthiness: parsed.brandScores?.trustworthiness ?? 70,
          modernity: parsed.brandScores?.modernity ?? 60,
          approachability: parsed.brandScores?.approachability ?? 65,
          uniqueness: parsed.brandScores?.uniqueness ?? 55,
        },
        salesMetrics: {
          ctaVisibility: parsed.salesMetrics?.ctaVisibility ?? 60,
          visualHierarchy: parsed.salesMetrics?.visualHierarchy ?? 65,
          scarcityCues: parsed.salesMetrics?.scarcityCues ?? 40,
          socialProof: parsed.salesMetrics?.socialProof ?? 50,
          urgencySignals: parsed.salesMetrics?.urgencySignals ?? 45,
        },
        brandGaps: Array.isArray(parsed.brandGaps) ? parsed.brandGaps : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        timestamp: new Date().toISOString(),
      };

      setAnalysis(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      toast.success("Brand analysis complete");
    } catch (e: any) {
      console.error("Brand analysis error:", e);
      toast.error(e.message || "Failed to analyze brand");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Brand & Sales Psychology Analysis</h3>
          <p className="text-sm text-muted-foreground">AI-powered analysis of color psychology, typography, audience impact, and sales conversion signals</p>
        </div>
        <Button onClick={runAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {analysis ? "Re-analyze" : "Analyze Brand"}
        </Button>
      </div>

      {/* Always show live brand preview */}
      <BrandColorPreview />

      {!analysis && !isAnalyzing && (
        <Card>
          <CardContent className="p-12 text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No AI Brand Analysis Yet</p>
            <p className="text-sm text-muted-foreground mb-4">Run an AI-powered analysis to evaluate your brand's color psychology, typography, audience impact, and sales conversion signals.</p>
            <Button onClick={runAnalysis} disabled={isAnalyzing}>
              <Sparkles className="h-4 w-4 mr-1" /> Analyze Brand
            </Button>
          </CardContent>
        </Card>
      )}

      {isAnalyzing && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="font-medium">Analyzing brand identity...</p>
            <p className="text-sm text-muted-foreground mt-1">Evaluating color psychology, typography, audience impact, and conversion signals</p>
          </CardContent>
        </Card>
      )}

      {analysis && !isAnalyzing && (
        <>
          <div className="text-xs text-muted-foreground">
            Last analyzed: {new Date(analysis.timestamp).toLocaleString()}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Brand Identity Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar label="Professionalism" value={analysis.brandScores.professionalism} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">P</Badge>} />
                <ScoreBar label="Trustworthiness" value={analysis.brandScores.trustworthiness} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">T</Badge>} />
                <ScoreBar label="Modernity" value={analysis.brandScores.modernity} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">M</Badge>} />
                <ScoreBar label="Approachability" value={analysis.brandScores.approachability} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">A</Badge>} />
                <ScoreBar label="Uniqueness" value={analysis.brandScores.uniqueness} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">U</Badge>} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Sales Psychology Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar label="CTA Visibility" value={analysis.salesMetrics.ctaVisibility} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">C</Badge>} />
                <ScoreBar label="Visual Hierarchy" value={analysis.salesMetrics.visualHierarchy} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">V</Badge>} />
                <ScoreBar label="Scarcity Cues" value={analysis.salesMetrics.scarcityCues} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">S</Badge>} />
                <ScoreBar label="Social Proof" value={analysis.salesMetrics.socialProof} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">P</Badge>} />
                <ScoreBar label="Urgency Signals" value={analysis.salesMetrics.urgencySignals} icon={<Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">U</Badge>} />
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Color Psychology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.colorPsychology}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Type className="h-4 w-4" /> Typography</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.typographyAnalysis}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Audience Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.audienceImpact}</p>
              </CardContent>
            </Card>
          </div>

          {analysis.brandGaps.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Brand Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.brandGaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{gap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
