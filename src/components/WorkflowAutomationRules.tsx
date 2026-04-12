import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Zap, Plus, Trash2, Play, Pause } from "lucide-react";

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
};

const TRIGGERS = [
  "Appointment Created",
  "Appointment Completed",
  "Document Uploaded",
  "Payment Received",
  "Client Registered",
  "No-Show Detected",
  "KBA Failed",
];

const ACTIONS = [
  "Send Email Notification",
  "Update Status",
  "Create Follow-up Task",
  "Generate Invoice",
  "Log Audit Entry",
  "Tag Client",
  "Assign to Queue",
];

const DEFAULT_RULES: AutomationRule[] = [
  { id: "1", name: "Auto-confirm after payment", trigger: "Payment Received", condition: "appointment.status = pending", action: "Update Status", enabled: true },
  { id: "2", name: "No-show fee trigger", trigger: "No-Show Detected", condition: "no_show_count >= 2", action: "Generate Invoice", enabled: true },
  { id: "3", name: "Welcome email on signup", trigger: "Client Registered", condition: "always", action: "Send Email Notification", enabled: true },
  { id: "4", name: "KBA failure alert", trigger: "KBA Failed", condition: "kba_attempts >= 2", action: "Log Audit Entry", enabled: true },
];

export function WorkflowAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", trigger: "", action: "" });

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    toast.success("Rule updated");
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Rule deleted");
  };

  const addRule = () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) return;
    setRules(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newRule.name,
      trigger: newRule.trigger,
      condition: "always",
      action: newRule.action,
      enabled: true,
    }]);
    setNewRule({ name: "", trigger: "", action: "" });
    setDialogOpen(false);
    toast.success("Automation rule created");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Workflow Automation</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{rule.name}</span>
                {rule.enabled ? <Play className="h-3 w-3 text-green-500" /> : <Pause className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex gap-1 mt-1">
                <Badge variant="outline" className="text-[10px]">{rule.trigger}</Badge>
                <span className="text-[10px] text-muted-foreground">→</span>
                <Badge variant="secondary" className="text-[10px]">{rule.action}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No automation rules configured</p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Automation Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Rule Name</Label><Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Auto-tag VIP clients" /></div>
            <div>
              <Label>When (Trigger)</Label>
              <Select value={newRule.trigger} onValueChange={v => setNewRule(p => ({ ...p, trigger: v }))}>
                <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Then (Action)</Label>
              <Select value={newRule.action} onValueChange={v => setNewRule(p => ({ ...p, action: v }))}>
                <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addRule} disabled={!newRule.name || !newRule.trigger || !newRule.action}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
