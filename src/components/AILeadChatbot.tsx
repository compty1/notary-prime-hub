import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, X, Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitLead } from "@/lib/submitLead";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! 👋 I'm the Notar assistant. I can help you understand our notarization services, check if your document qualifies for RON, or get you started with an appointment. What can I help you with?",
};

export function AILeadChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Check if user shared contact info for lead capture
    const emailMatch = input.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !leadCaptured) {
      await submitLead({
        email: emailMatch[0],
        source: "chatbot",
        notes: messages.map(m => `${m.role}: ${m.content}`).join("\n").slice(0, 1000),
      });
      setLeadCaptured(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke("client-assistant", {
        body: {
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        },
      });
      if (error) throw error;
      const reply = data?.choices?.[0]?.message?.content || data?.reply || "I'm sorry, I couldn't process that. Please try again or call us directly.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again or contact us directly." }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 shadow-2xl border-primary/20">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-sans text-sm font-semibold">Notar Assistant</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>

      <CardContent className="p-0">
        <div className="h-72 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about our services..."
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={send} disabled={!input.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
