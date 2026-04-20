import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Bell, Plus, Mail, Send, FileText } from "lucide-react";

export default function AdminMessagingHub() {
  usePageMeta({ title: "Notification & Messaging Hub" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [templateOpen, setTemplateOpen] = useState(false);
  const [convOpen, setConvOpen] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["notification_templates"],
    queryFn: async () => {
      const { data } = await supabase.from("notification_templates").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
      return data || [];
    },
  });

  const addTemplate = useMutation({
    mutationFn: async (form: FormData) => {
      const vars = (form.get("variables") as string).split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("notification_templates").insert({
        template_name: form.get("name") as string,
        channel: form.get("channel") as string,
        subject: form.get("subject") as string || null,
        body_template: form.get("body") as string,
        variables: vars,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notification_templates"] }); toast.success("Template created"); setTemplateOpen(false); },
    onError: () => toast.error("Failed to create template"),
  });

  const createConv = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("conversations").insert({
        subject: form.get("subject") as string,
        started_by: user!.id,
        conversation_type: form.get("type") as string,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["conversations"] }); toast.success("Conversation started"); setConvOpen(false); },
    onError: () => toast.error("Failed to start conversation"),
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("notification_templates").update({ is_active: !active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification_templates"] }),
  });

  const channelIcons: Record<string, typeof Mail> = { email: Mail, sms: MessageSquare, push: Bell, in_app: Bell };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notification & Messaging Hub</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Templates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{templates.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Templates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{templates.filter(t => t.is_active).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Conversations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{conversations.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates"><FileText className="h-3.5 w-3.5 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="conversations"><MessageSquare className="h-3.5 w-3.5 mr-1" />Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Template</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Notification Template</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addTemplate.mutate(new FormData(e.currentTarget)); }} className="space-y-3">
                <div><Label>Template Name</Label><Input name="name" required placeholder="Appointment Reminder" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Channel</Label><Select name="channel" defaultValue="email"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="push">Push</SelectItem><SelectItem value="in_app">In-App</SelectItem></SelectContent></Select></div>
                  <div><Label>Subject</Label><Input name="subject" placeholder="For email channel" /></div>
                </div>
                <div><Label>Body Template</Label><Textarea name="body" required placeholder="Hi {{name}}, your appointment is on {{date}}..." rows={4} /></div>
                <div><Label>Variables (comma-separated)</Label><Input name="variables" placeholder="name, date, time, service" /></div>
                <Button type="submit" className="w-full" disabled={addTemplate.isPending}>Create Template</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {templates.map(t => {
              const Icon = channelIcons[t.channel] || Bell;
              return (
                <Card key={t.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{t.template_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{t.channel}</Badge>
                          {t.subject && <span>{t.subject}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(t.variables as string[])?.map(v => <Badge key={v} variant="secondary" className="text-[10px]">{`{{${v}}}`}</Badge>)}
                      <Switch checked={t.is_active ?? false} onCheckedChange={() => toggleTemplate.mutate({ id: t.id, active: t.is_active ?? false })} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Dialog open={convOpen} onOpenChange={setConvOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Conversation</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start Conversation</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createConv.mutate(new FormData(e.currentTarget)); }} className="space-y-3">
                <div><Label>Subject</Label><Input name="subject" required /></div>
                <div><Label>Type</Label><Select name="type" defaultValue="internal"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internal">Internal</SelectItem><SelectItem value="client">Client</SelectItem><SelectItem value="vendor">Vendor</SelectItem></SelectContent></Select></div>
                <Button type="submit" className="w-full" disabled={createConv.isPending}>Start</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {conversations.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No conversations yet.</CardContent></Card>
            ) : conversations.map(c => (
              <Card key={c.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.conversation_type}</Badge>
                    {c.is_archived && <Badge variant="secondary">Archived</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
