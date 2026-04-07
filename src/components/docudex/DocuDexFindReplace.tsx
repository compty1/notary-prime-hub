import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { stripHtml } from "@/lib/sanitize";
import type { Editor } from "@tiptap/react";

interface FindReplaceProps {
  editor: Editor | null;
  onClose: () => void;
  pageContents: string[];
}

export function DocuDexFindReplace({ editor, onClose, pageContents }: FindReplaceProps) {
  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [useRegex, setUseRegex] = useState(false);
  const [crossPageMatches, setCrossPageMatches] = useState<{ page: number; count: number }[]>([]);

  const buildRegex = useCallback((q: string): RegExp | null => {
    if (!q) return null;
    try {
      if (useRegex) return new RegExp(q, "gi");
      return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    } catch {
      return null;
    }
  }, [useRegex]);

  const findMatches = useCallback((q: string) => {
    if (!q || !editor) { setMatchCount(0); setCrossPageMatches([]); return; }
    const regex = buildRegex(q);
    if (!regex) { setMatchCount(0); return; }

    // Current page matches
    const text = editor.getText();
    const matches = text.match(regex);
    setMatchCount(matches?.length || 0);
    setCurrentMatch(matches?.length ? 1 : 0);

    // Cross-page matches (FR-004)
    const cpMatches: { page: number; count: number }[] = [];
    pageContents.forEach((html, i) => {
      const pageText = stripHtml(html);
      const r = buildRegex(q);
      if (r) {
        const pm = pageText.match(r);
        if (pm?.length) cpMatches.push({ page: i + 1, count: pm.length });
      }
    });
    setCrossPageMatches(cpMatches);
  }, [editor, buildRegex, pageContents]);

  const handleFind = (q: string) => {
    setQuery(q);
    findMatches(q);
  };

  const replaceOne = () => {
    if (!editor || !query) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const regex = buildRegex(query);
    if (regex && regex.test(selectedText)) {
      editor.chain().focus().deleteSelection().insertContent(replaceText).run();
      findMatches(query);
    }
  };

  const replaceAll = () => {
    if (!editor || !query) return;
    const content = editor.getHTML();
    const regex = buildRegex(query);
    if (!regex) return;
    const newContent = content.replace(regex, replaceText);
    editor.commands.setContent(newContent);
    setMatchCount(0);
    setCurrentMatch(0);
  };

  return (
    <div className="flex flex-col gap-1.5 border-b border-border bg-card/95 backdrop-blur px-3 py-1.5 shrink-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Input
          className="h-7 text-xs w-36 md:w-48"
          placeholder={useRegex ? "Regex pattern..." : "Find..."}
          value={query}
          onChange={e => handleFind(e.target.value)}
          onKeyDown={e => { if (e.key === "Escape") onClose(); }}
          autoFocus
        />
        <span className="text-[10px] text-muted-foreground w-16 text-center shrink-0">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : "No results"}
        </span>
        <Input
          className="h-7 text-xs w-36 md:w-48"
          placeholder="Replace with..."
          value={replaceText}
          onChange={e => setReplaceText(e.target.value)}
        />
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={replaceOne} disabled={matchCount === 0}>
          Replace
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={replaceAll} disabled={matchCount === 0}>
          All
        </Button>
        {/* Regex toggle (FR-003) */}
        <div className="flex items-center gap-1 ml-1">
          <Switch checked={useRegex} onCheckedChange={v => { setUseRegex(v); findMatches(query); }} className="scale-75" />
          <span className="text-[10px] text-muted-foreground">Regex</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {/* Cross-page results (FR-004) */}
      {crossPageMatches.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Found across pages:</span>
          {crossPageMatches.map(m => (
            <span key={m.page} className="bg-muted px-1.5 py-0.5 rounded">
              Pg {m.page}: {m.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
