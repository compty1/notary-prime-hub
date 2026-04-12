import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { category: "Text Formatting", items: [
    { keys: "Ctrl+B", action: "Bold" },
    { keys: "Ctrl+I", action: "Italic" },
    { keys: "Ctrl+U", action: "Underline" },
    { keys: "Ctrl+Shift+X", action: "Strikethrough" },
    { keys: "Ctrl+Shift+H", action: "Highlight" },
  ]},
  { category: "Editing", items: [
    { keys: "Ctrl+Z", action: "Undo" },
    { keys: "Ctrl+Shift+Z", action: "Redo" },
    { keys: "Ctrl+A", action: "Select All" },
    { keys: "Ctrl+F", action: "Find & Replace" },
    { keys: "Ctrl+S", action: "Save" },
  ]},
  { category: "Structure", items: [
    { keys: "Ctrl+Shift+1", action: "Heading 1" },
    { keys: "Ctrl+Shift+2", action: "Heading 2" },
    { keys: "Ctrl+Shift+3", action: "Heading 3" },
    { keys: "Ctrl+Shift+8", action: "Bullet List" },
    { keys: "Ctrl+Shift+9", action: "Numbered List" },
  ]},
  { category: "Alignment", items: [
    { keys: "Ctrl+Shift+L", action: "Align Left" },
    { keys: "Ctrl+Shift+E", action: "Align Center" },
    { keys: "Ctrl+Shift+R", action: "Align Right" },
    { keys: "Ctrl+Shift+J", action: "Justify" },
  ]},
  { category: "View", items: [
    { keys: "Ctrl+/", action: "Show Shortcuts" },
    { keys: "Ctrl++", action: "Zoom In" },
    { keys: "Ctrl+-", action: "Zoom Out" },
    { keys: "F11", action: "Fullscreen" },
  ]},
];

export function DocuDexKeyboardShortcuts({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {SHORTCUTS.map(cat => (
            <div key={cat.category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{cat.category}</h4>
              <div className="space-y-1">
                {cat.items.map(s => (
                  <div key={s.keys} className="flex items-center justify-between py-1">
                    <span className="text-sm">{s.action}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{s.keys}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
