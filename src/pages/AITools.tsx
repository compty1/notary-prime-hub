import { useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft, Copy, Download, Loader2, Sparkles, Search, Eye, Code, Printer, Star, Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  AI_TOOLS, TOOL_CATEGORIES, CATEGORY_ICONS, getToolById,
  type AITool, type ToolCategory,
} from "@/lib/aiToolsRegistry";
import { useFavoriteTools, useToolHistory } from "@/hooks/useFavoriteTools";

/* ── SSE parser (reused pattern from AIWriter) ── */
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

/* ── Catalog View ── */
function ToolCatalog({
  onSelect,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  favorites,
}: {
  onSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: ToolCategory | "all";
  setActiveCategory: (c: ToolCategory | "all") => void;
  favorites: { isFavorite: (id: string) => boolean; toggleFavorite: (id: string) => void; favorites: string[] };
}) {
  const filtered = AI_TOOLS.filter((t) => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const grouped = TOOL_CATEGORIES.map((cat) => ({
    category: cat,
    tools: filtered.filter((t) => t.category === cat),
  })).filter((g) => g.tools.length > 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" /> 50+ AI-Powered Tools
          </Badge>
          <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
            AI Tools Hub
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Professional document generators, analyzers, and strategic tools — powered by AI
            with industry-standard formatting.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />

        {/* Search + Category Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center" role="search" aria-label="Search AI tools">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory("all")}
            >
              All ({AI_TOOLS.length})
            </Badge>
            {TOOL_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const count = AI_TOOLS.filter((t) => t.category === cat).length;
              return (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className="cursor-pointer gap-1"
                  onClick={() => setActiveCategory(cat)}
                >
                  <Icon className="h-3 w-3" /> {cat.split(" ")[0]} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Tool Grid */}
        {grouped.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p>No tools match your search.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map((group) => (
              <section key={group.category}>
                <div className="mb-4 flex items-center gap-2">
                  {(() => {
                    const CatIcon = CATEGORY_ICONS[group.category];
                    return <CatIcon className="h-5 w-5 text-primary" />;
                  })()}
                  <h2 className="text-xl font-bold text-foreground">{group.category}</h2>
                  <Badge variant="secondary" className="text-xs">{group.tools.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.tools.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Card
                        className="group h-full cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => onSelect(tool.id)}
                      >
                        <CardContent className="flex h-full flex-col p-5">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                            <tool.icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="mb-1 text-sm font-semibold text-foreground">
                            {tool.title}
                          </h3>
                          <p className="mb-3 flex-1 text-xs text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          >
                            Try it <Sparkles className="ml-1 h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Tool Runner View ── */
function ToolRunner({ tool, onBack }: { tool: AITool; onBack: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [lastError, setLastError] = useState(false);
  const [showRendered, setShowRendered] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  const updateField = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = useCallback(async () => {
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
    setResult("");
    setLastError(false);

    try {
      const response = await callEdgeFunctionStream("ai-tools", {
        tool_id: tool.id,
        fields: fieldValues,
        systemPrompt: tool.systemPrompt,
      }, 120000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setLastError(true);
      toast({ title: "Generation failed", description: "Something went wrong. Click Retry to try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tool, fieldValues, user, toast]);

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

  // Ctrl+Enter keyboard shortcut
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Form */}
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
                      {field.options.map((opt) => (
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate
                  </>
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

        {/* Output Panel */}
        <Card className="min-h-[400px]">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Output</h2>
              {result && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={showRendered ? "default" : "outline"}
                    onClick={() => setShowRendered(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Eye className="mr-1 h-3 w-3" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant={!showRendered ? "default" : "outline"}
                    onClick={() => setShowRendered(false)}
                    className="h-7 px-2 text-xs"
                  >
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
              <div
                ref={resultRef}
                className="max-h-[70vh] overflow-y-auto rounded-lg border border-border p-4"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AITools() {
  usePageMeta({
    title: "AI Tools Hub — 50+ Professional Document & Strategy Tools",
    description: "Generate contracts, proposals, reports, and more with AI. Industry-standard formatting, rich text output, and instant results.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const toolParam = searchParams.get("tool");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");

  const selectedTool = toolParam ? getToolById(toolParam) : undefined;

  const handleSelectTool = (id: string) => {
    setSearchParams({ tool: id }, { replace: true });
  };

  const handleBack = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <PageShell>
      {selectedTool ? (
        <ToolRunner tool={selectedTool} onBack={handleBack} />
      ) : (
        <ToolCatalog
          onSelect={handleSelectTool}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      )}
    </PageShell>
  );
}
