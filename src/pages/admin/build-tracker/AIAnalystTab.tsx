import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Bot, User, Loader2, Sparkles, ClipboardList, Search, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { TrackerItem, TrackerPlan } from "./constants";
import { PLATFORM_ENTITIES, getEntityHealth } from "./platformEntities";
import { useInsertPlan } from "./hooks";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  items: TrackerItem[];
  plans: TrackerPlan[];
};

const QUICK_PROMPTS = [
  { icon: <Search className="h-3.5 w-3.5" />, label: "Full gap analysis", prompt: "Perform a comprehensive gap analysis of the current build. Identify missing features, broken flows, compliance risks, and UX improvements. Prioritize by severity." },
  { icon: <Lightbulb className="h-3.5 w-3.5" />, label: "UX recommendations", prompt: "Analyze the platform's UX and provide specific recommendations for improving conversion rates, user engagement, and accessibility. Focus on the booking flow and client portal." },
  { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Create implementation plan", prompt: "Create a detailed implementation plan for the next development sprint. Consider current open tracker items, partially implemented features, and compliance requirements. Format as numbered steps." },
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Ohio compliance audit", prompt: "Audit the platform against Ohio ORC §147.66 requirements for Remote Online Notarization. Check KBA limits, recording consent, signer location, session timeout, vital records blocking, and journal entries. Flag any compliance gaps." },
];

export default function AIAnalystTab({ items, plans }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const insertPlan = useInsertPlan();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const buildContext = useMemo(() => {
    const open = items.filter(i => i.status === "open");
    const inProgress = items.filter(i => i.status === "in_progress");
    const entitySummary = PLATFORM_ENTITIES.map(e => {
      const h = getEntityHealth(e);
      return `- ${e.name}: ${h.healthPct}% (${h.status})`;
    }).join("\n");
    const openSummary = open.slice(0, 30).map(i => `- [${i.severity}] ${i.title} (${i.category})`).join("\n");

    return `Items: ${items.length} total, ${open.length} open, ${inProgress.length} in-progress, ${items.filter(i => i.status === "resolved").length} resolved
Plans: ${plans.length} tracked

Entity Health:
${entitySummary}

Top Open Items:
${openSummary || "None"}`;
  }, [items, plans]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-analyst`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI service error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
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
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI response");
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlan = (content: string) => {
    const lines = content.split("\n").filter(l => /^\d+[\.\)]\s/.test(l.trim()));
    if (lines.length < 2) {
      toast.error("Could not parse plan steps from the response");
      return;
    }
    const planItems = lines.map(l => ({
      title: l.replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim(),
      status: "pending" as const,
    }));
    insertPlan.mutate({
      plan_title: `AI Analysis Plan — ${new Date().toLocaleDateString()}`,
      plan_summary: content.slice(0, 300),
      plan_items: planItems,
      source: "ai_analyst",
      chat_context: messages.map(m => `${m.role}: ${m.content}`).join("\n\n").slice(0, 5000),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      <p className="text-sm text-muted-foreground mb-3">
        AI specialist in UX, development, Ohio notary compliance, marketing, and brand psychology. Ask anything about your build.
      </p>

      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {QUICK_PROMPTS.map((qp, idx) => (
            <Button key={idx} variant="outline" className="h-auto p-3 text-left justify-start gap-2" onClick={() => send(qp.prompt)}>
              {qp.icon}
              <span className="text-xs">{qp.label}</span>
            </Button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <Card className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="p-3 text-sm">
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </CardContent>
            </Card>
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <Card><CardContent className="p-3 text-sm text-muted-foreground">Analyzing...</CardContent></Card>
          </div>
        )}
      </div>

      {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !isLoading && (
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={() => savePlan(messages[messages.length - 1].content)} disabled={insertPlan.isPending}>
            <ClipboardList className="h-3.5 w-3.5 mr-1" /> Save as Plan
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Ask about UX, compliance, gaps, marketing strategy..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          className="min-h-[60px] resize-none"
          disabled={isLoading}
        />
        <Button onClick={() => send(input)} disabled={isLoading || !input.trim()} className="shrink-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
