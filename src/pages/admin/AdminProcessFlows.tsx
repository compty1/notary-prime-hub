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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, AlertCircle, Circle, Workflow, Mail, Zap, Search, ChevronDown, ChevronRight,
  FileText, Settings, Loader2, Save, RefreshCw, BarChart3
} from "lucide-react";
import ProcessFlowsTab from "./process-flows/ProcessFlowsTab";
import EmailTemplatesTab from "./process-flows/EmailTemplatesTab";
import AutomationsTab from "./process-flows/AutomationsTab";

// Known edge function automations
const EDGE_AUTOMATIONS: Record<string, { name: string; description: string; triggers: string[] }> = {
  "send-appointment-emails": { name: "Appointment Emails", description: "Sends booking confirmation, status change, and completion emails", triggers: ["booking_confirmation", "status_confirmed", "status_completed", "cancellation"] },
  "send-appointment-reminders": { name: "Appointment Reminders", description: "Sends 24h and 30-min reminders before appointments", triggers: ["reminder_24hr", "reminder_30min"] },
  "send-correspondence": { name: "Correspondence", description: "Sends admin-to-client formal correspondence", triggers: ["admin_correspondence"] },
  "process-email-queue": { name: "Email Queue Processor", description: "Processes queued emails via IONOS SMTP", triggers: ["queued_email"] },
  "auth-email-hook": { name: "Auth Email Hook", description: "Custom auth email templates (signup, recovery, etc.)", triggers: ["signup", "recovery", "magic_link", "invite", "email_change", "reauthentication"] },
  "signnow-webhook": { name: "SignNow Webhooks", description: "Captures SignNow document events (invite sent, viewed, signed, completed) and tracks automated emails sent by SignNow", triggers: ["invite.sent", "document.viewed", "document.signed", "document.complete"] },
  "signnow": { name: "SignNow API", description: "Uploads documents and manages signing workflows via SignNow", triggers: ["document.upload", "invite.create"] },
};

const AUTH_TEMPLATES = ["signup", "recovery", "magic-link", "invite", "email-change", "reauthentication"];

export { EDGE_AUTOMATIONS, AUTH_TEMPLATES };

export default function AdminProcessFlows() {
  usePageMeta({ title: "Process Flows & Automation", noIndex: true });
  const { toast } = useToast();
  const [services, setServices] = useState<Record<string, unknown>[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<{ key: string; value: string; scope: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [propagateDialog, setPropagateDialog] = useState<{ matchCount: number; resolve: (v: boolean) => void } | null>(null);

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

  // Stats
  const totalSteps = SERVICE_FLOWS.reduce((s, f) => s + f.steps.length, 0);
  const implementedSteps = SERVICE_FLOWS.reduce((s, f) => s + f.steps.filter(st => st.implemented).length, 0);
  const automatedSteps = SERVICE_FLOWS.reduce((s, f) => s + f.steps.filter(st => st.automations && st.automations.length > 0).length, 0);
  const totalEmailTemplates = Object.keys(globalTemplates).length + services.reduce((s, svc) => s + (svc.email_templates ? Object.keys(svc.email_templates).length : 0), 0) + AUTH_TEMPLATES.length;

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    if (editingTemplate.scope === "global") {
      const matchingServices = services.filter(svc => {
        if (!svc.email_templates) return false;
        const templates = typeof svc.email_templates === "object" ? svc.email_templates : {};
        return Object.keys(templates).some(k => k === editingTemplate.key.replace("email_template_", ""));
      });

      let propagate = false;
      if (matchingServices.length > 0) {
        propagate = await new Promise<boolean>((resolve) => {
          setPropagateDialog({ matchCount: matchingServices.length, resolve });
        });
      }

      const { error } = await supabase.from("platform_settings").upsert({
        setting_key: editingTemplate.key,
        setting_value: editingTemplate.value,
      }, { onConflict: "setting_key" });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setGlobalTemplates(prev => ({ ...prev, [editingTemplate.key]: editingTemplate.value }));

        if (propagate) {
          const templateKey = editingTemplate.key.replace("email_template_", "");
          for (const svc of matchingServices) {
            const templates = typeof svc.email_templates === "object" ? { ...svc.email_templates } : {};
            templates[templateKey] = editingTemplate.value;
            await supabase.from("services").update({ email_templates: templates }).eq("id", svc.id);
          }
          toast({ title: "Template saved & propagated", description: `Updated ${matchingServices.length} service template(s).` });
        } else {
          toast({ title: "Template saved" });
        }
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
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Process Flows & Automation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">All service flows, automated steps, and email templates in one view</p>
        </div>
      </div>

      {/* Summary cards — Block Shadow style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Service Flows", value: SERVICE_FLOWS.length, color: "text-foreground" },
          { label: "Steps Implemented", value: `${implementedSteps}/${totalSteps}`, color: "text-emerald-600" },
          { label: "Automated Steps", value: automatedSteps, color: "text-primary" },
          { label: "Email Templates", value: totalEmailTemplates, color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-[24px] border-2 border-border shadow-md">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="flows" className="space-y-6">
        <TabsList className="bg-muted rounded-2xl p-1">
          <TabsTrigger value="flows" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold text-xs"><Workflow className="mr-1 h-4 w-4" /> Process Flows</TabsTrigger>
          <TabsTrigger value="emails" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold text-xs"><Mail className="mr-1 h-4 w-4" /> Email Templates</TabsTrigger>
          <TabsTrigger value="automations" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold text-xs"><Zap className="mr-1 h-4 w-4" /> Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="flows">
          <ProcessFlowsTab />
        </TabsContent>

        <TabsContent value="emails">
          <EmailTemplatesTab
            globalTemplates={globalTemplates}
            services={services}
            onEdit={(key, value, scope) => setEditingTemplate({ key, value, scope })}
          />
        </TabsContent>

        <TabsContent value="automations">
          <AutomationsTab automations={EDGE_AUTOMATIONS} />
        </TabsContent>
      </Tabs>

      {/* Edit template dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-lg rounded-[24px] border-2 border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black">
              <Mail className="h-5 w-5 text-primary" />
              Edit Template: {editingTemplate?.key.replace("email_template_", "").replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingTemplate?.value || ""}
            onChange={e => setEditingTemplate(prev => prev ? { ...prev, value: e.target.value } : null)}
            rows={10}
            className="font-mono text-xs rounded-xl border-2 border-border"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={saveTemplate} disabled={saving} className="rounded-xl font-bold bg-primary text-foreground hover:bg-primary/90 shadow-md">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propagate template confirmation */}
      <AlertDialog open={!!propagateDialog} onOpenChange={(open) => { if (!open && propagateDialog) { propagateDialog.resolve(false); setPropagateDialog(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Propagate to Services?</AlertDialogTitle>
            <AlertDialogDescription>
              {propagateDialog?.matchCount} service(s) use a matching template key. Apply this update to all of them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { propagateDialog?.resolve(false); setPropagateDialog(null); }}>No, save globally only</AlertDialogCancel>
            <AlertDialogAction onClick={() => { propagateDialog?.resolve(true); setPropagateDialog(null); }}>Yes, propagate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
