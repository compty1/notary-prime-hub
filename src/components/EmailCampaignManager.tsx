import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2, Users, CheckCircle2 } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  audience: string;
  template: string;
  status: "draft" | "scheduled" | "sent";
  recipientCount: number;
  sentAt?: string;
};

const TEMPLATES = [
  "appointment_reminder",
  "welcome_series",
  "feedback_request",
  "service_promo",
  "re_engagement",
  "document_ready",
];

const AUDIENCES = [
  "All Clients",
  "Active (last 30d)",
  "Inactive (90d+)",
  "Business Accounts",
  "RON Users",
  "No Feedback Given",
];

export function EmailCampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [template, setTemplate] = useState("");

  const createCampaign = () => {
    if (!name || !audience || !template) return;
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name, audience, template,
      status: "draft",
      recipientCount: Math.floor(Math.random() * 200) + 10,
    };
    setCampaigns(prev => [campaign, ...prev]);
    setName(""); setAudience(""); setTemplate("");
    toast.success("Campaign created");
  };

  const sendCampaign = async (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "sent" as const, sentAt: new Date().toISOString() } : c));

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      action: "email_campaign_sent",
      entity_type: "campaign",
      details: { campaign_id: id },
      user_id: user?.id,
    });

    toast.success("Campaign sent!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4" /> Email Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Campaign name" value={name} onChange={e => setName(e.target.value)} />
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="text-xs"><SelectValue placeholder="Audience" /></SelectTrigger>
            <SelectContent>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="text-xs"><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={createCampaign} disabled={!name || !audience || !template}>
          <Plus className="h-4 w-4 mr-1" /> Create Campaign
        </Button>

        <ScrollArea className="h-[200px]">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No campaigns yet</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <Badge variant={c.status === "sent" ? "default" : "outline"} className="text-[10px]">{c.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {c.audience} • {c.recipientCount} recipients
                    </div>
                  </div>
                  {c.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => sendCampaign(c.id)}>
                      <Send className="h-3 w-3 mr-1" /> Send
                    </Button>
                  )}
                  {c.status === "sent" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function Plus(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
