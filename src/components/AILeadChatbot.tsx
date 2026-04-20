import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, X, Loader2, Bot, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/lib/inputSanitization";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! 👋 I'm the Notar assistant. I can help you understand our notarization services, check if your document qualifies for RON, or get you started with an appointment. What can I help you with?",
};

const CAPTURE_PROMPT_THRESHOLD = 3; // show capture form after N user messages

export function AILeadChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [captureData, setCaptureData] = useState({ name: "", email: "", phone: "" });
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [lastSentAt, setLastSentAt] = useState(0);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Show capture form after threshold messages if not already captured
  useEffect(() => {
    if (userMsgCount >= CAPTURE_PROMPT_THRESHOLD && !captured && !showCapture) {
      setShowCapture(true);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'd love to help you further! Could you share your contact info so we can follow up with personalized assistance? 👇"
      }]);
    }
  }, [userMsgCount, captured, showCapture]);

  const handleCapture = async () => {
    const name = sanitizeInput(captureData.name.trim());
    const email = sanitizeInput(captureData.email.trim());
    const phone = sanitizeInput(captureData.phone.trim());

    if (!name || !email) {
      toast.error("Please provide at least your name and email.");
      return;
    }

    try {
      const { error } = await supabase.from("leads").insert({
        name,
        email,
        phone: phone || null,
        source: "chatbot",
        status: "new",
        notes: `Chatbot conversation (${userMsgCount} messages). Topics discussed: ${messages.filter(m => m.role === "user").map(m => m.content.slice(0, 50)).join("; ")}`,
      });

      if (error) throw error;

      setCaptured(true);
      setShowCapture(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Thanks, ${name}! ✅ We've saved your info and someone from our team will reach out soon. In the meantime, feel free to keep asking questions or [book an appointment](/book) directly!`
      }]);
      toast.success("Contact info saved! We'll follow up soon.");
    } catch {
      toast.error("Couldn't save your info. Please try again or call us at (614) 300-6890.");
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    // Simple rate limit: 1 message per 2 seconds
    const now = Date.now();
    if (now - lastSentAt < 2000) {
      toast.error("Please wait a moment before sending another message.");
      return;
    }
    setLastSentAt(now);

    const sanitized = sanitizeInput(input.trim()).slice(0, 500);
    const userMsg: Message = { role: "user", content: sanitized };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setUserMsgCount(prev => prev + 1);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].slice(-20).map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Failed");
      const reply = data?.choices?.[0]?.message?.content || data?.reply || "I'm sorry, I couldn't process that. Please try again or call us directly.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again or contact us directly at (614) 300-6890." }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Open chat assistant"
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

          {/* Lead capture form */}
          {showCapture && !captured && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <UserPlus className="h-3.5 w-3.5" /> Share Your Info
              </div>
              <div className="space-y-1.5">
                <div>
                  <Label className="text-[10px]">Name *</Label>
                  <Input className="h-7 text-xs" placeholder="Your full name" value={captureData.name} onChange={e => setCaptureData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-[10px]">Email *</Label>
                  <Input className="h-7 text-xs" type="email" placeholder="you@example.com" value={captureData.email} onChange={e = autoComplete="email"> setCaptureData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-[10px]">Phone</Label>
                  <Input className="h-7 text-xs" type="tel" placeholder="(614) 555-1234" value={captureData.phone} onChange={e = autoComplete="tel"> setCaptureData(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={handleCapture}>Save & Continue</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCapture(false)}>Skip</Button>
              </div>
            </div>
          )}

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
            maxLength={500}
          />
          <Button size="sm" onClick={send} disabled={!input.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
