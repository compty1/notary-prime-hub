import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useBulkInsert } from "./hooks";
import { useSSEStream, safeClipboardWrite } from "./useSSEStream";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SPEC_PROMPT = (title: string, description: string) =>
  `Generate a detailed implementation specification for this feature:

Title: ${title}
Description: ${description}

Provide:
1. **Implementation Steps** — numbered, actionable steps
2. **Files to Modify** — specific file paths
3. **Testing Steps** — how to verify the feature works
4. **Complexity** — Low/Medium/High with justification
5. **Dependencies** — any packages or services needed

Format the steps clearly so they can be added to a to-do list.`;

export default function DesignFeatureDialog({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const bulkInsert = useBulkInsert();
  const { stream, isStreaming, content } = useSSEStream();

  const handleClose = () => {
    setTitle("");
    setDescription("");
    onClose();
  };

  const generateSpec = useCallback(async () => {
    if (!title.trim()) return;
    try {
      await stream(
        [{ role: "user", content: SPEC_PROMPT(title, description) }],
        "Design feature specification mode."
      );
    } catch { /* handled by useSSEStream */ }
  }, [title, description, stream]);

  const addToTodo = () => {
    const lines = content.split("\n").filter(l => /^\d+[\.\)]\s/.test(l.trim()));
    if (lines.length === 0) {
      toast.error("No numbered steps found to add");
      return;
    }
    const items = lines.slice(0, 20)
      .map(line => line.replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim())
      .filter(stepTitle => stepTitle.length > 3)
      .map(stepTitle => ({
        title: `${title}: ${stepTitle}`.slice(0, 200),
        category: "feature",
        severity: "medium",
        status: "open",
        is_on_todo: true,
        description: `Auto-generated from feature spec: ${title}`,
      }));

    if (items.length > 0) {
      bulkInsert.mutate(items as Partial<import("./constants").TrackerItem>[]);
      toast.success(`Added ${items.length} steps to To-Do`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Design Feature Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Feature title (e.g., 'Document Signing Widget')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <Textarea
            placeholder="Describe the feature (optional but recommended)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <Button onClick={generateSpec} disabled={isStreaming || !title.trim()} className="w-full">
            {isStreaming ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate Implementation Spec
          </Button>

          {content && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Implementation Spec</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { const ok = await safeClipboardWrite(content); if (ok) toast.success("Copied"); else toast.error("Copy failed"); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button size="sm" onClick={addToTodo} disabled={bulkInsert.isPending}>
                    <ListChecks className="h-3 w-3 mr-1" /> Add to To-Do
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 prose prose-sm dark:prose-invert max-w-none max-h-[400px] overflow-y-auto">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
