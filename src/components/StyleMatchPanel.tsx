import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, Sparkles, Copy, Download, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface StyleAnalysis {
  tone: string;
  vocabulary_level: string;
  sentence_style: string;
  formatting_patterns?: string[];
  key_phrases?: string[];
  voice?: string;
  perspective?: string;
  strengths?: string[];
  summary: string;
}

export function StyleMatchPanel() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [samples, setSamples] = useState<string[]>([""]);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [generatedText, setGeneratedText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const addSample = () => {
    if (samples.length >= 5) return;
    setSamples([...samples, ""]);
  };

  const removeSample = (index: number) => {
    if (samples.length <= 1) return;
    setSamples(samples.filter((_, i) => i !== index));
  };

  const updateSample = (index: number, text: string) => {
    const updated = [...samples];
    updated[index] = text;
    setSamples(updated);
  };

  const validSamples = samples.filter(s => s.trim().length > 20);

  const analyzeStyle = async () => {
    if (validSamples.length === 0) {
      toast({ title: "Add at least one sample (20+ characters)", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-style-match", {
        body: { sample_texts: validSamples, analyze_only: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast({ title: "Style analysis complete" });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
    setAnalyzing(false);
  };

  const generateDocument = async () => {
    if (validSamples.length === 0 || !brief.trim()) {
      toast({ title: "Provide samples and a brief", variant: "destructive" });
      return;
    }
    setLoading(true);
    setGeneratedText("");
    try {
      const resp = await callEdgeFunctionStream("ai-style-match", {
        sample_texts: validSamples,
        brief: brief.trim(),
      }, 90000);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Generation failed" }));
        toast({ title: err.error || "Generation failed", variant: "destructive" });
        setLoading(false);
        return;
      }
      // Stream SSE
      let soFar = "";
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { soFar += content; setGeneratedText(soFar); }
          } catch { /* partial */ }
        }
      }
    } catch {
      toast({ title: "Generation failed. Try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(generatedText);
    toast({ title: "Copied to clipboard" });
  };

  const downloadResult = () => {
    const blob = new Blob([generatedText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "style-matched-document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Sample texts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Writing Samples</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste 1–5 samples of existing writing. The AI will learn the tone, vocabulary, and formatting.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {samples.map((sample, i) => (
            <div key={i} className="relative">
              <Label className="text-xs">Sample {i + 1}</Label>
              <Textarea
                value={sample}
                onChange={(e) => updateSample(i, e.target.value)}
                rows={4}
                placeholder="Paste a paragraph or more of existing writing..."
                className="pr-8"
              />
              {samples.length > 1 && (
                <button
                  onClick={() => removeSample(i)}
                  className="absolute right-2 top-6 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            {samples.length < 5 && (
              <Button variant="outline" size="sm" onClick={addSample}>
                <Plus className="mr-1 h-3 w-3" /> Add Sample
              </Button>
            )}
            <Button size="sm" onClick={analyzeStyle} disabled={analyzing || validSamples.length === 0}>
              {analyzing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Eye className="mr-1 h-3 w-3" />}
              Analyze Style
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Style analysis results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Style Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tone</p>
                <p className="font-medium">{analysis.tone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vocabulary</p>
                <Badge variant="secondary">{analysis.vocabulary_level}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Voice</p>
                <p className="font-medium">{analysis.voice || "Mixed"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Perspective</p>
                <p className="font-medium">{analysis.perspective?.replace("_", " ") || "Mixed"}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">Sentence Style</p>
              <p className="text-sm">{analysis.sentence_style}</p>
            </div>
            {analysis.key_phrases && analysis.key_phrases.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-1">Key Phrases</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.key_phrases.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-sm text-muted-foreground">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Generation brief */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate New Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Brief *</Label>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="Describe what you want the AI to write, using the style from your samples..."
            />
          </div>
          <Button onClick={generateDocument} disabled={loading || validSamples.length === 0 || !brief.trim()}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate in Style</>}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {generatedText && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated Document</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="mr-1 h-3 w-3" /> {showPreview ? "Raw" : "Preview"}
                </Button>
                <Button variant="outline" size="sm" onClick={copyResult}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadResult}>
                  <Download className="mr-1 h-3 w-3" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted/30 p-4">
                <ReactMarkdown>{generatedText}</ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-foreground font-mono">
                {generatedText}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
