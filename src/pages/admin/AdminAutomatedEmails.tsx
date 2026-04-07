import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2, Save, Wand2, Mail, MailCheck, Clock, CheckCircle2,
  RefreshCw, Eye, ChevronDown,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/* ── types ── */
interface EmailTemplate {
  enabled: boolean;
  subject: string;
  body: string;
}

interface ServiceEmailTemplates {
  booking_confirmation: EmailTemplate;
  reminder: EmailTemplate;
  follow_up: EmailTemplate;
  completion: EmailTemplate;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  email_templates: ServiceEmailTemplates | null;
}

const TEMPLATE_KEYS: { key: keyof ServiceEmailTemplates; label: string; icon: React.ElementType }[] = [
  { key: "booking_confirmation", label: "Booking Confirmation", icon: MailCheck },
  { key: "reminder", label: "Appointment Reminder", icon: Clock },
  { key: "follow_up", label: "Follow-Up", icon: Mail },
  { key: "completion", label: "Completion / Thank You", icon: CheckCircle2 },
];

const DEFAULT_TEMPLATE: EmailTemplate = {
  enabled: false,
  subject: "",
  body: "",
};

function defaultTemplates(): ServiceEmailTemplates {
  return {
    booking_confirmation: { ...DEFAULT_TEMPLATE },
    reminder: { ...DEFAULT_TEMPLATE },
    follow_up: { ...DEFAULT_TEMPLATE },
    completion: { ...DEFAULT_TEMPLATE },
  };
}

/* ── component ── */
export default function AdminAutomatedEmails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, category, is_active, email_templates")
      .order("display_order");
    if (error) {
      toast({ title: "Error loading services", description: error.message, variant: "destructive" });
    } else {
      setServices(
        (data || []).map((s: any) => ({
          ...s,
          email_templates: s.email_templates && Object.keys(s.email_templates).length > 0
            ? s.email_templates
            : null,
        }))
      );
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  /* ── helpers ── */
  const getTemplates = (s: ServiceRow): ServiceEmailTemplates =>
    s.email_templates ?? defaultTemplates();

  const updateLocal = (id: string, templates: ServiceEmailTemplates) => {
    setServices(prev =>
      prev.map(s => (s.id === id ? { ...s, email_templates: templates } : s))
    );
  };

  const saveService = async (id: string, templates: ServiceEmailTemplates) => {
    setSaving(prev => new Set(prev).add(id));
    const { error } = await supabase
      .from("services")
      .update({ email_templates: templates as any })
      .eq("id", id);
    setSaving(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Email templates updated." });
    }
  };

  const toggleTemplateEnabled = (serviceId: string, key: keyof ServiceEmailTemplates, value: boolean) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const t = { ...getTemplates(svc), [key]: { ...getTemplates(svc)[key], enabled: value } };
    updateLocal(serviceId, t);
  };

  const updateTemplateField = (serviceId: string, key: keyof ServiceEmailTemplates, field: "subject" | "body", value: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const t = { ...getTemplates(svc), [key]: { ...getTemplates(svc)[key], [field]: value } };
    updateLocal(serviceId, t);
  };

  /* ── AI generation ── */
  const generateForService = async (serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    setGenerating(prev => new Set(prev).add(serviceId));

    try {
      const { data, error } = await supabase.functions.invoke("notary-assistant", {
        body: {
          prompt: `Generate 4 professional email templates for the notary service "${svc.name}" (category: ${svc.category}). 
Return a JSON object with these keys: booking_confirmation, reminder, follow_up, completion. 
Each should have "subject" (string) and "body" (HTML string with <p>, <strong>, <br> tags).
The emails should be professional, branded for NotarDex, and relevant to the service.
For booking_confirmation: confirm the appointment.
For reminder: remind 24h before.
For follow_up: ask for feedback after completion.
For completion: thank them and mention related services.
Return ONLY the JSON object, no markdown fences.`,
        },
      });

      if (error) throw error;

      const text = typeof data === "string" ? data : data?.text || data?.response || JSON.stringify(data);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");

      const parsed = JSON.parse(jsonMatch[0]);
      const templates = getTemplates(svc);

      for (const tk of TEMPLATE_KEYS) {
        if (parsed[tk.key]) {
          templates[tk.key] = {
            enabled: true,
            subject: parsed[tk.key].subject || templates[tk.key].subject,
            body: sanitizeHtml(parsed[tk.key].body || templates[tk.key].body),
          };
        }
      }

      updateLocal(serviceId, templates);
      toast({ title: "Templates generated", description: `AI templates ready for "${svc.name}". Review and save.` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }

    setGenerating(prev => { const n = new Set(prev); n.delete(serviceId); return n; });
  };

  /* ── bulk actions ── */
  const toggleSelectAll = () => {
    if (selected.size === services.length) setSelected(new Set());
    else setSelected(new Set(services.map(s => s.id)));
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkEnable = async (enable: boolean) => {
    for (const id of selected) {
      const svc = services.find(s => s.id === id);
      if (!svc) continue;
      const t = getTemplates(svc);
      for (const tk of TEMPLATE_KEYS) t[tk.key].enabled = enable;
      updateLocal(id, t);
      await saveService(id, t);
    }
    toast({ title: enable ? "All enabled" : "All disabled" });
  };

  const bulkGenerate = async () => {
    setBulkGenerating(true);
    for (const id of selected) {
      await generateForService(id);
    }
    setBulkGenerating(false);
    toast({ title: "Bulk generation complete" });
  };

  const bulkReset = async () => {
    for (const id of selected) {
      const t = defaultTemplates();
      updateLocal(id, t);
      await saveService(id, t);
    }
    toast({ title: "Templates reset to defaults" });
  };

  /* ── preview ── */
  const openPreview = (html: string, subject: string) => {
    setPreviewHtml(`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="margin-bottom:8px;">Subject: ${subject}</h2><hr style="margin-bottom:16px;"/>${html}</div>`);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 p-3">
            <span className="text-sm font-medium">{selected.size} service{selected.size > 1 ? "s" : ""} selected</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkEnable(true)}>
                <MailCheck className="mr-1 h-3 w-3" /> Enable All Emails
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkEnable(false)}>
                Disable All Emails
              </Button>
              <Button size="sm" variant="outline" onClick={bulkGenerate} disabled={bulkGenerating}>
                {bulkGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                Generate All with AI
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={bulkReset}>
                <RefreshCw className="mr-1 h-3 w-3" /> Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Row */}
      <div className="flex items-center gap-3 px-1">
        <Checkbox
          checked={selected.size === services.length && services.length > 0}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all services"
        />
        <span className="text-sm text-muted-foreground">
          {services.length} service{services.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Service List */}
      {services.map(svc => {
        const templates = getTemplates(svc);
        const enabledCount = TEMPLATE_KEYS.filter(tk => templates[tk.key].enabled).length;

        return (
          <Card key={svc.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selected.has(svc.id)}
                  onCheckedChange={() => toggleSelect(svc.id)}
                  aria-label={`Select ${svc.name}`}
                />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {svc.name}
                    <Badge variant="outline" className="text-xs capitalize">
                      {svc.category.replace(/_/g, " ")}
                    </Badge>
                    {!svc.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {enabledCount}/{TEMPLATE_KEYS.length} email types enabled
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateForService(svc.id)}
                    disabled={generating.has(svc.id)}
                  >
                    {generating.has(svc.id)
                      ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      : <Wand2 className="mr-1 h-3 w-3" />}
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveService(svc.id, templates)}
                    disabled={saving.has(svc.id)}
                  >
                    {saving.has(svc.id)
                      ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      : <Save className="mr-1 h-3 w-3" />}
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {TEMPLATE_KEYS.map(({ key, label, icon: Icon }) => {
                  const tpl = templates[key];
                  return (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger className="py-2 text-sm hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{label}</span>
                          {tpl.enabled ? (
                            <Badge className="bg-primary/10 text-primary text-[10px]">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Off</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tpl.enabled}
                              onCheckedChange={v => toggleTemplateEnabled(svc.id, key, v)}
                            />
                            <Label className="text-sm">
                              {tpl.enabled ? "Enabled" : "Disabled"}
                            </Label>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Subject Line</Label>
                            <input
                              type="text"
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                              value={tpl.subject}
                              onChange={e => updateTemplateField(svc.id, key, "subject", e.target.value)}
                              placeholder={`e.g. Your ${svc.name} appointment is confirmed`}
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Email Body</Label>
                            <RichTextEditor
                              value={tpl.body}
                              onChange={v => updateTemplateField(svc.id, key, "body", v)}
                              placeholder="Compose your email template..."
                              minHeight="120px"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreview(tpl.body, tpl.subject)}
                              disabled={!tpl.body}
                            >
                              <Eye className="mr-1 h-3 w-3" /> Preview
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {services.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            No services found. Add services in the Services management page first.
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-white text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
