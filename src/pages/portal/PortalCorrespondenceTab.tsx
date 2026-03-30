import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2, ArrowLeft } from "lucide-react";

interface PortalCorrespondenceTabProps {
  userId: string;
  correspondence: any[];
  setCorrespondence: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function PortalCorrespondenceTab({ userId, correspondence, setCorrespondence }: PortalCorrespondenceTabProps) {
  const { toast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const sendReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    const parent = correspondence.find(c => c.id === parentId);
    const { data, error } = await supabase.from("client_correspondence").insert({
      client_id: userId,
      direction: "inbound",
      subject: `Re: ${parent?.subject || "Reply"}`,
      body: replyText.trim(),
      from_address: parent?.to_address,
      to_address: parent?.from_address,
      status: "pending",
    }).select().single();
    if (error) toast({ title: "Error sending reply", variant: "destructive" });
    else {
      toast({ title: "Reply sent" });
      if (data) setCorrespondence(prev => [data, ...prev]);
      setReplyingTo(null);
      setReplyText("");
    }
    setSending(false);
  };

  if (correspondence.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p>No correspondence yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {correspondence.map(c => (
        <Card key={c.id} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {c.direction === "inbound" ? <Mail className="h-4 w-4 text-primary" /> : <Send className="h-4 w-4 text-primary" />}
                <span className="text-sm font-medium">{c.subject}</span>
              </div>
              <Badge className={c.status === "replied" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>
                {c.status}
              </Badge>
            </div>
            <p className="text-sm text-foreground mb-2 line-clamp-3">{c.body}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
              {c.direction === "outbound" && (
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}>
                  <Send className="mr-1 h-3 w-3" /> Reply
                </Button>
              )}
            </div>
            {replyingTo === c.id && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." rows={3} maxLength={5000} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => sendReply(c.id)} disabled={sending || !replyText.trim()}>
                    {sending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />} Send
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
