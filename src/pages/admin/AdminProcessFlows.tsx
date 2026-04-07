/**
 * Centralized Process Flows & Automation Hub.
 * Shows all service flows, automated steps, email templates in one view.
 */
import { useState, useEffect, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_FLOWS, type FlowStep, type ServiceFlow } from "@/pages/admin/build-tracker/serviceFlows";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, AlertCircle, Circle, Workflow, Mail, Zap, Search, ChevronDown, ChevronRight,
  FileText, Settings, Loader2, Save, RefreshCw, BarChart3
} from "lucide-react";

// Known edge function automations
const EDGE_AUTOMATIONS: Record<string, { name: string; description: string; triggers: string[] }> = {
  "send-appointment-emails": { name: "Appointment Emails", description: "Sends booking confirmation, status change, and completion emails", triggers: ["booking_confirmation", "status_confirmed", "status_completed", "cancellation"] },
  "send-appointment-reminders": { name: "Appointment Reminders", description: "Sends 24h and 30-min reminders before appointments", triggers: ["reminder_24hr", "reminder_30min"] },
  "send-correspondence": { name: "Correspondence", description: "Sends admin-to-client formal correspondence", triggers: ["admin_correspondence"] },
  "process-email-queue": { name: "Email Queue Processor", description: "Processes queued emails via IONOS SMTP", triggers: ["queued_email"] },
  "auth-email-hook": { name: "Auth Email Hook", description: "Custom auth email templates (signup, recovery, etc.)", triggers: ["signup", "recovery", "magic_link", "invite", "email_change", "reauthentication"] },
};

const AUTH_TEMPLATES = ["signup", "recovery", "magic-link", "invite", "email-change", "reauthentication"];

export default function AdminProcessFlows() {
  usePageMeta({ title: "Process Flows & Automation", noIndex: true });
  const { toast } = useToast();
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set(["booking"]));
  const [services, setServices] = useState<any[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<{ key: string; value: string; scope: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [svcRes, settingsRes] = await Promise.all([
        supabase.from("services").select("id, name, email_templates").eq("is_active", true),
        supabase.from("platform_settings").select("setting_key, setting_value").like("setting_key", "email_template_%"),
      ]);
      if (svcRes.data) setServices(svcRes.data);
      if (settingsRes.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach(s => { map[s.setting_key] = s.setting_value; });
        setGlobalTemplates(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleFlow = (id: string) => {
    setExpandedFlows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const totalSteps = SERVICE_FLOWS.reduce((s, f) => s + f.steps.length, 0);
  const implementedSteps = SERVICE_FLOWS.reduce((s, f) => s + f.steps.filter(st => st.implemented).length, 0);
  const gapSteps = totalSteps - implementedSteps;
  const automatedSteps = SERVICE_FLOWS.reduce((s, f) => s + f.steps.filter(st => st.automations && st.automations.length > 0).length, 0);
  const totalEmailTemplates = Object.keys(globalTemplates).length + services.reduce((s, svc) => s + (svc.email_templates ? Object.keys(svc.email_templates).length : 0), 0) + AUTH_TEMPLATES.length;

  // Filter flows
  const filteredFlows = useMemo(() => {
    if (!searchQuery.trim()) return SERVICE_FLOWS;
    const q = searchQuery.toLowerCase();
    return SERVICE_FLOWS.map(flow => ({
      ...flow,
      steps: flow.steps.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.component && s.component.toLowerCase().includes(q))),
    })).filter(f => f.steps.length > 0 || f.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    if (editingTemplate.scope === "global") {
      const { error } = await supabase.from("platform_settings").upsert({
        setting_key: editingTemplate.key,
        setting_value: editingTemplate.value,
      }, { onConflict: "setting_key" });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else {
        setGlobalTemplates(prev => ({ ...prev, [editingTemplate.key]: editingTemplate.value }));
        toast({ title: "Template saved" });
      }
    }
    setSaving(false);
    setEditingTemplate(null);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Process Flows & Automation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">All service flows, automated steps, and email templates in one view</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{SERVICE_FLOWS.length}</p><p className="text-xs text-muted-foreground">Service Flows</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{implementedSteps}/{totalSteps}</p><p className="text-xs text-muted-foreground">Steps Implemented</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{automatedSteps}</p><p className="text-xs text-muted-foreground">Automated Steps</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{totalEmailTemplates}</p><p className="text-xs text-muted-foreground">Email Templates</p></CardContent></Card>
      </div>

      <Tabs defaultValue="flows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="flows"><Workflow className="mr-1 h-4 w-4" /> Process Flows</TabsTrigger>
          <TabsTrigger value="emails"><Mail className="mr-1 h-4 w-4" /> Email Templates</TabsTrigger>
          <TabsTrigger value="automations"><Zap className="mr-1 h-4 w-4" /> Automations</TabsTrigger>
        </TabsList>

        {/* PROCESS FLOWS TAB */}
        <TabsContent value="flows" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flows, steps, components…"
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredFlows.map(flow => (
            <Card key={flow.id} className="rounded-2xl border-border/50 overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                onClick={() => toggleFlow(flow.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedFlows.has(flow.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div className="text-left">
                    <h3 className="font-bold text-sm text-foreground">{flow.name}</h3>
                    <p className="text-xs text-muted-foreground">{flow.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {flow.steps.filter(s => s.implemented).length}/{flow.steps.length} steps
                  </Badge>
                  {flow.steps.some(s => s.issues?.length) && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                      {flow.steps.filter(s => s.issues?.length).length} issues
                    </Badge>
                  )}
                </div>
              </button>

              {expandedFlows.has(flow.id) && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {flow.steps.map((step, i) => (
                    <div key={i} className="px-4 py-3 flex items-start justify-between hover:bg-muted/20">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {step.implemented ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{step.name}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          {step.route && <p className="text-xs text-primary font-mono mt-0.5">{step.route}</p>}
                          {step.component && <Badge variant="outline" className="text-[10px] mt-1">{step.component}</Badge>}
                          {step.automations && step.automations.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {step.automations.map((a, ai) => (
                                <Badge key={ai} className="bg-primary/10 text-primary text-[10px]">
                                  <Zap className="h-2.5 w-2.5 mr-0.5" /> {a.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {step.emailTemplateKey && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] mt-1">
                              <Mail className="h-2.5 w-2.5 mr-0.5" /> {step.emailTemplateKey}
                            </Badge>
                          )}
                          {step.issues?.map((issue, ii) => (
                            <p key={ii} className="text-xs text-amber-600 mt-1">⚠ {issue}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* EMAIL TEMPLATES TAB */}
        <TabsContent value="emails" className="space-y-6">
          <h3 className="font-bold text-sm text-foreground">Global Email Templates</h3>
          <div className="space-y-2">
            {Object.entries(globalTemplates).map(([key, value]) => (
              <Card key={key} className="rounded-xl border-border/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{key.replace("email_template_", "").replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{value.slice(0, 100)}…</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingTemplate({ key, value, scope: "global" })}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
            {Object.keys(globalTemplates).length === 0 && (
              <p className="text-sm text-muted-foreground">No global email templates configured in platform settings.</p>
            )}
          </div>

          <h3 className="font-bold text-sm text-foreground mt-6">Per-Service Email Overrides</h3>
          <div className="space-y-2">
            {services.filter(s => s.email_templates && Object.keys(s.email_templates).length > 0).map(svc => (
              <Card key={svc.id} className="rounded-xl border-border/50">
                <CardContent className="p-3">
                  <p className="text-sm font-bold text-foreground mb-2">{svc.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(svc.email_templates || {}).map(tplKey => (
                      <Badge key={tplKey} variant="outline" className="text-[10px]">
                        {tplKey.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {services.filter(s => s.email_templates && Object.keys(s.email_templates).length > 0).length === 0 && (
              <p className="text-sm text-muted-foreground">No per-service email overrides configured.</p>
            )}
          </div>

          <h3 className="font-bold text-sm text-foreground mt-6">Auth Email Templates</h3>
          <div className="flex flex-wrap gap-2">
            {AUTH_TEMPLATES.map(t => (
              <Badge key={t} className="bg-muted text-muted-foreground">
                <Mail className="h-3 w-3 mr-1" /> {t}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Auth templates are defined in <code>supabase/functions/_shared/email-templates/</code> and deployed via the auth-email-hook edge function.</p>
        </TabsContent>

        {/* AUTOMATIONS TAB */}
        <TabsContent value="automations" className="space-y-4">
          {Object.entries(EDGE_AUTOMATIONS).map(([fnName, auto]) => (
            <Card key={fnName} className="rounded-2xl border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">{auto.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">{fnName}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{auto.description}</p>
                <div className="flex flex-wrap gap-1">
                  {auto.triggers.map(t => (
                    <Badge key={t} className="bg-primary/10 text-primary text-[10px]">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit template dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Edit Template: {editingTemplate?.key.replace("email_template_", "").replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingTemplate?.value || ""}
            onChange={e => setEditingTemplate(prev => prev ? { ...prev, value: e.target.value } : null)}
            rows={10}
            className="font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
