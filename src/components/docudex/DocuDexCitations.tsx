import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookMarked, Plus, Trash2, Copy } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface Citation {
  id: string;
  number: number;
  author: string;
  title: string;
  source: string;
  year: string;
  url?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

export function DocuDexCitations({ open, onOpenChange, editor }: Props) {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [year, setYear] = useState("");
  const [url, setUrl] = useState("");

  const addCitation = () => {
    if (!title.trim()) return;
    const c: Citation = {
      id: crypto.randomUUID(),
      number: citations.length + 1,
      author: author.trim(),
      title: title.trim(),
      source: source.trim(),
      year: year.trim(),
      url: url.trim() || undefined,
    };
    setCitations(prev => [...prev, c]);
    setAuthor(""); setTitle(""); setSource(""); setYear(""); setUrl("");
  };

  const insertFootnote = (c: Citation) => {
    if (!editor) return;
    editor.chain().focus().insertContent(
      `<sup style="color:#2563eb;cursor:pointer;font-size:10px;">[${c.number}]</sup>`
    ).run();
  };

  const insertBibliography = () => {
    if (!editor || citations.length === 0) return;
    const bib = citations.map(c =>
      `<p style="font-size:11px;margin:2px 0;text-indent:-20px;padding-left:20px;">[${c.number}] ${c.author}${c.author ? ". " : ""}<em>${c.title}</em>${c.source ? `. ${c.source}` : ""}${c.year ? ` (${c.year})` : ""}${c.url ? `. <a href="${c.url}">${c.url}</a>` : ""}.</p>`
    ).join("");
    editor.chain().focus().insertContent(`<hr/><h3 style="font-size:14px;">References</h3>${bib}`).run();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookMarked className="h-4 w-4" /> Citations & Footnotes</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <div><Label className="text-xs">Author</Label><Input value={author} onChange={e => setAuthor(e.target.value)} className="h-6 text-xs" /></div>
            <div><Label className="text-xs">Year</Label><Input value={year} onChange={e => setYear(e.target.value)} className="h-6 text-xs" /></div>
          </div>
          <div><Label className="text-xs">Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="h-6 text-xs" /></div>
          <div><Label className="text-xs">Source / Journal</Label><Input value={source} onChange={e => setSource(e.target.value)} className="h-6 text-xs" /></div>
          <div><Label className="text-xs">URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} className="h-6 text-xs" /></div>
          <Button size="sm" className="h-6 text-xs w-full" onClick={addCitation} disabled={!title.trim()}>
            <Plus className="h-3 w-3 mr-1" /> Add Citation
          </Button>
        </div>

        <ScrollArea className="max-h-36 border rounded p-1">
          {citations.map(c => (
            <div key={c.id} className="flex items-center gap-2 p-1.5 text-xs border-b last:border-0">
              <span className="font-bold text-primary">[{c.number}]</span>
              <span className="flex-1 truncate">{c.author ? `${c.author}. ` : ""}{c.title}</span>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => insertFootnote(c)} title="Insert footnote marker">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => setCitations(prev => prev.filter(x => x.id !== c.id).map((x, i) => ({ ...x, number: i + 1 })))}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          {citations.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No citations added yet</p>}
        </ScrollArea>

        <DialogFooter className="gap-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          <Button size="sm" onClick={insertBibliography} disabled={citations.length === 0}>
            Insert Bibliography
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
