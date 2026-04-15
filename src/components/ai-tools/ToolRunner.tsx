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
  Upload, FileText, CheckCircle, ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate } from "react-router-dom";
import type { AITool } from "@/lib/aiToolsRegistry";
import { safeSetItem } from "@/lib/safeStorage";
import { validateFile, ALLOWED_DOCUMENT_MIMES } from "@/lib/fileValidation";

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
  const navigate = useNavigate();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
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
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setUserPlan(String(((profile as Record<string, unknown>))?.plan || "free"));
    })();
  }, [user]);

  const freeLimit = 2;
  const isAtLimit = userPlan === "free" && (usageCount ?? 0) >= freeLimit;

  const updateField = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const err = validateFile(file, { allowedMimes: ALLOWED_DOCUMENT_MIMES });
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    try {
      // Read file as text for simple text files, or use AI extraction
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        updateField("resumeText", text);
        setUploadSuccess(true);
        toast({ title: "Resume loaded", description: "Text extracted from file." });
      } else {
        // For PDF/DOCX - read as text and send to AI extractor
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        // Convert to base64 for text extraction attempt, or read raw text
        let docText = "";
        try {
          docText = new TextDecoder("utf-8", { fatal: false }).decode(uint8);
          // If it looks like binary (PDF), extract via edge function
          if (docText.includes("%PDF") || !docText.match(/[a-zA-Z]{10,}/)) {
            // Use ai-extract-document edge function
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            if (!token) throw new Error("Not authenticated");

            const resp = await fetch(
              `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ai-extract-document`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  document_text: docText.slice(0, 50000),
                  extractor_type: "hr",
                }),
              }
            );

            if (resp.ok) {
              const data = await resp.json();
              const extraction = data.extraction;
              // Format extracted data into readable text
              const parts: string[] = [];
              if (extraction?.summary) parts.push(extraction.summary);
              if (extraction?.results) {
                const r = extraction.results;
                if (r.candidate_name) parts.push(`Name: ${r.candidate_name}`);
                if (r.email) parts.push(`Email: ${r.email}`);
                if (r.phone) parts.push(`Phone: ${r.phone}`);
                if (r.skills?.length) parts.push(`\nSkills: ${r.skills.map((s: any) => typeof s === "string" ? s : s.name || s.skill).join(", ")}`);
                if (r.experience?.length) {
                  parts.push("\nExperience:");
                  r.experience.forEach((exp: any) => {
                    parts.push(`- ${exp.title || ""} at ${exp.company || ""} (${exp.dates || ""})`);
                    if (exp.key_achievements?.length) exp.key_achievements.forEach((a: string) => parts.push(`  • ${a}`));
                  });
                }
                if (r.education?.length) {
                  parts.push("\nEducation:");
                  r.education.forEach((ed: any) => parts.push(`- ${ed.degree || ""}, ${ed.institution || ""} (${ed.year || ""})`));
                }
                if (r.certifications?.length) parts.push(`\nCertifications: ${r.certifications.join(", ")}`);
              }
              docText = parts.join("\n") || docText.slice(0, 10000);
            } else {
              // Fallback: use raw text
              docText = docText.replace(/[^\x20-\x7E\n\r\t]/g, " ").slice(0, 10000);
            }
          }
        } catch {
          docText = docText.replace(/[^\x20-\x7E\n\r\t]/g, " ").slice(0, 10000);
        }
        updateField("resumeText", docText);
        setUploadSuccess(true);
        toast({ title: "Resume loaded", description: "Content extracted and ready for analysis." });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Could not process file.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [user, toast, updateField]);

  const handleOpenInDocuDex = useCallback(() => {
    if (!result) return;
    safeSetItem("ai_tools_content", result, sessionStorage);
    navigate("/docudex");
  }, [result, navigate]);

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
      let fullResult = "";

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
          if (text) {
            fullResult += text;
            setResult((prev) => prev + text);
          }
        }
      }
      if (buffer.trim()) {
        const text = parseSSEChunk(buffer);
        if (text) {
          fullResult += text;
          setResult((prev) => prev + text);
        }
      }
      setIsRefining(false);
      setRefinementPrompt("");

      // Update the streaming placeholder with the final result
      if (user && fullResult) {
        try {
          const { data: recent } = await supabase
            .from("tool_generations")
            .select("id")
            .eq("user_id", user.id)
            .eq("tool_id", tool.id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (recent?.[0]) {
            await supabase.from("tool_generations")
              .update({ result: fullResult } as never)
              .eq("id", recent[0].id);
          }
          setUsageCount((prev) => (prev ?? 0) + 1);
        } catch (e) { console.error("Auto-save generation error:", e); }
      }
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

  const [downloadFormat, setDownloadFormat] = useState<"md" | "txt" | "html">("md");

  const handleDownload = () => {
    let content = result;
    let mimeType = "text/markdown";
    let ext = "md";

    if (downloadFormat === "txt") {
      // Strip markdown formatting for plain text
      content = result.replace(/[#*_~`>]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      mimeType = "text/plain";
      ext = "txt";
    } else if (downloadFormat === "html") {
      // Basic markdown-to-HTML conversion
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tool.title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px;line-height:1.6}
table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #ccc;padding:8px;text-align:left}
th{background:#f5f5f5}h1,h2,h3{margin-top:1.5em}blockquote{border-left:4px solid #ccc;margin:1em 0;padding:0.5em 1em;background:#f9f9f9}
code{background:#f5f5f5;padding:2px 6px;border-radius:3px}</style></head>
<body>${resultRef.current?.innerHTML || result}</body></html>`;
      mimeType = "text/html";
      ext = "html";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.id}-${Date.now()}.${ext}`;
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

            {/* File Upload Zone for tools that support it */}
            {tool.supportsUpload && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Resume (PDF, DOCX, TXT)</Label>
                <div
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && fileInputRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      fileInputRef.current.files = dt.files;
                      fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Extracting resume content...</span>
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-success" />
                      <span className="text-sm text-success dark:text-success font-medium">Resume uploaded & parsed!</span>
                      <span className="text-xs text-muted-foreground">Click or drag to upload a different file</span>
                    </>
                  ) : isDragOver ? (
                    <>
                      <Upload className="h-8 w-8 text-primary animate-bounce" />
                      <span className="text-sm text-primary font-medium">Drop your file here</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground">Click or drag to upload your resume</span>
                      <span className="text-xs text-muted-foreground">PDF, DOCX, or TXT (max 10MB)</span>
                    </>
                  )}
                </div>
              </div>
            )}

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
                  <Select value={downloadFormat} onValueChange={(v) => setDownloadFormat(v as "md" | "txt" | "html")}>
                    <SelectTrigger className="h-7 w-[70px] text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="md">.md</SelectItem>
                      <SelectItem value="txt">.txt</SelectItem>
                      <SelectItem value="html">.html</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 px-2">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 px-2">
                    <Printer className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!user || saving) return;
                    setSaving(true);
                    const { error } = await supabase.from("tool_generations").upsert({
                      user_id: user.id,
                      tool_id: tool.id,
                      fields: JSON.parse(JSON.stringify(fieldValues)),
                      result,
                      is_preset: false,
                    } as never);
                    setSaving(false);
                    if (error) {
                      toast({ title: "Save failed", description: error.message, variant: "destructive" });
                    } else {
                      setUsageCount(prev => (prev ?? 0) + 1);
                      toast({ title: "Saved to Portal", description: "View in your AI Tools tab." });
                    }
                  }} className="h-7 px-2 text-xs" disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                   </Button>
                  <Button size="sm" variant="outline" onClick={handleOpenInDocuDex} className="h-7 px-2 text-xs gap-1" title="Open in DocuDex editor">
                    <ExternalLink className="h-3 w-3" /> DocuDex
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
