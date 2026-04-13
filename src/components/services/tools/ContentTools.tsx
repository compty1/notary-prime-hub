/**
 * Sprint 9: Content Tools Panel
 * SEO keyword density, readability score, heading analyzer, meta description generator
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Type, Search, FileText, Copy } from "lucide-react";
import { toast } from "sonner";

function fleschKincaid(text: string): { score: number; grade: string; label: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  let grade = "College";
  let label = "Very Difficult";
  if (clamped >= 90) { grade = "5th Grade"; label = "Very Easy"; }
  else if (clamped >= 80) { grade = "6th Grade"; label = "Easy"; }
  else if (clamped >= 70) { grade = "7th Grade"; label = "Fairly Easy"; }
  else if (clamped >= 60) { grade = "8-9th Grade"; label = "Standard"; }
  else if (clamped >= 50) { grade = "10-12th Grade"; label = "Fairly Difficult"; }
  else if (clamped >= 30) { grade = "College"; label = "Difficult"; }
  return { score: clamped, grade, label };
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g)?.length || 1;
  return Math.max(1, count);
}

export function ContentTools() {
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");

  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim()).length;
    const readability = content.trim() ? fleschKincaid(content) : null;

    const keywordList = keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    const lowerContent = content.toLowerCase();
    const keywordDensity = keywordList.map(kw => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = content.match(regex)?.length || 0;
      const density = words.length > 0 ? ((matches / words.length) * 100) : 0;
      return { keyword: kw, count: matches, density: Math.round(density * 100) / 100 };
    });

    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    const hasH1 = headings.some(h => /^#\s/.test(h));
    const metaDesc = content.slice(0, 160).replace(/\n/g, " ").trim();

    return { wordCount: words.length, sentences, paragraphs, readability, keywordDensity, headings, hasH1, metaDesc };
  }, [content, keywords]);

  return (
    <div className="space-y-4">
      {/* Content Input */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your content here for analysis..."
            className="min-h-[120px] text-sm"
          />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{stats.wordCount} words</Badge>
            <Badge variant="outline">{stats.sentences} sentences</Badge>
            <Badge variant="outline">{stats.paragraphs} paragraphs</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Readability */}
      {stats.readability && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Type className="h-4 w-4" /> Readability Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Flesch-Kincaid: <strong>{stats.readability.score}</strong></span>
              <Badge variant={stats.readability.score >= 60 ? "default" : "secondary"}>{stats.readability.label}</Badge>
            </div>
            <Progress value={stats.readability.score} className="h-2" />
            <p className="text-xs text-muted-foreground">Reading level: {stats.readability.grade}</p>
          </CardContent>
        </Card>
      )}

      {/* SEO Keywords */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" /> SEO Keyword Density
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Target Keywords (comma-separated)</Label>
          <Input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="notary, Ohio, remote notarization"
            className="h-8 text-xs"
          />
          {stats.keywordDensity.length > 0 && (
            <div className="space-y-1 mt-2">
              {stats.keywordDensity.map(kd => (
                <div key={kd.keyword} className="flex items-center justify-between text-xs">
                  <span className="font-mono">"{kd.keyword}"</span>
                  <div className="flex items-center gap-2">
                    <span>{kd.count}×</span>
                    <Badge variant={kd.density >= 1 && kd.density <= 3 ? "default" : "secondary"}>
                      {kd.density}%
                    </Badge>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground mt-1">Ideal keyword density: 1-3%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heading Analyzer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Heading Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.headings.length > 0 ? (
            <div className="space-y-1">
              {!stats.hasH1 && (
                <p className="text-xs text-destructive">⚠ Missing H1 heading — add a single # heading</p>
              )}
              {stats.headings.map((h, i) => {
                const level = h.match(/^(#+)/)?.[1].length || 1;
                return (
                  <div key={i} className="text-xs" style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                    <Badge variant="outline" className="text-[10px] mr-1">H{level}</Badge>
                    {h.replace(/^#+\s*/, "")}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No markdown headings detected. Use # for H1, ## for H2, etc.</p>
          )}
        </CardContent>
      </Card>

      {/* Meta Description */}
      {stats.metaDesc && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Meta Description Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground border rounded p-2">{stats.metaDesc}...</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{stats.metaDesc.length}/160 chars</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                navigator.clipboard.writeText(stats.metaDesc);
                toast.success("Copied");
              }}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
