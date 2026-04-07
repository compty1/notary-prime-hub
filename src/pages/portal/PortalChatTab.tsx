import React, { useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { stripHtml } from "@/lib/sanitize";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, MessageSquare, Paperclip, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  chatMessages: any[];
  chatInput: string; setChatInput: (v: string) => void;
  sendingChat: boolean;
  chatRecipient: string; setChatRecipient: (v: string) => void;
  staffUsers: { id: string; name: string; role: string }[];
  onSend: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export default function PortalChatTab({ userId, chatMessages, chatInput, setChatInput, sendingChat, chatRecipient, setChatRecipient, staffUsers, onSend, chatEndRef }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredMessages = chatMessages.filter(m => {
    if (!chatRecipient) return true;
    return m.sender_id === userId ? (!m.recipient_id || m.recipient_id === chatRecipient) : m.sender_id === chatRecipient;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `chat/${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    const { data: urlData } = await supabase.storage.from("documents").createSignedUrl(path, 86400);
    const attachmentUrl = urlData?.signedUrl || path;
    await supabase.from("chat_messages").insert({
      sender_id: userId,
      message: `📎 [${file.name}](${attachmentUrl})`,
      is_admin: false,
      recipient_id: chatRecipient || null,
      attachment_url: attachmentUrl,
    } as any);
    toast({ title: "File sent" });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-sans text-xl font-semibold">Live Chat</h2>
      <p className="text-xs text-muted-foreground">Message us for a response within 24 hours — we typically respond within 2 hours during business hours.</p>
      <Card className="border-border/50">
        <CardContent className="p-4">
          {staffUsers.length > 1 && (
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground mb-1 block">Message to:</Label>
              <Select value={chatRecipient} onValueChange={setChatRecipient}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select staff member..." /></SelectTrigger>
                <SelectContent>{staffUsers.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name || s.id.slice(0, 8)} ({s.role})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="h-80 overflow-y-auto space-y-3 mb-4" aria-live="polite" aria-label="Chat messages">
            {filteredMessages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Send a message to get started!</p>}
            {filteredMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${msg.is_admin ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline mb-1">
                      <FileText className="h-3 w-3" /> Attachment
                    </a>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0"><ReactMarkdown>{stripHtml(msg.message)}</ReactMarkdown></div>
                  <p className="mt-1 text-[10px] opacity-60">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input type="file" ref={fileRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.webp" onChange={handleFileUpload} />
            <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} title="Attach file">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="min-h-[40px] resize-none flex-1" rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
            <Button onClick={onSend} disabled={sendingChat || !chatInput.trim()}>
              {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
