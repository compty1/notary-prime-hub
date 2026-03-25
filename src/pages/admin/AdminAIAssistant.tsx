import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_STORAGE_KEY = "ai_assistant_history";

const quickQuestions = [
  "How to notarize a Power of Attorney?",
  "Who needs to be present for a will?",
  "KBA requirements for RON?",
  "Can I notarize for a family member?",
  "What oath script do I use for a jurat?",
  "Signature by mark — what's the procedure?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notary-assistant`;

export default function AdminAIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const lastSendRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist conversation
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast({ title: "Conversation cleared" });
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Rate limit: 2 seconds between messages
    const now = Date.now();
    if (now - lastSendRef.current < 2000) {
      toast({ title: "Slow down", description: "Please wait a moment before sending another message.", variant: "destructive" });
      return;
    }
    lastSendRef.current = now;

    const userMsg: Message = { role: "user", content: messageText.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast({ title: "Rate limit reached", description: "Please wait a moment and try again.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "AI credits exhausted", description: "Please add credits in workspace settings.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: errData.error || "Failed to get response", variant: "destructive" });
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("AI chat error:", err);
      toast({ title: "Connection error", description: "Failed to reach the AI assistant.", variant: "destructive" });
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">AI Notary Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask questions about Ohio notary law, procedures, and document requirements</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground">
            <Trash2 className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">How can I help?</h2>
          <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
            I'm trained on Ohio Revised Code §147 and notary best practices. Ask me anything about procedures, requirements, or compliance.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quickQuestions.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="h-auto whitespace-normal py-2 text-left text-xs"
                onClick={() => sendMessage(q)}
              >
                <Sparkles className="mr-1.5 h-3 w-3 flex-shrink-0 text-primary" />
                {q}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg bg-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about notary procedures, Ohio law, document requirements..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()} className="bg-gradient-primary text-white hover:opacity-90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
