import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { TrackerItem } from "./constants";
import { useBulkUpdate } from "./hooks";
import { useSSEStream, extractJSON } from "./useSSEStream";

type Props = {
  items: TrackerItem[];
  variant?: "default" | "outline";
  size?: "default" | "sm";
};

type VerifyResult = {
  confirmedFixed: string[];
  stillOpen: string[];
  newIssues: string[];
};

export default function VerifyFixesButton({ items, variant = "outline", size = "sm" }: Props) {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const bulkUpdate = useBulkUpdate();
  const { stream, isStreaming } = useSSEStream();

  const openItems = items.filter(i => i.status === "open" || i.status === "in_progress");

  const verify = useCallback(async () => {
    if (openItems.length === 0) {
      toast.info("No open items to verify");
      return;
    }
    setResult(null);

    const itemSummary = openItems.slice(0, 50).map(i => `- [${i.id.slice(0, 8)}] ${i.title} (${i.category}, ${i.severity})`).join("\n");

    const prompt = `Review these open build tracker items and determine which ones are likely already resolved based on the build state context provided. The platform is a mature React app with backend capabilities.

Open Items:
${itemSummary}

Return ONLY valid JSON (no markdown):
{
  "confirmedFixed": ["id-prefix-1", "id-prefix-2"],
  "stillOpen": ["id-prefix-3"],
  "newIssues": ["description of any new issue found"]
}

Use the 8-char ID prefixes from above. Be conservative — only confirm fixed items you're confident about.`;

    try {
      const fullContent = await stream(
        [{ role: "user", content: prompt }],
        `Total items: ${items.length}, Open: ${openItems.length}, Resolved: ${items.filter(i => i.status === "resolved").length}`
      );
      const parsed = extractJSON<VerifyResult>(fullContent);
      setResult(parsed);
      setShowDialog(true);
    } catch {
      /* handled by useSSEStream */
    }
  }, [items, openItems, stream]);

  const applyFixes = () => {
    if (!result?.confirmedFixed.length) return;
    const matchedIds = openItems
      .filter(item => result.confirmedFixed.some(prefix => item.id.startsWith(prefix)))
      .map(i => i.id);

    if (matchedIds.length === 0) {
      toast.error("No matching items found to resolve");
      return;
    }
    bulkUpdate.mutate({
      ids: matchedIds,
      fields: { status: "resolved", resolved_at: new Date().toISOString() },
    });
    setShowDialog(false);
    setResult(null);
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={verify} disabled={isStreaming || openItems.length === 0}>
        {isStreaming ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1" />}
        Verify Fixes ({openItems.length})
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Verification Results
            </DialogTitle>
          </DialogHeader>

          {result && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                {result.confirmedFixed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="font-medium text-sm">Confirmed Fixed ({result.confirmedFixed.length})</span>
                    </div>
                    <div className="space-y-1">
                      {result.confirmedFixed.map((id, idx) => {
                        const item = openItems.find(i => i.id.startsWith(id));
                        return (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2 py-1 px-2 rounded bg-success/5">
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                            {item?.title || id}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.stillOpen.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="font-medium text-sm">Still Open ({result.stillOpen.length})</span>
                    </div>
                    <div className="space-y-1">
                      {result.stillOpen.map((id, idx) => {
                        const item = openItems.find(i => i.id.startsWith(id));
                        return (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2 py-1 px-2 rounded bg-warning/5">
                            <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                            {item?.title || id}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.newIssues.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-sm">New Issues ({result.newIssues.length})</span>
                    </div>
                    <div className="space-y-1">
                      {result.newIssues.map((issue, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2 py-1 px-2 rounded bg-destructive/5">
                          <XCircle className="h-3 w-3 text-destructive shrink-0" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
            {result && result.confirmedFixed.length > 0 && (
              <Button onClick={applyFixes} disabled={bulkUpdate.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Resolve {result.confirmedFixed.length} Items
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
