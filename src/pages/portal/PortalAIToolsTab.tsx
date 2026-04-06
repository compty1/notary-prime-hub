import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Search, Clock, ExternalLink, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getToolById, AI_TOOLS, type ToolCategory, CATEGORY_ICONS } from "@/lib/aiToolsRegistry";

interface Generation {
  id: string;
  tool_id: string;
  fields: Record<string, string>;
  result: string;
  created_at: string;
  edited_at: string | null;
}

export default function PortalAIToolsTab() {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("tool_generations")
        .select("id, tool_id, fields, result, created_at, edited_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) {
        setGenerations(data as unknown as Generation[]);
        setUsageCount(data.length);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const categories = Object.keys(CATEGORY_ICONS) as ToolCategory[];
  const filtered = generations.filter(g => {
    if (!search) return true;
    const tool = getToolById(g.tool_id);
    const q = search.toLowerCase();
    return tool?.title.toLowerCase().includes(q) || g.tool_id.includes(q) || g.result?.toLowerCase().includes(q);
  });

  const relTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  const FREE_LIMIT = 2;
  const remaining = Math.max(0, FREE_LIMIT - usageCount);

  return (
    <div className="space-y-6">
      {/* Usage indicator */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">AI Tools Usage</p>
              <p className="text-xs text-muted-foreground">
                {usageCount} of {FREE_LIMIT} free generations used
                {remaining <= 0 && " · Upgrade for unlimited access"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {remaining <= 0 && (
              <Link to="/subscribe">
                <Button size="sm" variant="default">Upgrade Plan</Button>
              </Link>
            )}
            <Link to="/ai-tools">
              <Button size="sm" variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" /> Open AI Tools Hub
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick launch */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Quick Launch</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {AI_TOOLS.slice(0, 8).map(tool => (
            <Link key={tool.id} to={`/ai-tools?tool=${tool.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex items-center gap-2">
                  <tool.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate">{tool.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Generation History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Generation History</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search generations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {search ? "No generations match your search." : "No generations yet. Try an AI tool to get started!"}
              </p>
              {!search && (
                <Link to="/ai-tools">
                  <Button size="sm" variant="outline" className="mt-3 gap-1">
                    <Sparkles className="h-3 w-3" /> Browse AI Tools
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(gen => {
              const tool = getToolById(gen.tool_id);
              const expanded = expandedId === gen.id;
              return (
                <Card key={gen.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedId(expanded ? null : gen.id)}
                    >
                      {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      {tool && <tool.icon className="h-4 w-4 text-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tool?.title || gen.tool_id}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {gen.result?.slice(0, 100)?.replace(/[#*_]/g, "") || "[streaming]"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{tool?.category || "Tool"}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {relTime(gen.created_at)}
                        </span>
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t p-4 space-y-3">
                        <div className="prose prose-sm dark:prose-invert max-w-none max-h-[40vh] overflow-y-auto rounded-lg border p-3">
                          <ReactMarkdown>{gen.result || ""}</ReactMarkdown>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/ai-tools?tool=${gen.tool_id}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <ExternalLink className="h-3 w-3" /> Re-use Tool
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
