import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpellCheck, RefreshCw, CheckCircle } from "lucide-react";

// Common misspellings dictionary
const COMMON_ERRORS: Record<string, string> = {
  teh: "the", recieve: "receive", occured: "occurred", seperate: "separate",
  definately: "definitely", accomodate: "accommodate", occassion: "occasion",
  neccessary: "necessary", noterize: "notarize", notarize: "notarize",
  afadavit: "affidavit", acknowlegment: "acknowledgment",
  jurat: "jurat", depostition: "deposition", complainant: "complainant",
};

interface SpellIssue { word: string; suggestion: string; index: number }

interface Props {
  content: string;
  onReplace: (original: string, replacement: string) => void;
}

export function DocuDexSpellCheck({ content, onReplace }: Props) {
  const [issues, setIssues] = useState<SpellIssue[]>([]);
  const [scanned, setScanned] = useState(false);

  const runCheck = useCallback(() => {
    const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean);
    const found: SpellIssue[] = [];
    words.forEach((w, i) => {
      const lower = w.toLowerCase().replace(/[^a-z]/g, "");
      if (COMMON_ERRORS[lower]) {
        found.push({ word: w, suggestion: COMMON_ERRORS[lower], index: i });
      }
    });
    setIssues(found);
    setScanned(true);
  }, [content]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold flex items-center gap-1">
          <SpellCheck className="h-3.5 w-3.5" /> Spell Check
        </span>
        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={runCheck}>
          <RefreshCw className="h-3 w-3 mr-1" /> Scan
        </Button>
      </div>

      {scanned && issues.length === 0 && (
        <div className="flex items-center gap-1 text-xs text-success">
          <CheckCircle className="h-3.5 w-3.5" /> No spelling issues found
        </div>
      )}

      <ScrollArea className="max-h-40">
        {issues.map((issue, i) => (
          <div key={i} className="flex items-center gap-2 p-1.5 border rounded mb-1 text-xs">
            <span className="text-destructive line-through">{issue.word}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-success font-medium">{issue.suggestion}</span>
            <Button variant="outline" size="sm" className="h-5 text-[10px] ml-auto" onClick={() => { onReplace(issue.word, issue.suggestion); setIssues(prev => prev.filter((_, j) => j !== i)); }}>
              Fix
            </Button>
          </div>
        ))}
      </ScrollArea>

      {issues.length > 0 && (
        <Button variant="outline" size="sm" className="h-6 text-xs w-full" onClick={() => { issues.forEach(i => onReplace(i.word, i.suggestion)); setIssues([]); }}>
          Fix All ({issues.length})
        </Button>
      )}
    </div>
  );
}
