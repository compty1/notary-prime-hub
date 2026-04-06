import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Copy, Download, Loader2, Sparkles, Eye, Code, Printer, RefreshCw, Save, CreditCard,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import type { AITool } from "@/lib/aiToolsRegistry";

function parseSSEChunk(chunk: string): string {
  let text = "";
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) text += delta;
    } catch { /* skip */ }
  }
  return text;
}

interface ToolRunnerProps {
  tool: AITool;
  onBack: () => void;
}

export function ToolRunner({ tool, onBack }: ToolRunnerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [lastError, setLastError] = useState(false);
  const [showRendered, setShowRendered] = useState(true);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [saving, setSaving] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Fetch usage count and plan
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count }, { data: profile }] = await Promise.all([
        supabase.from("tool_generations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("plan").eq("user_id", user.id).single(),
      ]);
      setUsageCount(count ?? 0);
      setUserPlan((profile as any)?.plan || "free");
    })();
  }, [user]);

  const freeLimit = 2;
  const isAtLimit = userPlan === "free" && (usageCount ?? 0) >= freeLimit;

  const updateField = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const doGenerate = useCallback(async (previousOutput?: string, refinePrompt?: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to use AI tools.", variant: "destructive" });
      return;
    }

    const missing = tool.fields.filter((f) => f.required && !fieldValues[f.name]?.trim());
    if (missing.length > 0) {
      toast({ title: "Missing fields", description: `Please fill in: ${missing.map((f) => f.label).join(", ")}`, variant: "destructive" });
      return;
    }

    setLoading(true);
    if (!previousOutput) setResult("");
    setLastError(false);

    try {
      const body: Record<string, unknown> = {
        tool_id: tool.id,
        fields: fieldValues,
        systemPrompt: tool.systemPrompt,
      };
      if (previousOutput && refinePrompt) {
        body.previousOutput = previousOutput;
        body.refinementPrompt = refinePrompt;
      }

      const response = await callEdgeFunctionStream("ai-tools", body, 120000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const status = response.status;

        if (status === 429) {
          const retryAfter = errData.retryAfter || response.headers.get("retry-after") || "30";
          const seconds = parseInt(retryAfter, 10) || 30;
          setRetryCountdown(seconds);
          const interval = setInterval(() => {
            setRetryCountdown((prev) => {
              if (prev <= 1) { clearInterval(interval); return 0; }
              return prev - 1;
            });
          }, 1000);
          toast({ title: "Rate limit reached", description: `Please wait ${seconds} seconds before trying again.`, variant: "destructive" });
          return;
        }

        if (status === 402) {
          toast({
            title: "Credits exhausted",
            description: "Your AI credits have been used up. Upgrade your plan to continue.",
            variant: "destructive",
          });
          return;
        }

        throw new Error(errData.error || `Error ${status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      // If refining, start fresh with new result
      if (previousOutput) setResult("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const chunk of lines) {
          const text = parseSSEChunk(chunk);
          if (text) setResult((prev) => prev + text);
        }
      }
      if (buffer.trim()) {
        const text = parseSSEChunk(buffer);
        if (text) setResult((prev) => prev + text);
      }
      setIsRefining(false);
      setRefinementPrompt("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setLastError(true);
      toast({ title: "Generation failed", description: "Something went wrong. Click Retry to try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tool, fieldValues, user, toast]);

  const handleGenerate = useCallback(() => doGenerate(), [doGenerate]);

  const handleRefine = useCallback(() => {
    if (!refinementPrompt.trim() || !result) return;
    doGenerate(result, refinementPrompt);
  }, [doGenerate, result, refinementPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.id}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${tool.title}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px;line-height:1.6}
      table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #ccc;padding:8px;text-align:left}
      th{background:#f5f5f5}h1,h2,h3{margin-top:1.5em}blockquote{border-left:4px solid #ccc;margin:1em 0;padding:0.5em 1em;background:#f9f9f9}
      code{background:#f5f5f5;padding:2px 6px;border-radius:3px}pre{background:#f5f5f5;padding:16px;border-radius:6px;overflow-x:auto}</style></head>
      <body>${resultRef.current?.innerHTML || ""}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !loading) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate, loading]);

  return (
    <div className="container mx-auto px-4 py-8" onKeyDown={handleKeyDown}>
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to All Tools
      </Button>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <tool.icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tool.title}</h1>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
          <Badge variant="secondary" className="mt-1 text-xs">{tool.category}</Badge>
        </div>
      </div>

      {/* Usage indicator for free plan */}
      {userPlan === "free" && usageCount !== null && (
        <Card className={`mb-4 ${isAtLimit ? "border-destructive/50 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className={`h-4 w-4 ${isAtLimit ? "text-destructive" : "text-primary"}`} />
              <span className="text-sm">
                {isAtLimit
                  ? "Free plan limit reached (2/2 used)"
                  : `${usageCount} of ${freeLimit} free generations used`}
              </span>
            </div>
            {isAtLimit && (
              <Link to="/subscribe">
                <Button size="sm" variant="default" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" /> Upgrade Plan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Input Details</h2>
            {tool.fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "select" && field.options ? (
                  <Select
                    value={fieldValues[field.name] || ""}
                    onValueChange={(v) => updateField(field.name, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.filter(opt => opt.value).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={fieldValues[field.name] || ""}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    rows={4}
                  />
                ) : field.type === "number" ? (
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={fieldValues[field.name] || ""}
                    onChange={(e) => updateField(field.name, e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder={field.placeholder}
                    value={fieldValues[field.name] || ""}
                    onChange={(e) => updateField(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                onClick={handleGenerate}
                disabled={loading || retryCountdown > 0}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : retryCountdown > 0 ? (
                  <>Wait {retryCountdown}s</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
                )}
              </Button>
              {lastError && !loading && (
                <Button variant="outline" onClick={handleGenerate} className="gap-1">
                  <Sparkles className="h-4 w-4" /> Retry
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">Press Ctrl+Enter to generate</p>
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Output</h2>
              {result && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={showRendered ? "default" : "outline"} onClick={() => setShowRendered(true)} className="h-7 px-2 text-xs">
                    <Eye className="mr-1 h-3 w-3" /> Preview
                  </Button>
                  <Button size="sm" variant={!showRendered ? "default" : "outline"} onClick={() => setShowRendered(false)} className="h-7 px-2 text-xs">
                    <Code className="mr-1 h-3 w-3" /> Raw
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 px-2">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 px-2">
                    <Printer className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {!result && !loading && (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <tool.icon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm">Fill in the form and click Generate</p>
                </div>
              </div>
            )}

            {loading && !result && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {result && (
              <>
                <div
                  ref={resultRef}
                  className="max-h-[50vh] overflow-y-auto rounded-lg border border-border p-4"
                >
                  {showRendered ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-td:border prose-td:border-border prose-td:p-2 prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-blockquote:border-primary/30">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-xs text-foreground font-mono">
                      {result}
                    </pre>
                  )}
                </div>

                {/* Multi-turn Refinement */}
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <Label className="text-sm font-medium text-foreground">Refine Output</Label>
                  <Textarea
                    placeholder="e.g., Make the tone more formal, add a confidentiality section, shorten the conclusion..."
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRefine}
                    disabled={loading || !refinementPrompt.trim()}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Refine
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
