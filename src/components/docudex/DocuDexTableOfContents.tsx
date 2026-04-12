import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TocProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: { id: string; html: string }[];
  onInsert: (html: string) => void;
}

interface TocEntry {
  level: number;
  text: string;
  pageIdx: number;
}

export function DocuDexTableOfContents({ open, onOpenChange, pages, onInsert }: TocProps) {
  const { toast } = useToast();

  const entries = useMemo<TocEntry[]>(() => {
    const results: TocEntry[] = [];
    pages.forEach((page, pageIdx) => {
      const matches = page.html.matchAll(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi);
      for (const match of matches) {
        const level = parseInt(match[1], 10);
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (text) results.push({ level, text, pageIdx });
      }
    });
    return results;
  }, [pages]);

  const generateTocHtml = () => {
    if (entries.length === 0) return "<p><em>No headings found</em></p>";
    let html = "<h2>Table of Contents</h2>";
    entries.forEach(entry => {
      const indent = (entry.level - 1) * 20;
      html += `<p style="padding-left:${indent}px">${entry.text} <span style="color:#999">— Page ${entry.pageIdx + 1}</span></p>`;
    });
    return html;
  };

  const handleInsert = () => {
    onInsert(generateTocHtml());
    toast({ title: "Table of Contents inserted" });
    onOpenChange(false);
  };

  const handleCopy = () => {
    const text = entries.map(e => `${"  ".repeat(e.level - 1)}${e.text} — Page ${e.pageIdx + 1}`).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><List className="h-5 w-5" /> Table of Contents</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No headings found in your document.</p>
              <p className="text-xs text-muted-foreground mt-1">Add H1-H6 headings to generate a table of contents.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 text-sm"
                  style={{ paddingLeft: `${(entry.level - 1) * 16 + 8}px` }}
                >
                  <span className="text-xs text-muted-foreground font-mono">H{entry.level}</span>
                  <span className="flex-1 truncate">{entry.text}</span>
                  <span className="text-xs text-muted-foreground">p.{entry.pageIdx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {entries.length > 0 && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
            <Button size="sm" onClick={handleInsert}><List className="h-3.5 w-3.5 mr-1" /> Insert into Document</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
