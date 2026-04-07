import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown, ChevronUp, Replace } from "lucide-react";
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

  const findMatches = useCallback((q: string) => {
    if (!q || !editor) { setMatchCount(0); return; }
    const text = editor.getText();
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = text.match(regex);
    setMatchCount(matches?.length || 0);
    setCurrentMatch(matches?.length ? 1 : 0);
  }, [editor]);

  const handleFind = (q: string) => {
    setQuery(q);
    findMatches(q);
  };

  const replaceOne = () => {
    if (!editor || !query) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (selectedText.toLowerCase() === query.toLowerCase()) {
      editor.chain().focus().deleteSelection().insertContent(replaceText).run();
      findMatches(query);
    }
  };

  const replaceAll = () => {
    if (!editor || !query) return;
    const content = editor.getHTML();
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const newContent = content.replace(regex, replaceText);
    editor.commands.setContent(newContent);
    setMatchCount(0);
    setCurrentMatch(0);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-card/95 backdrop-blur px-3 py-1.5 shrink-0">
      <div className="flex items-center gap-1.5 flex-1">
        <Input
          className="h-7 text-xs w-48"
          placeholder="Find..."
          value={query}
          onChange={e => handleFind(e.target.value)}
          onKeyDown={e => { if (e.key === "Escape") onClose(); }}
          autoFocus
        />
        <span className="text-[10px] text-muted-foreground w-16 text-center">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : "No results"}
        </span>
        <Input
          className="h-7 text-xs w-48"
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
      </div>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
