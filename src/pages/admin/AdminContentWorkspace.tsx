import { usePageMeta } from "@/hooks/usePageMeta";
import { sanitizeHtml } from "@/lib/sanitize";
import { useEffect, useState, useMemo } from "react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, Send, Loader2, RefreshCw, Plus, Search, Sparkles, Eye, Edit, Trash2, Image, BarChart3, Lightbulb, AlertTriangle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  archived: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const CATEGORIES = ["blog", "faq", "guide", "announcement", "case-study", "social"];

// Service-specific templates with industry-standard formatting
const SERVICE_TEMPLATES = [
  { name: "Blog Article", category: "blog", minWords: 800, maxWords: 2000, prompt: "Write a professional blog article about", structure: "H1 title, intro paragraph, 3-5 H2 sections with 2-3 paragraphs each, conclusion with CTA" },
  { name: "FAQ Page", category: "faq", minWords: 500, maxWords: 1500, prompt: "Generate 8-10 FAQ questions and detailed answers about", structure: "H2 questions with paragraph answers, include relevant Ohio law citations" },
  { name: "Service Guide", category: "guide", minWords: 1200, maxWords: 3000, prompt: "Write a comprehensive service guide for", structure: "Overview, requirements, step-by-step process, pricing info, FAQs, next steps CTA" },
  { name: "Case Study", category: "case-study", minWords: 600, maxWords: 1500, prompt: "Write a client success case study about", structure: "Challenge, solution, results with metrics, client quote, CTA" },
  { name: "Social Media Post", category: "social", minWords: 50, maxWords: 300, prompt: "Write an engaging social media post about", structure: "Hook, value proposition, CTA, 3-5 relevant hashtags" },
  { name: "Email Campaign", category: "announcement", minWords: 200, maxWords: 600, prompt: "Write a marketing email about", structure: "Subject line, preview text, greeting, 2-3 body paragraphs, CTA button text, footer" },
  { name: "SEO Landing Page", category: "guide", minWords: 1000, maxWords: 2500, prompt: "Write SEO-optimized landing page content for", structure: "H1 with keyword, intro, benefits section, features, social proof, FAQ schema, CTA" },
  { name: "Press Release", category: "announcement", minWords: 400, maxWords: 800, prompt: "Write a press release about", structure: "Headline, dateline, lead paragraph, body quotes, boilerplate, contact info" },
];

function getWordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function getReadabilityScore(html: string): { score: number; label: string } {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const avgWordsPerSentence = words / sentences;
  if (avgWordsPerSentence <= 15) return { score: 90, label: "Easy" };
  if (avgWordsPerSentence <= 20) return { score: 70, label: "Moderate" };
  if (avgWordsPerSentence <= 25) return { score: 50, label: "Difficult" };
  return { score: 30, label: "Very Difficult" };
}

function analyzeContent(html: string): { issues: string[]; suggestions: string[] } {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  const wordCount = getWordCount(html);
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (wordCount < 100) issues.push("Content is very short — aim for at least 300 words for SEO value");
  if (!html.includes("<h2") && !html.includes("<h3")) suggestions.push("Add subheadings (H2/H3) to improve readability and SEO");
  if (!html.includes("<a ")) suggestions.push("Add internal or external links for better SEO");
  if (!html.includes("<ul") && !html.includes("<ol")) suggestions.push("Use bullet/numbered lists to break up text");
  if (wordCount > 300 && !text.toLowerCase().includes("ohio") && !text.toLowerCase().includes("notary")) suggestions.push("Include relevant keywords like 'Ohio notary' for SEO");
  if (!html.includes("<strong") && !html.includes("<b")) suggestions.push("Use bold text to highlight key points");
  if (wordCount > 500 && !html.includes("<blockquote")) suggestions.push("Consider adding a client quote or callout");

  return { issues, suggestions };
}

export default function AdminContentWorkspace() {
  usePageMeta({ title: "Content Workspace", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Record<string, any>[]>([]);
  const [requests, setRequests] = useState<Record<string, any>[]>([]);
  const [services, setServices] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("posts");

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({ title: "", body: "", category: "blog", status: "draft", service_id: "", hero_image_url: "" });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const contentServices = ["Blog & Article Writing", "Social Media Content", "Email Campaign Creation", "SEO Content Optimization", "Content Creation & Copywriting"];

  const wordCount = useMemo(() => getWordCount(form.body), [form.body]);
  const readability = useMemo(() => getReadabilityScore(form.body), [form.body]);
  const contentAnalysis = useMemo(() => analyzeContent(form.body), [form.body]);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: postsData }, { data: reqData }, { data: svcData }] = await Promise.all([
        supabase.from("content_posts").select("*").order("created_at", { ascending: false }),
        supabase.from("service_requests").select("*, profiles!service_requests_client_id_fkey(full_name, email)").in("service_name", contentServices).order("created_at", { ascending: false }),
        supabase.from("services").select("id, name").eq("is_active", true).order("name"),
      ]);
      if (postsData) setPosts(postsData);
      if (reqData) setRequests(reqData);
      if (svcData) setServices(svcData);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filteredPosts = posts.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = requests.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    return true;
  });

  const openNewPost = () => {
    setEditingPost(null);
    setForm({ title: "", body: "", category: "blog", status: "draft", service_id: "", hero_image_url: "" });
    setShowEditor(true);
  };

  const openEditPost = (post: any) => {
    setEditingPost(post);
    setForm({ title: post.title, body: post.body || "", category: post.category, status: post.status, service_id: post.service_id || "", hero_image_url: post.hero_image_url || "" });
    setShowEditor(true);
  };

  const applyTemplate = (template: typeof SERVICE_TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, category: template.category, title: prev.title || `New ${template.name}` }));
    toast({ title: `${template.name} template applied`, description: `Target: ${template.minWords}-${template.maxWords} words. Structure: ${template.structure}` });
  };

  const savePost = async () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      body: form.body,
      category: form.category,
      status: form.status,
      service_id: form.service_id || null,
      hero_image_url: form.hero_image_url || null,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };

    if (editingPost) {
      const { error } = await supabase.from("content_posts").update(payload).eq("id", editingPost.id);
      if (error) { toast({ title: "Error saving", description: error.message, variant: "destructive" }); }
      else {
        toast({ title: "Post updated" });
        setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...payload } : p));
      }
    } else {
      const { data, error } = await supabase.from("content_posts").insert({ ...payload, author_id: user?.id }).select().single();
      if (error) { toast({ title: "Error creating", description: error.message, variant: "destructive" }); }
      else {
        toast({ title: "Post created" });
        setPosts(prev => [data, ...prev]);
      }
    }
    setSaving(false);
    setShowEditor(false);
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("content_posts").delete().eq("id", id);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== id));
      toast({ title: "Post deleted" });
    }
  };

  const generateAI = async (prompt: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("notary-assistant", {
        body: { message: prompt, context: "content_generation" },
      });
      if (data?.reply) {
        setForm(prev => ({ ...prev, body: prev.body + "\n\n" + data.reply }));
        toast({ title: "AI content generated" });
      }
    } catch (e) {
      toast({ title: "AI generation failed", variant: "destructive" });
    }
    setGenerating(false);
  };

  const analyzeWithAI = async () => {
    if (!form.body.trim()) { toast({ title: "No content to analyze", variant: "destructive" }); return; }
    setAnalyzing(true);
    try {
      const { data } = await supabase.functions.invoke("notary-assistant", {
        body: { message: `Analyze this content and provide specific improvement recommendations. Include SEO suggestions, readability improvements, missing elements, and enhancement opportunities. Content title: "${form.title}". Content: ${form.body.replace(/<[^>]*>/g, " ").slice(0, 3000)}`, context: "content_analysis" },
      });
      if (data?.reply) {
        toast({ title: "AI Analysis Complete", description: data.reply.slice(0, 200) + "..." });
      }
    } catch {
      toast({ title: "Analysis failed", variant: "destructive" });
    }
    setAnalyzing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `content/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      setForm(prev => ({ ...prev, hero_image_url: urlData.publicUrl }));
      toast({ title: "Image uploaded" });
    }
  };

  // Stats
  const publishedCount = posts.filter(p => p.status === "published").length;
  const draftCount = posts.filter(p => p.status === "draft").length;
  const totalWords = posts.reduce((sum, p) => sum + getWordCount(p.body || ""), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sans text-2xl font-bold">Content Workspace</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={openNewPost}><Plus className="mr-1 h-3 w-3" /> New Post</Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RefreshCw className="mr-1 h-3 w-3" /> Refresh</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{posts.length}</p>
          <p className="text-xs text-muted-foreground">Total Posts</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{publishedCount}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{draftCount}</p>
          <p className="text-xs text-muted-foreground">Drafts</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalWords.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Words</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="posts">Content Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="templates">Service Templates</TabsTrigger>
          <TabsTrigger value="requests">Service Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filteredPosts.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" /><p>No content posts yet</p><Button size="sm" className="mt-3" onClick={openNewPost}><Plus className="mr-1 h-3 w-3" /> Create First Post</Button></CardContent></Card>
          ) : filteredPosts.map(post => (
            <Card key={post.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{post.title}</span>
                    <Badge className={STATUS_COLORS[post.status] || "bg-muted text-muted-foreground"}>{post.status}</Badge>
                    <Badge variant="outline" className="text-xs">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">{getWordCount(post.body || "")} words</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                    {post.published_at && ` • Published ${new Date(post.published_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingPost(post); setShowPreview(true); }}><Eye className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditPost(post)}><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePost(post.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Service Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_TEMPLATES.map((template) => (
              <Card key={template.name} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs mb-3">{template.category}</Badge>
                  <p className="text-xs text-muted-foreground mb-2"><strong>Target:</strong> {template.minWords}–{template.maxWords} words</p>
                  <p className="text-xs text-muted-foreground mb-3"><strong>Structure:</strong> {template.structure}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { openNewPost(); applyTemplate(template); }}>
                      <Plus className="mr-1 h-3 w-3" /> Use Template
                    </Button>
                    <Button size="sm" variant="ghost" disabled={generating} onClick={() => { openNewPost(); applyTemplate(template); generateAI(`${template.prompt} Ohio notary services. Follow this structure: ${template.structure}. Target ${template.minWords}-${template.maxWords} words.`); }}>
                      <Sparkles className="mr-1 h-3 w-3" /> AI Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredRequests.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" /><p>No content requests</p></CardContent></Card>
          ) : filteredRequests.map(req => (
            <Card key={req.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{req.service_name}</span>
                    <Badge className={req.status === "completed" ? "bg-primary/10 text-primary" : req.status === "in_progress" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}>{req.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Client: {req.profiles?.full_name || "Unknown"} • {new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {req.status === "submitted" && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      await supabase.from("service_requests").update({ status: "in_progress", client_visible_status: "In Progress" }).eq("id", req.id);
                      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "in_progress" } : r));
                    }}><Clock className="mr-1 h-3 w-3" /> Start</Button>
                  )}
                  {req.status === "in_progress" && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      await supabase.from("service_requests").update({ status: "completed", client_visible_status: "Completed" }).eq("id", req.id);
                      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "completed" } : r));
                    }}><CheckCircle className="mr-1 h-3 w-3" /> Complete</Button>
                  )}
                  {req.status === "completed" && (
                    <Button size="sm" onClick={async () => {
                      await supabase.from("service_requests").update({ status: "delivered", client_visible_status: "Delivered" }).eq("id", req.id);
                      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "delivered" } : r));
                    }}><Send className="mr-1 h-3 w-3" /> Deliver</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Post title..." maxLength={200} />
                <p className="text-xs text-muted-foreground">{form.title.length}/200</p>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link to Service</Label>
                <Select value={form.service_id || "none"} onValueChange={v => setForm(p => ({ ...p, service_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hero Image</Label>
              <div className="flex gap-2 items-center">
                <Input value={form.hero_image_url} onChange={e => setForm(p => ({ ...p, hero_image_url: e.target.value }))} placeholder="Image URL..." className="flex-1" />
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span><Image className="mr-1 h-3 w-3" /> Upload</span></Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {form.hero_image_url && <img src={form.hero_image_url} alt="Hero" className="h-24 rounded border border-border object-cover" />}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={generating} onClick={() => generateAI(`Write a professional blog post about: ${form.title || "notary services in Ohio"}`)}>
                    <Sparkles className="mr-1 h-3 w-3" /> {generating ? "Generating..." : "AI Write"}
                  </Button>
                  <Button size="sm" variant="outline" disabled={generating} onClick={() => generateAI(`Generate 5 FAQ questions and answers about: ${form.title || "notary services"}`)}>
                    <Sparkles className="mr-1 h-3 w-3" /> AI FAQ
                  </Button>
                  <Button size="sm" variant="outline" disabled={analyzing} onClick={analyzeWithAI}>
                    <Lightbulb className="mr-1 h-3 w-3" /> {analyzing ? "Analyzing..." : "AI Analyze"}
                  </Button>
                </div>
              </div>
              <RichTextEditor value={form.body} onChange={(v: string) => setForm(p => ({ ...p, body: v }))} />

              {/* Content Metrics Bar */}
              <div className="flex flex-wrap items-center gap-4 mt-2 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{wordCount} words</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">Readability: <Badge variant="outline" className="text-xs ml-1">{readability.label}</Badge></span>
                </div>
                {contentAnalysis.issues.length > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-xs">{contentAnalysis.issues.length} issue{contentAnalysis.issues.length > 1 ? "s" : ""}</span>
                  </div>
                )}
                {contentAnalysis.suggestions.length > 0 && (
                  <div className="flex items-center gap-1 text-primary">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span className="text-xs">{contentAnalysis.suggestions.length} suggestion{contentAnalysis.suggestions.length > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              {/* Issues & Suggestions */}
              {(contentAnalysis.issues.length > 0 || contentAnalysis.suggestions.length > 0) && wordCount > 0 && (
                <div className="space-y-2 mt-2">
                  {contentAnalysis.issues.map((issue, i) => (
                    <div key={`i${i}`} className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded p-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                  {contentAnalysis.suggestions.map((sug, i) => (
                    <div key={`s${i}`} className="flex items-start gap-2 text-xs text-primary bg-primary/5 rounded p-2">
                      <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={savePost} disabled={saving}>{saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}{editingPost ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost?.title}</DialogTitle>
          </DialogHeader>
          {editingPost?.hero_image_url && <img src={editingPost.hero_image_url} alt="Hero" className="w-full h-48 object-cover rounded-lg" />}
          <div className="flex gap-2 mb-4">
            <Badge className={STATUS_COLORS[editingPost?.status] || "bg-muted"}>{editingPost?.status}</Badge>
            <Badge variant="outline">{editingPost?.category}</Badge>
            <span className="text-xs text-muted-foreground">{getWordCount(editingPost?.body || "")} words</span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(editingPost?.body || "<p>No content</p>") }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
