import { useState, useEffect, useCallback } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Sparkles, Loader2, Trash2, Edit, Download, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/RichTextEditor";

type Grant = {
  id: string;
  title: string;
  content: any;
  grant_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const GRANT_TYPES = [
  { value: "general", label: "General" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "education", label: "Education" },
  { value: "research", label: "Research" },
  { value: "community", label: "Community Development" },
  { value: "technology", label: "Technology" },
];

export default function GrantDashboard() {
  usePageMeta({ title: "Grant Generator", description: "Create and manage AI-assisted grant proposals for nonprofits, education, research, and community development." });
  const { user } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [title, setTitle] = useState("");
  const [grantType, setGrantType] = useState("general");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const fetchGrants = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("grants")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) toast.error("Failed to load grants");
    else setGrants((data as Grant[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGrants(); }, [fetchGrants]);

  const filtered = grants.filter((g) => {
    const matchSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || g.grant_type === filterType;
    return matchSearch && matchType;
  });

  const openEditor = (grant?: Grant) => {
    if (grant) {
      setEditingGrant(grant);
      setTitle(grant.title);
      setGrantType(grant.grant_type);
      setContent(typeof grant.content === "object" ? (grant.content as any)?.body || "" : String(grant.content || ""));
    } else {
      setEditingGrant(null);
      setTitle("");
      setGrantType("general");
      setContent("");
    }
    setEditorOpen(true);
  };

  const saveGrant = async () => {
    if (!user || !title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      grant_type: grantType,
      content: { body: content },
      status: "draft",
      updated_at: new Date().toISOString(),
    };
    try {
      if (editingGrant) {
        const { error } = await supabase.from("grants").update(payload).eq("id", editingGrant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("grants").insert(payload);
        if (error) throw error;
      }
      toast.success(editingGrant ? "Grant updated" : "Grant created");
      setEditorOpen(false);
      fetchGrants();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteGrant = async (id: string) => {
    const { error } = await supabase.from("grants").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Grant deleted"); fetchGrants(); }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) { toast.error("Enter a prompt for AI generation"); return; }
    setGenerating(true);
    try {
      const resp = await callEdgeFunctionStream("build-analyst", {
        messages: [{ role: "user", content: `Generate a professional grant proposal about: ${aiPrompt}. Include these sections: Executive Summary, Statement of Need, Project Description, Goals and Objectives, Methods, Evaluation, Budget Summary, Sustainability Plan. Write in a formal, persuasive tone appropriate for grant applications. Format with Markdown headings.` }],
        context: `Grant type: ${grantType}. Title: ${title || "Untitled"}`,
      }, 120000);
      if (!resp.ok) throw new Error("AI generation failed");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) result += c;
          } catch (e) { console.warn("Stream parse error:", e); }
        }
      }
      setContent(result);
      toast.success("Grant content generated!");
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Breadcrumbs />
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Grant Generator</h1>
            <p className="text-muted-foreground mt-2">Create and manage AI-assisted grant proposals</p>
          </div>
          <Button onClick={() => openEditor()}><Plus className="h-4 w-4 mr-1.5" /> New Grant</Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search grants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {GRANT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Grant List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No grants yet</p>
            <p className="text-sm mt-1">Create your first grant proposal to get started</p>
            <Button onClick={() => openEditor()} className="mt-4"><Plus className="h-4 w-4 mr-1.5" /> Create Grant</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((grant) => (
              <Card key={grant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground truncate">{grant.title}</h3>
                      <Badge variant="secondary" className="shrink-0">{grant.grant_type}</Badge>
                      <Badge variant={grant.status === "draft" ? "outline" : "default"} className="shrink-0">{grant.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Updated {new Date(grant.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1.5 ml-4">
                    <Button size="sm" variant="ghost" onClick={() => {
                      // PDF export via print
                      const printWindow = window.open("", "_blank");
                      if (!printWindow) return;
                      const grantContent = typeof grant.content === "string" ? grant.content : JSON.stringify(grant.content);
                      printWindow.document.write(`
                        <html><head><title>${grant.title}</title>
                        <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px;line-height:1.6}
                        h1{font-size:24px;margin-bottom:8px}h2{font-size:18px;margin-top:24px}
                        table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #ccc;padding:8px}
                        @media print{body{padding:20px}}</style></head>
                        <body><h1>${grant.title}</h1><p style="color:#666">Type: ${grant.grant_type} | Status: ${grant.status}</p><hr/>${grantContent}</body></html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }}><Download className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditor(grant)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteGrant(grant.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Editor Dialog */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingGrant ? "Edit Grant" : "New Grant"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Grant title" className="mt-1" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={grantType} onValueChange={setGrantType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{GRANT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Generation */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="font-semibold">AI Generate</Label>
                  </div>
                  <div className="flex gap-2">
                    <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe the grant purpose, target audience, and goals..." className="min-h-[60px]" />
                    <Button onClick={generateWithAI} disabled={generating} className="shrink-0">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Editor */}
              <div>
                <Label>Content</Label>
                <div className="mt-1 min-h-[300px]">
                  <RichTextEditor value={content} onChange={setContent} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
                <Button onClick={saveGrant} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
                  Save Grant
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
