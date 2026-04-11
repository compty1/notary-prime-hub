import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link, Unlink } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

export function DocuDexLinkDialog({ open, onOpenChange, editor }: LinkDialogProps) {
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");
  const [openInNew, setOpenInNew] = useState(true);

  useEffect(() => {
    if (open && editor) {
      const existingLink = editor.getAttributes("link");
      if (existingLink?.href) {
        setUrl(existingLink.href);
        setOpenInNew(existingLink.target === "_blank");
      } else {
        setUrl("https://");
        setOpenInNew(true);
      }
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      setText(selectedText || "");
    }
  }, [open, editor]);

  const handleApply = () => {
    if (!editor || !url.trim()) return;
    const attrs = { href: url.trim(), target: openInNew ? "_blank" : null };
    if (text.trim() && !editor.state.selection.content().size) {
      editor.chain().focus().insertContent(`<a href="${url.trim()}"${openInNew ? ' target="_blank"' : ''}>${text.trim()}</a>`).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    }
    onOpenChange(false);
  };

  const handleRemove = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Link className="h-4 w-4" /> Insert Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">URL</Label>
            <Input
              className="mt-1"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleApply()}
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs">Display Text (optional)</Label>
            <Input
              className="mt-1"
              placeholder="Click here"
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={openInNew} onCheckedChange={setOpenInNew} id="new-tab" />
            <Label htmlFor="new-tab" className="text-xs">Open in new tab</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {editor?.isActive("link") && (
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              <Unlink className="h-3.5 w-3.5 mr-1" /> Remove Link
            </Button>
          )}
          <Button size="sm" onClick={handleApply} disabled={!url.trim() || url === "https://"}>
            Apply Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
