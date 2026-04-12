import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Variable, Plus, Copy } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
  clientName?: string;
  serviceName?: string;
}

const BUILT_IN_VARIABLES = [
  { token: "{{client_name}}", label: "Client Name", category: "Client" },
  { token: "{{client_email}}", label: "Client Email", category: "Client" },
  { token: "{{client_phone}}", label: "Client Phone", category: "Client" },
  { token: "{{client_address}}", label: "Client Address", category: "Client" },
  { token: "{{service_name}}", label: "Service Name", category: "Service" },
  { token: "{{service_date}}", label: "Service Date", category: "Service" },
  { token: "{{service_time}}", label: "Service Time", category: "Service" },
  { token: "{{confirmation_number}}", label: "Confirmation #", category: "Service" },
  { token: "{{notary_name}}", label: "Notary Name", category: "Notary" },
  { token: "{{notary_commission}}", label: "Commission #", category: "Notary" },
  { token: "{{notary_expiration}}", label: "Commission Exp.", category: "Notary" },
  { token: "{{current_date}}", label: "Current Date", category: "System" },
  { token: "{{current_time}}", label: "Current Time", category: "System" },
  { token: "{{company_name}}", label: "Company Name", category: "System" },
];

export function DocuDexMailMerge({ open, onOpenChange, editor, clientName, serviceName }: Props) {
  const [customVar, setCustomVar] = useState("");
  const [customVars, setCustomVars] = useState<{ token: string; label: string }[]>([]);

  const insertVariable = (token: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(token).run();
  };

  const addCustomVariable = () => {
    if (!customVar.trim()) return;
    const token = `{{${customVar.trim().toLowerCase().replace(/\s+/g, "_")}}}`;
    setCustomVars(prev => [...prev, { token, label: customVar.trim() }]);
    setCustomVar("");
  };

  const allVars = [...BUILT_IN_VARIABLES, ...customVars.map(v => ({ ...v, category: "Custom" }))];
  const categories = [...new Set(allVars.map(v => v.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Variable className="h-4 w-4" /> Mail Merge Variables</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 pr-3">
            {categories.map(cat => (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">{cat}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {allVars.filter(v => v.category === cat).map(v => (
                    <Badge
                      key={v.token}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 text-[11px] gap-1"
                      onClick={() => insertVariable(v.token)}
                    >
                      <Copy className="h-2.5 w-2.5" /> {v.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Custom variable name..."
            value={customVar}
            onChange={e => setCustomVar(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustomVariable()}
            className="text-sm"
          />
          <Button size="sm" variant="outline" onClick={addCustomVariable} disabled={!customVar.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {clientName && (
          <p className="text-[10px] text-muted-foreground">
            Preview: {"{{client_name}}"} → <strong>{clientName}</strong>
            {serviceName && <>, {"{{service_name}}"} → <strong>{serviceName}</strong></>}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
