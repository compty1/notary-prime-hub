import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Scale, DollarSign, Users, FileSearch, Loader2, Upload, Download, Copy,
  AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";

type ExtractorType = "legal" | "finance" | "hr" | "general";

interface ExtractionResult {
  document_type: string;
  summary: string;
  results: Record<string, unknown>;
  confidence: number;
}

const EXTRACTOR_CONFIG: Record<ExtractorType, { label: string; icon: typeof Scale; description: string; color: string }> = {
  legal: {
    label: "Legal / Real Estate",
    icon: Scale,
    description: "Extract termination clauses, expiration dates, renewal obligations, parties, and consideration amounts from contracts and deeds.",
    color: "text-blue-500",
  },
  finance: {
    label: "Finance",
    icon: DollarSign,
    description: "Parse invoices and bank statements into categorized transactions with spending breakdowns and CSV export.",
    color: "text-emerald-500",
  },
  hr: {
    label: "HR / Personnel",
    icon: Users,
    description: "Analyze resumes for candidate profiles or parse employee handbooks for policy information.",
    color: "text-violet-500",
  },
  general: {
    label: "General",
    icon: FileSearch,
    description: "Extract key entities, dates, obligations, and action items from any document type.",
    color: "text-amber-500",
  },
};

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />{score}% confidence</Badge>;
  if (score >= 50) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30"><AlertTriangle className="h-3 w-3 mr-1" />{score}% confidence</Badge>;
  return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{score}% confidence</Badge>;
}

function ResultSection({ title, data }: { title: string; data: unknown }) {
  const [expanded, setExpanded] = useState(true);

  if (data === null || data === undefined) return null;

  const renderValue = (val: unknown): React.ReactNode => {
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      return <span className="text-foreground">{String(val)}</span>;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-muted-foreground italic">None found</span>;
      return (
        <div className="space-y-2">
          {val.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
              {typeof item === "object" && item !== null ? (
                <div className="space-y-1">
                  {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="font-medium text-muted-foreground capitalize min-w-[120px]">{k.replace(/_/g, " ")}:</span>
                      {k === "source_quote" ? (
                        <span className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">"{String(v)}"</span>
                      ) : (
                        renderValue(v)
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (typeof val === "object" && val !== null) {
      return (
        <div className="space-y-1">
          {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm">
              <span className="font-medium text-muted-foreground capitalize min-w-[120px]">{k.replace(/_/g, " ")}:</span>
              {renderValue(v)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <span className="font-semibold capitalize text-sm">{title.replace(/_/g, " ")}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="p-3">{renderValue(data)}</div>}
    </div>
  );
}

export default function AIExtractors() {
  usePageTitle("AI Document Intelligence");
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ExtractorType>("legal");
  const [documentText, setDocumentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setDocumentText(text);
    } else {
      toast({ title: "Unsupported file", description: "Please paste text or upload a .txt file. For PDFs, use the Digitize tool first.", variant: "destructive" });
    }
  };

  const handleExtract = async () => {
    if (!documentText.trim()) {
      toast({ title: "No document", description: "Please paste or upload document text to analyze.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-extract-document", {
        body: { document_text: documentText, extractor_type: activeTab },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.extraction);
      toast({ title: "Extraction complete", description: `${data.extraction.document_type} analyzed with ${data.extraction.confidence}% confidence.` });
    } catch (err) {
      toast({ title: "Extraction failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResults = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "Copied", description: "Results copied to clipboard." });
  };

  const handleExportCSV = () => {
    if (!result?.results) return;
    const rows: string[][] = [];

    const flatten = (obj: unknown, prefix = "") => {
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          if (typeof item === "object" && item !== null) {
            const row = Object.values(item as Record<string, unknown>).map(v => String(v ?? ""));
            if (i === 0) rows.push(Object.keys(item as Record<string, unknown>));
            rows.push(row);
          } else {
            rows.push([prefix, String(item)]);
          }
        });
      }
    };

    Object.entries(result.results).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        rows.push([`--- ${key.replace(/_/g, " ").toUpperCase()} ---`]);
        flatten(val, key);
        rows.push([]);
      }
    });

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extraction_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <div className="container max-w-6xl py-10 space-y-8">
        <Breadcrumbs items={[{ label: "AI Tools" }, { label: "Document Intelligence" }]} />

        <motion.div {...fadeUp}>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">AI Document Intelligence</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Upload or paste document text and let AI extract structured data tailored to your industry. Each extraction includes source citations for full transparency.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ExtractorType); setResult(null); }}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            {(Object.entries(EXTRACTOR_CONFIG) as [ExtractorType, typeof EXTRACTOR_CONFIG.legal][]).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5 text-xs sm:text-sm">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.entries(EXTRACTOR_CONFIG) as [ExtractorType, typeof EXTRACTOR_CONFIG.legal][]).map(([key, config]) => (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                    {config.label} Extractor
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Document Text</label>
                      <label className="cursor-pointer">
                        <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                        <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <Upload className="h-3 w-3" /> Upload .txt
                        </span>
                      </label>
                    </div>
                    <Textarea
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                      placeholder="Paste your document text here..."
                      className="min-h-[200px] font-mono text-sm"
                      maxLength={100000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{documentText.length.toLocaleString()} / 100,000 characters</p>
                  </div>

                  <Button onClick={handleExtract} disabled={loading || !documentText.trim()} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? "Analyzing..." : "Extract Data"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Results */}
        {result && (
          <motion.div {...fadeUp} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Extraction Results</h2>
                <ConfidenceBadge score={result.confidence} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyResults} className="gap-1">
                  <Copy className="h-3 w-3" /> Copy JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1">
                  <Download className="h-3 w-3" /> Export CSV
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{result.document_type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                  <Info className="h-4 w-4 inline mr-1 text-primary" />
                  {result.summary}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {Object.entries(result.results).map(([key, val]) => (
                <ResultSection key={key} title={key} data={val} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
