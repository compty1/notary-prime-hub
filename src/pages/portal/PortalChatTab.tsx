import React from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, MessageSquare } from "lucide-react";

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
  const filteredMessages = chatMessages.filter(m => {
    if (!chatRecipient) return true;
    return m.sender_id === userId ? (!m.recipient_id || m.recipient_id === chatRecipient) : m.sender_id === chatRecipient;
  });

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
          <div className="h-80 overflow-y-auto space-y-3 mb-4">
            {filteredMessages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Send a message to get started!</p>}
            {filteredMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${msg.is_admin ? "bg-muted text-foreground" : "bg-gradient-primary text-white"}`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0"><ReactMarkdown>{msg.message}</ReactMarkdown></div>
                  <p className="mt-1 text-[10px] opacity-60">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <Textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="min-h-[40px] resize-none" rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
            <Button onClick={onSend} disabled={sendingChat || !chatInput.trim()} className="bg-gradient-primary text-white hover:opacity-90">
              {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
