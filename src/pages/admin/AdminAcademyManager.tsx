import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, BookOpen, FileQuestion, Award, Layers } from "lucide-react";
import { format } from "date-fns";

export default function AdminAcademyManager() {
  const qc = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: courses = [] } = useQuery({
    queryKey: ["admin-academy-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("e_courses").select("id, title, course_code").order("tier");
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label>Course:</Label>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>
            {courses.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.course_code} — {c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourseId && (
        <Tabs defaultValue="modules">
          <TabsList>
            <TabsTrigger value="modules" className="gap-1"><Layers className="h-3.5 w-3.5" />Modules</TabsTrigger>
            <TabsTrigger value="lessons" className="gap-1"><BookOpen className="h-3.5 w-3.5" />Lessons</TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-1"><FileQuestion className="h-3.5 w-3.5" />Quizzes</TabsTrigger>
            <TabsTrigger value="certificates" className="gap-1"><Award className="h-3.5 w-3.5" />Certificates</TabsTrigger>
          </TabsList>
          <TabsContent value="modules"><ModulesTab courseId={selectedCourseId} /></TabsContent>
          <TabsContent value="lessons"><LessonsTab courseId={selectedCourseId} /></TabsContent>
          <TabsContent value="quizzes"><QuizzesTab courseId={selectedCourseId} /></TabsContent>
          <TabsContent value="certificates"><CertificatesTab courseId={selectedCourseId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ModulesTab({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", sort_order: "1", duration_minutes: "30", is_published: true });

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["admin-modules", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("academy_modules").select("*").eq("course_id", courseId).order("sort_order");
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { course_id: courseId, title: form.title, description: form.description || null, sort_order: parseInt(form.sort_order), duration_minutes: parseInt(form.duration_minutes) || 30, is_published: form.is_published };
      if (editId) await supabase.from("academy_modules").update(payload).eq("id", editId).throwOnError();
      else await supabase.from("academy_modules").insert(payload).throwOnError();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-modules"] }); setShowDialog(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("academy_modules").delete().eq("id", id).throwOnError(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-modules"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditId(null); setForm({ title: "", description: "", sort_order: String(modules.length + 1), duration_minutes: "30", is_published: true }); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" />Add Module
        </Button>
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Title</TableHead><TableHead>Duration</TableHead><TableHead>Published</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {modules.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell>{m.sort_order}</TableCell>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{m.duration_minutes}m</TableCell>
                <TableCell><Badge variant={m.is_published ? "default" : "secondary"}>{m.is_published ? "Yes" : "No"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> { setEditId(m.id); setForm({ title: m.title, description: m.description || "", sort_order: String(m.sort_order), duration_minutes: String(m.duration_minutes), is_published: m.is_published }); setShowDialog(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> del.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Module</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} /><Label>Published</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate()} disabled={!form.title || upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonsTab({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [form, setForm] = useState({ module_id: "", title: "", content_html: "", sort_order: "1", duration_minutes: "15", is_published: true });

  const { data: modules = [] } = useQuery({
    queryKey: ["admin-modules", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("academy_modules").select("id, title, sort_order").eq("course_id", courseId).order("sort_order");
      return data || [];
    },
  });

  const activeModuleId = selectedModuleId || modules[0]?.id || "";

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["admin-lessons", activeModuleId],
    enabled: !!activeModuleId,
    queryFn: async () => {
      const { data } = await supabase.from("academy_lessons").select("*").eq("module_id", activeModuleId).order("sort_order");
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { module_id: form.module_id || activeModuleId, title: form.title, content_html: form.content_html || null, sort_order: parseInt(form.sort_order), duration_minutes: parseInt(form.duration_minutes) || 15, is_published: form.is_published, content_type: "text" as const };
      if (editId) await supabase.from("academy_lessons").update(payload).eq("id", editId).throwOnError();
      else await supabase.from("academy_lessons").insert(payload).throwOnError();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-lessons"] }); setShowDialog(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("academy_lessons").delete().eq("id", id).throwOnError(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-lessons"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={activeModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select module" /></SelectTrigger>
          <SelectContent>
            {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>M{m.sort_order}: {m.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ module_id: activeModuleId, title: "", content_html: "", sort_order: String(lessons.length + 1), duration_minutes: "15", is_published: true }); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" />Add Lesson
        </Button>
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No lessons in this module yet.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Title</TableHead><TableHead>Duration</TableHead><TableHead>Content</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {lessons.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>{l.sort_order}</TableCell>
                <TableCell className="font-medium">{l.title}</TableCell>
                <TableCell>{l.duration_minutes}m</TableCell>
                <TableCell><Badge variant={l.content_html ? "default" : "secondary"}>{l.content_html ? "Has content" : "Empty"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> { setEditId(l.id); setForm({ module_id: l.module_id, title: l.title, content_html: l.content_html || "", sort_order: String(l.sort_order), duration_minutes: String(l.duration_minutes), is_published: l.is_published }); setShowDialog(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> del.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Lesson</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
            </div>
            <div><Label>Content (HTML)</Label><Textarea value={form.content_html} onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))} rows={10} className="font-mono text-xs" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} /><Label>Published</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate()} disabled={!form.title || upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuizzesTab({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", quiz_type: "module", module_id: "", passing_score: "80", sort_order: "1", questions: "[]" });

  const { data: modules = [] } = useQuery({
    queryKey: ["admin-modules", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("academy_modules").select("id, title, sort_order").eq("course_id", courseId).order("sort_order");
      return data || [];
    },
  });

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["admin-quizzes", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("academy_quizzes").select("*, academy_modules(title)").eq("course_id", courseId).order("sort_order");
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      let parsedQ;
      try { parsedQ = JSON.parse(form.questions); } catch { throw new Error("Invalid JSON in questions"); }
      const payload = { course_id: courseId, title: form.title, quiz_type: form.quiz_type, module_id: form.module_id || null, passing_score: parseInt(form.passing_score), sort_order: parseInt(form.sort_order), questions: parsedQ };
      if (editId) await supabase.from("academy_quizzes").update(payload).eq("id", editId).throwOnError();
      else await supabase.from("academy_quizzes").insert(payload).throwOnError();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-quizzes"] }); setShowDialog(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("academy_quizzes").delete().eq("id", id).throwOnError(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-quizzes"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditId(null); setForm({ title: "", quiz_type: "module", module_id: "", passing_score: "80", sort_order: String(quizzes.length + 1), questions: "[]" }); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" />Add Quiz
        </Button>
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Module</TableHead><TableHead>Pass %</TableHead><TableHead>Questions</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {quizzes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell><Badge variant={q.quiz_type === "final" ? "default" : "outline"}>{q.quiz_type}</Badge></TableCell>
                <TableCell className="text-sm">{(q as Record<string, unknown> & { academy_modules?: { title?: string } }).academy_modules?.title || "—"}</TableCell>
                <TableCell>{q.passing_score}%</TableCell>
                <TableCell>{Array.isArray(q.questions) ? q.questions.length : 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> { setEditId(q.id); setForm({ title: q.title, quiz_type: q.quiz_type, module_id: q.module_id || "", passing_score: String(q.passing_score), sort_order: String(q.sort_order), questions: JSON.stringify(q.questions, null, 2) }); setShowDialog(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> del.mutate(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Quiz</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Type</Label>
                <Select value={form.quiz_type} onValueChange={v => setForm(f => ({ ...f, quiz_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="module">Module</SelectItem><SelectItem value="final">Final</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Module (if module quiz)</Label>
                <Select value={form.module_id} onValueChange={v => setForm(f => ({ ...f, module_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>M{m.sort_order}: {m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Pass Score %</Label><Input type="number" value={form.passing_score} onChange={e => setForm(f => ({ ...f, passing_score: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Questions (JSON)</Label>
              <p className="text-xs text-muted-foreground mb-1">Array of {`{ "question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..." }`}</p>
              <Textarea value={form.questions} onChange={e => setForm(f => ({ ...f, questions: e.target.value }))} rows={12} className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate()} disabled={!form.title || upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertificatesTab({ courseId }: { courseId: string }) {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["admin-certs", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("academy_certificates").select("*").eq("course_id", courseId).order("issued_at", { ascending: false });
      return data || [];
    },
  });

  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: async (id: string) => { await supabase.from("academy_certificates").delete().eq("id", id).throwOnError(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-certs"] }); toast({ title: "Certificate revoked" }); },
  });

  return (
    <div className="space-y-4">
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : certs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No certificates issued for this course yet.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Learner</TableHead><TableHead>Certificate #</TableHead><TableHead>Issued</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {certs.map((c) => {
              const profile = (c as Record<string, unknown> & { profiles?: { full_name?: string; email?: string } }).profiles;
              return <TableRow key={c.id}>
                <TableCell className="font-medium">{profile?.full_name || profile?.email || c.user_id.slice(0, 8)}</TableCell>
                <TableCell className="font-mono text-xs">{c.certificate_number}</TableCell>
                <TableCell className="text-sm">{format(new Date(c.issued_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Revoke this certificate?")) revoke.mutate(c.id); }}>Revoke</Button>
                </TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
