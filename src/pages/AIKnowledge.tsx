import { useState, useRef, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import ReactMarkdown from "react-markdown";
import {
  Brain, Upload, X, Send, Loader2, FileText, Sparkles, MessageSquare
} from "lucide-react";

interface Doc {
  name: string;
  text: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIKnowledge() {
  usePageTitle("AI Knowledge Base");
  const { user } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Doc[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDocText, setNewDocText] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        setDocuments(prev => [...prev, { name: file.name, text }]);
      }
    }
    if (files.length > 0) {
      toast({ title: `${files.length} document(s) added`, description: "Ready for cross-document queries." });
    }
  };

  const addManualDoc = () => {
    if (!newDocName.trim() || !newDocText.trim()) return;
    setDocuments(prev => [...prev, { name: newDocName, text: newDocText }]);
    setNewDocName("");
    setNewDocText("");
    setAddingDoc(false);
    toast({ title: "Document added" });
  };

  const removeDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuery = async () => {
    if (!query.trim() || documents.length === 0) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-cross-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ documents, query: userMsg.content }),
        }
      );

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Query failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsert = (chunk: string) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nlIdx);
          textBuffer = textBuffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      toast({ title: "Query failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      setMessages(prev => {
        if (prev[prev.length - 1]?.role === "assistant") return prev;
        return [...prev, { role: "assistant", content: "Sorry, I encountered an error processing your query." }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="container max-w-6xl py-10 space-y-8">
        <Breadcrumbs />

        <motion.div {...fadeUp}>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Cross-Document Knowledge Base</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Add multiple documents and ask questions that span across all of them. AI will synthesize answers with citations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Document Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents ({documents.length})
              </CardTitle>
              <CardDescription>Add documents to query across</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="cursor-pointer">
                <input type="file" accept=".txt,.md" multiple onChange={handleFileUpload} className="hidden" />
                <div className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" /> Upload .txt files
                </div>
              </label>

              {!addingDoc ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingDoc(true)}>
                  Paste document text
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Document name"
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    placeholder="Paste text..."
                    value={newDocText}
                    onChange={e => setNewDocText(e.target.value)}
                    className="min-h-[100px] text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addManualDoc} disabled={!newDocName.trim() || !newDocText.trim()}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingDoc(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{doc.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{(doc.text.length / 1000).toFixed(1)}k</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeDoc(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Panel */}
          <Card className="lg:col-span-2 flex flex-col min-h-[600px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Ask Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 py-12">
                    <Sparkles className="h-10 w-10 text-primary/40" />
                    <p className="text-sm max-w-sm">
                      Add documents and ask questions like: "Based on all contracts, what are the common termination clauses?"
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={documents.length === 0 ? "Add documents first..." : "Ask a question across all documents..."}
                  disabled={loading || documents.length === 0}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
                  className="flex-1"
                />
                <Button onClick={handleQuery} disabled={loading || !query.trim() || documents.length === 0} size="icon">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
