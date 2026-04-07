import { useState, useEffect, useCallback, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Sparkles, Loader2, Trash2, Edit, Search, Download, Eye, Briefcase, GraduationCap, User, Upload, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/RichTextEditor";
import { validateFile, ALLOWED_DOCUMENT_MIMES } from "@/lib/fileValidation";

type Resume = {
  id: string;
  title: string;
  template_id: string | null;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
};

type CoverLetter = {
  id: string;
  title: string;
  resume_id: string | null;
  job_title: string | null;
  company: string | null;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
};

const RESUME_TEMPLATES = [
  { id: "professional", label: "Professional", desc: "Clean and modern layout" },
  { id: "executive", label: "Executive", desc: "For senior-level positions" },
  { id: "creative", label: "Creative", desc: "Stylish and unique design" },
  { id: "minimal", label: "Minimal", desc: "Simple and focused" },
];

const DEFAULT_SECTIONS = {
  personalInfo: { name: "", email: "", phone: "", location: "", linkedin: "" },
  summary: "",
  experience: [] as { company: string; role: string; dates: string; description: string }[],
  education: [] as { institution: string; degree: string; dates: string }[],
  skills: [] as string[],
  customSections: [] as { title: string; content: string }[],
};

export default function ResumeBuilder() {
  usePageMeta({ title: "Resume Builder", description: "Create, manage, and optimize professional resumes and cover letters with AI assistance." });
  const { user } = useAuth();
  const [tab, setTab] = useState("resumes");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Editor states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<"resume" | "cover_letter">("resume");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("professional");
  const [content, setContent] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analyzeText, setAnalyzeText] = useState("");
  const [analyzeJobDesc, setAnalyzeJobDesc] = useState("");
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [r, c] = await Promise.all([
      supabase.from("resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("cover_letters").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    ]);
    setResumes((r.data as Resume[]) || []);
    setCoverLetters((c.data as CoverLetter[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEditor = (type: "resume" | "cover_letter", item?: Resume | CoverLetter) => {
    setEditorType(type);
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setContent(typeof item.content === "object" ? (item.content as any)?.body || "" : String(item.content || ""));
      if (type === "resume" && "template_id" in item) setTemplateId((item as Resume).template_id || "professional");
      if (type === "cover_letter") {
        setJobTitle((item as CoverLetter).job_title || "");
        setCompany((item as CoverLetter).company || "");
      }
    } else {
      setEditingId(null);
      setTitle("");
      setContent("");
      setTemplateId("professional");
      setJobTitle("");
      setCompany("");
    }
    setEditorOpen(true);
  };

  const save = async () => {
    if (!user || !title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (editorType === "resume") {
        const payload = { user_id: user.id, title: title.trim(), template_id: templateId, content: { body: content }, status: "draft" as const, updated_at: new Date().toISOString() };
        if (editingId) {
          const { error } = await supabase.from("resumes").update(payload).eq("id", editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("resumes").insert(payload);
          if (error) throw error;
        }
      } else {
        const payload = { user_id: user.id, title: title.trim(), job_title: jobTitle || null, company: company || null, content: { body: content }, status: "draft" as const, updated_at: new Date().toISOString() };
        if (editingId) {
          const { error } = await supabase.from("cover_letters").update(payload).eq("id", editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("cover_letters").insert(payload);
          if (error) throw error;
        }
      }
      toast.success("Saved!");
      setEditorOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (type: "resume" | "cover_letter", id: string) => {
    const table = type === "resume" ? "resumes" : "cover_letters";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchData(); }
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const prompt = editorType === "resume"
        ? `Generate a professional resume in rich text format. Include sections for Summary, Experience, Education, and Skills. Use bullet points and strong action verbs. Template style: ${templateId}. Title: ${title || "Professional Resume"}.`
        : `Generate a professional cover letter for the role of "${jobTitle || "Professional"}" at "${company || "a leading company"}". Be persuasive, professional, and concise. Include: opening hook, relevant experience highlights, enthusiasm for the role, and strong closing.`;

      const resp = await callEdgeFunctionStream("build-analyst", { messages: [{ role: "user", content: prompt }], context: `Type: ${editorType}` }, 120000);
      if (!resp.ok) throw new Error("AI generation failed");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) result += c; } catch {}
        }
      }
      setContent(result);
      toast.success("Content generated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, { allowedMimes: new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]), maxBytes: 10 * 1024 * 1024 });
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("ai-extract-document", {
        body: { document_text: text.slice(0, 50000), extractor_type: "hr" },
      });
      if (error) throw error;
      const ext = data?.extraction;
      if (ext?.results) {
        const parts: string[] = [];
        if (ext.results.candidate_name) parts.push(`<h1>${ext.results.candidate_name}</h1>`);
        if (ext.results.summary) parts.push(`<p>${ext.results.summary}</p>`);
        if (ext.results.experience?.length) {
          parts.push("<h2>Experience</h2>");
          ext.results.experience.forEach((exp: any) => parts.push(`<p><strong>${exp.title || exp.role}</strong> at ${exp.company} (${exp.dates})</p><p>${exp.key_achievements || exp.description || ""}</p>`));
        }
        if (ext.results.education?.length) {
          parts.push("<h2>Education</h2>");
          ext.results.education.forEach((edu: any) => parts.push(`<p><strong>${edu.degree}</strong> — ${edu.institution} (${edu.year || edu.dates})</p>`));
        }
        if (ext.results.skills?.length) {
          parts.push("<h2>Skills</h2><p>" + ext.results.skills.map((s: any) => typeof s === "string" ? s : s.name || s).join(", ") + "</p>");
        }
        setContent(parts.join("\n"));
        setAnalyzeText(text.slice(0, 4000));
        toast.success("Resume parsed and loaded!");
      } else {
        setAnalyzeText(text.slice(0, 4000));
        toast.info("File text extracted — paste into editor or analyze.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const analyzeResume = async () => {
    if (!analyzeText.trim()) { toast.error("Paste your resume text to analyze"); return; }
    setGenerating(true);
    try {
      const jobContext = analyzeJobDesc.trim()
        ? `\n\nScore this resume against the following job description:\n${analyzeJobDesc.slice(0, 2000)}`
        : "";
      const resp = await callEdgeFunctionStream("build-analyst", {
        messages: [{ role: "user", content: `Analyze this resume and provide a detailed score (1-100), strengths, weaknesses, and specific actionable recommendations for improvement. Format with clear headings.${jobContext}\n\nResume:\n${analyzeText.slice(0, 4000)}` }],
        context: "Resume analysis mode",
      }, 120000);
      if (!resp.ok) throw new Error("Analysis failed");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) result += c; } catch {}
        }
      }
      setAnalysisResult(result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${title || "Resume"}</title><style>body{font-family:sans-serif;padding:2rem;line-height:1.6;max-width:800px;margin:0 auto}h1,h2,h3{margin-top:1em}</style></head><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportDoc = () => {
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${content}</body></html>`], { type: "application/vnd.ms-word;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "resume"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResumes = resumes.filter((r) => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCoverLetters = coverLetters.filter((c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Breadcrumbs />
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Resume & Cover Letter Builder</h1>
            <p className="text-muted-foreground mt-2">Create, manage, and optimize your professional documents with AI assistance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAnalyzeOpen(true)}><Eye className="h-4 w-4 mr-1.5" /> Analyze</Button>
            <Button onClick={() => openEditor("resume")}><Plus className="h-4 w-4 mr-1.5" /> New Resume</Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="resumes" className="gap-1.5"><FileText className="h-4 w-4" /> Resumes ({resumes.length})</TabsTrigger>
            <TabsTrigger value="cover_letters" className="gap-1.5"><Briefcase className="h-4 w-4" /> Cover Letters ({coverLetters.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredResumes.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No resumes yet</p>
                <Button onClick={() => openEditor("resume")} className="mt-4"><Plus className="h-4 w-4 mr-1.5" /> Create Resume</Button>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {filteredResumes.map((r) => (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold truncate">{r.title}</h3>
                          <Badge variant="outline">{r.template_id || "professional"}</Badge>
                          <Badge variant={r.status === "draft" ? "secondary" : "default"}>{r.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Updated {new Date(r.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1.5 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => openEditor("resume", r)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteItem("resume", r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cover_letters" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredCoverLetters.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No cover letters yet</p>
                <Button onClick={() => openEditor("cover_letter")} className="mt-4"><Plus className="h-4 w-4 mr-1.5" /> Create Cover Letter</Button>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {filteredCoverLetters.map((c) => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold truncate">{c.title}</h3>
                          {c.company && <Badge variant="outline">{c.company}</Badge>}
                          <Badge variant={c.status === "draft" ? "secondary" : "default"}>{c.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.job_title && `${c.job_title} · `}Updated {new Date(c.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => openEditor("cover_letter", c)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteItem("cover_letter", c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Editor Dialog */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingId ? "Edit" : "New"} {editorType === "resume" ? "Resume" : "Cover Letter"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="mt-1" />
                </div>
                {editorType === "resume" ? (
                  <div>
                    <Label>Template</Label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{RESUME_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Job Title</Label><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1" /></div>
                    <div><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1" /></div>
                  </div>
                )}
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-3 flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={generateWithAI} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                    AI Generate
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
                    Upload Resume
                  </Button>
                  <span className="text-xs text-muted-foreground">Generate content or upload a PDF/DOCX to parse</span>
                </CardContent>
              </Card>

              <div>
                <Label>Content</Label>
                <div className="mt-1 min-h-[300px]">
                  <RichTextEditor value={content} onChange={setContent} />
                </div>
              </div>

              <div className="flex justify-end gap-2 flex-wrap">
                <Button variant="outline" onClick={handleExportDoc} disabled={!content}><Download className="h-4 w-4 mr-1.5" /> Export .DOC</Button>
                <Button variant="outline" onClick={handlePrint} disabled={!content}><Printer className="h-4 w-4 mr-1.5" /> Print / PDF</Button>
                <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Analyze Dialog */}
        <Dialog open={analyzeOpen} onOpenChange={setAnalyzeOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Analyze Resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resume Text</Label>
                <Textarea value={analyzeText} onChange={(e) => setAnalyzeText(e.target.value)} placeholder="Paste your resume text here for AI analysis..." className="min-h-[150px] mt-1" />
              </div>
              <div>
                <Label>Job Description <span className="text-muted-foreground font-normal">(optional — for targeted scoring)</span></Label>
                <Textarea value={analyzeJobDesc} onChange={(e) => setAnalyzeJobDesc(e.target.value)} placeholder="Paste the job description to score your resume against..." className="min-h-[100px] mt-1" />
              </div>
              <div className="flex gap-2">
                <Button onClick={analyzeResume} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                  Analyze
                </Button>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" id="analyze-upload" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try { const text = await file.text(); setAnalyzeText(text.slice(0, 4000)); toast.success("File text loaded!"); } catch { toast.error("Could not read file"); }
                  e.target.value = "";
                }} />
                <Button variant="outline" onClick={() => document.getElementById("analyze-upload")?.click()}>
                  <Upload className="h-4 w-4 mr-1.5" /> Upload File
                </Button>
              </div>
              {analysisResult && (
                <Card>
                  <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(analysisResult.replace(/\n/g, "<br/>")) }} />
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
