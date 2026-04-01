import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useInsertItem } from "./hooks";

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
  const [spec, setSpec] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const insertItem = useInsertItem();

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSpec("");
    onClose();
  };

  const generateSpec = useCallback(async () => {
    if (!title.trim()) return;
    setIsGenerating(true);
    setSpec("");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-analyst`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: SPEC_PROMPT(title, description) }],
          context: "Design feature specification mode.",
        }),
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setSpec(full);
            }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate spec");
    } finally {
      setIsGenerating(false);
    }
  }, [title, description]);

  const addToTodo = () => {
    const lines = spec.split("\n").filter(l => /^\d+[\.\)]\s/.test(l.trim()));
    if (lines.length === 0) {
      toast.error("No numbered steps found to add");
      return;
    }
    let added = 0;
    for (const line of lines.slice(0, 20)) {
      const stepTitle = line.replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim();
      if (stepTitle.length > 3) {
        insertItem.mutate({
          title: `${title}: ${stepTitle}`.slice(0, 200),
          category: "feature",
          severity: "medium",
          status: "open",
          is_on_todo: true,
          description: `Auto-generated from feature spec: ${title}`,
        });
        added++;
      }
    }
    toast.success(`Added ${added} steps to To-Do`);
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
          <Button onClick={generateSpec} disabled={isGenerating || !title.trim()} className="w-full">
            {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate Implementation Spec
          </Button>

          {spec && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Implementation Spec</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(spec); toast.success("Copied"); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button size="sm" onClick={addToTodo} disabled={insertItem.isPending}>
                    <ListChecks className="h-3 w-3 mr-1" /> Add to To-Do
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 prose prose-sm dark:prose-invert max-w-none max-h-[400px] overflow-y-auto">
                <ReactMarkdown>{spec}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
