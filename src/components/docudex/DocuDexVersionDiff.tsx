import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, ArrowLeft, ArrowRight } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import type { PageData } from "./types";

interface Version {
  id: string;
  version_number: number;
  label: string | null;
  created_at: string;
  pages: PageData[];
}

interface DocuDexVersionDiffProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentPages: PageData[];
}

export function DocuDexVersionDiff({ open, onOpenChange, documentId, currentPages }: DocuDexVersionDiffProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !documentId) return;
    setLoading(true);
    supabase
      .from("docudex_versions")
      .select("id, version_number, label, created_at, pages")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .then(({ data }) => {
        const parsed = (data || []).map(v => ({
          ...v,
          pages: (Array.isArray(v.pages) ? v.pages : []) as unknown as PageData[],
        }));
        setVersions(parsed);
        if (parsed.length >= 2) {
          setLeftId(parsed[1].id);
          setRightId(parsed[0].id);
        } else if (parsed.length === 1) {
          setLeftId(parsed[0].id);
          setRightId("current");
        }
        setLoading(false);
      });
  }, [open, documentId]);

  const leftPages = leftId === "current" ? currentPages : versions.find(v => v.id === leftId)?.pages || [];
  const rightPages = rightId === "current" ? currentPages : versions.find(v => v.id === rightId)?.pages || [];

  const maxPages = Math.max(leftPages.length, rightPages.length);

  const getLabel = (id: string) => {
    if (id === "current") return "Current Draft";
    const v = versions.find(ver => ver.id === id);
    return v ? `v${v.version_number}${v.label ? ` — ${v.label}` : ""}` : "Select";
  };

  const allOptions = [
    ...versions.map(v => ({ id: v.id, label: `v${v.version_number}${v.label ? ` — ${v.label}` : ""}` })),
    { id: "current", label: "Current Draft" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" /> Version Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-4">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger className="w-48 text-xs"><SelectValue placeholder="Older version" /></SelectTrigger>
            <SelectContent>
              {allOptions.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-xs" disabled={o.id === rightId}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger className="w-48 text-xs"><SelectValue placeholder="Newer version" /></SelectTrigger>
            <SelectContent>
              {allOptions.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-xs" disabled={o.id === leftId}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading versions…</div>
        ) : versions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No saved versions found for this document.</div>
        ) : (
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-2 text-xs">{getLabel(leftId)}</Badge>
              </div>
              <div>
                <Badge variant="outline" className="mb-2 text-xs">{getLabel(rightId)}</Badge>
              </div>
              {Array.from({ length: maxPages }).map((_, idx) => (
                <>
                  <div
                    key={`left-${idx}`}
                    className="border rounded-lg p-4 bg-muted/30 prose prose-sm dark:prose-invert max-w-none text-xs overflow-auto max-h-64"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(leftPages[idx]?.html || "<p class='text-muted-foreground italic'>No page</p>") }}
                  />
                  <div
                    key={`right-${idx}`}
                    className="border rounded-lg p-4 bg-muted/30 prose prose-sm dark:prose-invert max-w-none text-xs overflow-auto max-h-64"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(rightPages[idx]?.html || "<p class='text-muted-foreground italic'>No page</p>") }}
                  />
                </>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
