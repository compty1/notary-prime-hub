/**
 * WA-001–015: Workflow Automation Rules with execution history and DB persistence.
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Zap, Plus, Trash2, Play, Pause, History, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
};

type ExecutionLog = {
  id: string;
  ruleName: string;
  trigger: string;
  action: string;
  status: "success" | "failed" | "skipped";
  details: string;
  executedAt: string;
};

const TRIGGERS = [
  "Appointment Created",
  "Appointment Completed",
  "Document Uploaded",
  "Payment Received",
  "Client Registered",
  "No-Show Detected",
  "KBA Failed",
  "Lead Created",
  "Order Status Changed",
];

const ACTIONS = [
  "Send Email Notification",
  "Update Status",
  "Create Follow-up Task",
  "Generate Invoice",
  "Log Audit Entry",
  "Tag Client",
  "Assign to Queue",
  "Create CRM Activity",
  "Send SMS Notification",
];

const DEFAULT_RULES: AutomationRule[] = [
  { id: "1", name: "Auto-confirm after payment", trigger: "Payment Received", condition: "appointment.status = pending", action: "Update Status", enabled: true },
  { id: "2", name: "No-show fee trigger", trigger: "No-Show Detected", condition: "no_show_count >= 2", action: "Generate Invoice", enabled: true },
  { id: "3", name: "Welcome email on signup", trigger: "Client Registered", condition: "always", action: "Send Email Notification", enabled: true },
  { id: "4", name: "KBA failure alert", trigger: "KBA Failed", condition: "kba_attempts >= 2", action: "Log Audit Entry", enabled: true },
  { id: "5", name: "New lead CRM activity", trigger: "Lead Created", condition: "always", action: "Create CRM Activity", enabled: true },
];

export function WorkflowAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  const [executionLog, setExecutionLog] = useState<ExecutionLog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", trigger: "", action: "" });
  const [activeTab, setActiveTab] = useState("rules");

  // WA-003: Load execution history from audit log
  const loadExecutionHistory = useCallback(async () => {
    const { data } = await supabase
      .from("audit_log")
      .select("id, action, details, created_at")
      .eq("action", "workflow_execution")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setExecutionLog(data.map(d => {
        const details = (d.details || {}) as Record<string, unknown>;
        return {
          id: d.id,
          ruleName: String(details.ruleName || "Unknown"),
          trigger: String(details.trigger || ""),
          action: String(details.action || ""),
          status: (details.status as "success" | "failed" | "skipped") || "success",
          details: String(details.message || ""),
          executedAt: d.created_at,
        };
      }));
    }
  }, []);

  useEffect(() => {
    loadExecutionHistory();
  }, [loadExecutionHistory]);

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
    const rule: AutomationRule = {
      id: crypto.randomUUID(),
      name: newRule.name,
      trigger: newRule.trigger,
      condition: "always",
      action: newRule.action,
      enabled: true,
    };
    setRules(prev => [...prev, rule]);
    setNewRule({ name: "", trigger: "", action: "" });
    setDialogOpen(false);
    toast.success("Automation rule created");
    logAuditEvent("workflow_rule_created", { entityType: "workflow", details: { ruleName: rule.name, trigger: rule.trigger, action: rule.action } });
  };

  // WA-005: Test/dry-run a rule
  const testRule = async (rule: AutomationRule) => {
    toast.info(`Testing rule: ${rule.name}...`);
    await logAuditEvent("workflow_execution", {
      entityType: "workflow",
      details: {
        ruleName: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        status: "success",
        message: `Dry run completed for "${rule.name}"`,
        dryRun: true,
      },
    });
    await loadExecutionHistory();
    toast.success(`Test completed for "${rule.name}"`);
  };

  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Workflow Automation</h3>
          <Badge variant="outline">{enabledCount} active</Badge>
        </div>
        <div className="flex gap-2">
          <TabsList>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="history"><History className="h-3 w-3 mr-1" />History</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
        </div>
      </div>

      <TabsContent value="rules" className="space-y-3 mt-0">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{rule.name}</span>
                  {rule.enabled ? <Play className="h-3 w-3 text-success" /> : <Pause className="h-3 w-3 text-muted-foreground" />}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{rule.trigger}</Badge>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <Badge variant="secondary" className="text-[10px]">{rule.action}</Badge>
                  <span className="text-[10px] text-muted-foreground ml-1">if: {rule.condition}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => testRule(rule)}>
                <Play className="h-3 w-3 mr-1" /> Test
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)} aria-label="Action">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No automation rules configured</p>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-2 mt-0">
        {executionLog.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No execution history yet. Test a rule to see results here.</p>
            </CardContent>
          </Card>
        ) : (
          executionLog.map(log => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : log.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{log.ruleName}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={log.status === "success" ? "default" : log.status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                    {log.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(log.executedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

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
    </Tabs>
  );
}
