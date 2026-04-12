import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormInput, Type, Calendar, CheckSquare, List, Hash, Trash2, Plus, Copy } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface FormField {
  id: string;
  type: "text" | "date" | "checkbox" | "dropdown" | "number" | "signature";
  label: string;
  placeholder: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPES = [
  { value: "text", label: "Text Input", icon: Type },
  { value: "date", label: "Date Picker", icon: Calendar },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", icon: List },
  { value: "number", label: "Number", icon: Hash },
  { value: "signature", label: "Signature", icon: FormInput },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

export function DocuDexFormFields({ open, onOpenChange, editor }: Props) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [editField, setEditField] = useState<FormField | null>(null);

  const addField = (type: FormField["type"]) => {
    const field: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: "",
      required: false,
      options: type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
    };
    setFields(prev => [...prev, field]);
    setEditField(field);
  };

  const insertFieldIntoEditor = (field: FormField) => {
    if (!editor) return;
    const placeholder = `[${field.required ? "*" : ""}${field.label}:${field.type}]`;
    editor.chain().focus().insertContent(`<span class="form-field" data-field-id="${field.id}" data-field-type="${field.type}" style="background:#e0f2fe;padding:2px 6px;border-radius:4px;border:1px dashed #0284c7;font-size:12px;">${placeholder}</span>&nbsp;`).run();
    onOpenChange(false);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    if (editField?.id === id) setEditField(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FormInput className="h-4 w-4" /> Interactive Form Fields</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1">
            {FIELD_TYPES.map(ft => (
              <Button key={ft.value} variant="outline" size="sm" className="h-8 text-xs" onClick={() => addField(ft.value)}>
                <ft.icon className="h-3 w-3 mr-1" /> {ft.label}
              </Button>
            ))}
          </div>

          <ScrollArea className="max-h-48">
            {fields.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Add form fields above to insert into your document</p>}
            {fields.map(f => (
              <div key={f.id} className={`flex items-center gap-2 p-2 border rounded mb-1 text-xs ${editField?.id === f.id ? "border-primary" : ""}`}>
                <span className="flex-1 font-medium">{f.label}</span>
                <span className="text-muted-foreground">{f.type}</span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => insertFieldIntoEditor(f)} title="Insert">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setFields(prev => prev.filter(x => x.id !== f.id))} title="Delete">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </ScrollArea>

          {editField && (
            <div className="border rounded p-2 space-y-2 bg-muted/30">
              <div>
                <Label className="text-xs">Label</Label>
                <Input value={editField.label} onChange={e => updateField(editField.id, { label: e.target.value })} className="h-6 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Placeholder</Label>
                <Input value={editField.placeholder} onChange={e => updateField(editField.id, { placeholder: e.target.value })} className="h-6 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editField.required} onCheckedChange={v => updateField(editField.id, { required: v })} />
                <Label className="text-xs">Required</Label>
              </div>
              <Button size="sm" className="w-full h-6 text-xs" onClick={() => insertFieldIntoEditor(editField)}>
                <Plus className="h-3 w-3 mr-1" /> Insert into Document
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
