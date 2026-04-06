import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Bot, User, Loader2, Sparkles, ClipboardList, Search, Lightbulb, RotateCcw, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { TrackerItem, TrackerPlan } from "./constants";
import { PLATFORM_ENTITIES, getEntityHealth } from "./platformEntities";
import { SERVICE_FLOWS } from "./serviceFlows";
import { useInsertPlan } from "./hooks";
import { useSSEStream, safeClipboardWrite } from "./useSSEStream";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  items: TrackerItem[];
  plans: TrackerPlan[];
};

const MAX_CHAT_HISTORY = 50;
const STORAGE_KEY = "build-tracker-ai-chat";

const QUICK_PROMPTS = [
  { icon: <Search className="h-3.5 w-3.5" />, label: "Full gap analysis", prompt: "Perform a comprehensive gap analysis of the current build. Identify missing features, broken flows, compliance risks, and UX improvements. Prioritize by severity." },
  { icon: <Lightbulb className="h-3.5 w-3.5" />, label: "UX recommendations", prompt: "Analyze the platform's UX and provide specific recommendations for improving conversion rates, user engagement, and accessibility. Focus on the booking flow and client portal." },
  { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Create implementation plan", prompt: "Create a detailed implementation plan for the next development sprint. Consider current open tracker items, partially implemented features, and compliance requirements. Format as numbered steps." },
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Ohio compliance audit", prompt: "Audit the platform against Ohio ORC §147.66 requirements for Remote Online Notarization. Check KBA limits, recording consent, signer location, session timeout, vital records blocking, and journal entries. Flag any compliance gaps." },
];

export default function AIAnalystTab({ items, plans }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      // Limit stored history
      return Array.isArray(parsed) ? parsed.slice(-MAX_CHAT_HISTORY) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const insertPlan = useInsertPlan();
  const { stream, isStreaming } = useSSEStream();

  // Persist chat to localStorage (bounded)
  useEffect(() => {
    try {
      const bounded = messages.slice(-MAX_CHAT_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
    } catch (e) { console.error("Chat history save error:", e); }
  }, [messages]);

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
    const flowSummary = SERVICE_FLOWS.map(f => {
      const impl = f.steps.filter(s => s.implemented).length;
      const issues = f.steps.flatMap(s => s.issues || []);
      return `- ${f.name}: ${impl}/${f.steps.length} steps${issues.length > 0 ? ` (${issues.length} issues)` : ""}`;
    }).join("\n");

    const ctx = `Items: ${items.length} total, ${open.length} open, ${inProgress.length} in-progress, ${items.filter(i => i.status === "resolved").length} resolved
Plans: ${plans.length} tracked

Entity Health:
${entitySummary}

Service Flow Health:
${flowSummary}

Top Open Items:
${openSummary || "None"}`;
    return ctx.slice(0, 4000);
  }, [items, plans]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      await stream(
        allMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        buildContext,
        {
          onChunk: (chunk, full) => {
            assistantSoFar = full;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: full } : m);
              }
              return [...prev, { role: "assistant", content: full }];
            });
          },
          onError: (e) => {
            setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
          },
        }
      );
    } catch {
      // Error handled by onError callback
    }
  }, [messages, isStreaming, stream, buildContext]);

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

  const exportChat = useCallback(() => {
    const md = messages.map(m => `## ${m.role === "user" ? "You" : "AI Analyst"}\n\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ai-analysis-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Chat exported as Markdown");
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          AI specialist in UX, development, Ohio notary compliance, marketing, and brand psychology.
        </p>
        {messages.length > 0 && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={exportChat}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export
            </Button>
            <Button size="sm" variant="ghost" onClick={clearChat}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>

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
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <Card><CardContent className="p-3 text-sm text-muted-foreground">Analyzing...</CardContent></Card>
          </div>
        )}
      </div>

      {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !isStreaming && (
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
          disabled={isStreaming}
        />
        <Button onClick={() => send(input)} disabled={isStreaming || !input.trim()} className="shrink-0">
          {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
