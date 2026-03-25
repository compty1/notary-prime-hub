import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight, Copy, Download, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

export default function WhatDoINeed() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult("");
    setShowResult(true);

    let soFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: query }] }),
      });
      if (!resp.ok) throw new Error("AI unavailable");
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
            if (content) { soFar += content; setResult(soFar); }
          } catch { /* partial */ }
        }
      }
    } catch {
      setResult("Sorry, the AI assistant is temporarily unavailable. Please try again or contact us directly.");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({ title: "Copied!", description: "Response copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please select and copy manually.", variant: "destructive" });
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notary-guidance.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>What Do I Need? — Notar</title>
        <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:700px;margin:0 auto;line-height:1.6}
        h1,h2,h3{margin-top:1.5em}ul,ol{padding-left:1.5em}strong{font-weight:600}</style></head>
        <body><h1>Notar — Service Guidance</h1><p><em>Query: ${query}</em></p><hr/>${result.replace(/\n/g, "<br/>")}</body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <section className="py-10 bg-muted/30 border-b border-border/50">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="mb-2 font-sans text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> What Do I Need?
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Describe your situation and get practical instructions, required documents, forms, and tips.
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., I need to notarize a power of attorney for my mom"
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={loading || !query.trim()} className="bg-gradient-primary text-white hover:opacity-90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" /> Go</>}
          </Button>
        </div>
        {showResult && (
          <Card className="mt-4 text-left border-primary/20">
            <CardContent className="p-4">
              {result ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your situation...
                </div>
              )}
              {result && !loading && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownloadText}>
                      <Download className="mr-1 h-3 w-3" /> Save as Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={handlePrint}>
                      <Printer className="mr-1 h-3 w-3" /> Print / PDF
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/book"><Button size="sm" className="bg-gradient-primary text-white hover:opacity-90">Book Appointment <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
                    <Link to="/templates"><Button size="sm" variant="outline">View Templates</Button></Link>
                    <Link to="/services"><Button size="sm" variant="outline">All Services</Button></Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
