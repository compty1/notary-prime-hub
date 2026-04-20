import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent } from "@/components/ui/card";
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
import { GraduationCap, Plus, Search, Edit, Trash2, Loader2, Users, BookOpen, DollarSign, Star, Layers } from "lucide-react";

const AdminAcademyManager = lazy(() => import("./AdminAcademyManager"));
import { format } from "date-fns";

const CATEGORIES = ["notary_fundamentals", "ron_certification", "loan_signing", "ohio_compliance", "business_skills", "technology", "legal_basics", "general"];

interface CourseForm {
  title: string; description: string; category: string; instructor_name: string;
  duration_minutes: string; price: string; is_free: boolean; is_published: boolean; slug: string;
}

const EMPTY: CourseForm = {
  title: "", description: "", category: "general", instructor_name: "",
  duration_minutes: "60", price: "0", is_free: false, is_published: false, slug: "",
};

export default function AdminECourses() {
  usePageMeta({ title: "E-Courses | Admin", noIndex: true });
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["e-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("e_courses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["e-course-enrollments-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("e_course_enrollments").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (vals: CourseForm) => {
      const payload: any = {
        title: vals.title, description: vals.description || null, category: vals.category,
        instructor_name: vals.instructor_name || null,
        duration_minutes: parseInt(vals.duration_minutes) || 60,
        price: parseFloat(vals.price) || 0,
        is_free: vals.is_free, is_published: vals.is_published,
        slug: vals.slug || vals.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      };
      if (editId) { const { error } = await supabase.from("e_courses").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("e_courses").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["e-courses"] }); toast({ title: editId ? "Course updated" : "Course created" }); setShowDialog(false); setEditId(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("e_courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["e-courses"] }); toast({ title: "Course deleted" }); },
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      title: c.title, description: c.description || "", category: c.category,
      instructor_name: c.instructor_name || "", duration_minutes: c.duration_minutes?.toString() || "60",
      price: c.price?.toString() || "0", is_free: c.is_free, is_published: c.is_published, slug: c.slug || "",
    });
    setShowDialog(true);
  };

  const filtered = courses.filter((c: any) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6 text-primary" /> E-Courses Management</h1>
          <p className="text-sm text-muted-foreground">Create, manage, and track online training courses</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm(EMPTY); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" /> New Course</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><BookOpen className="h-5 w-5 text-primary mb-1" /><p className="text-2xl font-bold">{courses.length}</p><p className="text-xs text-muted-foreground">Total Courses</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Star className="h-5 w-5 text-amber-500 mb-1" /><p className="text-2xl font-bold">{courses.filter((c: any) => c.is_published).length}</p><p className="text-xs text-muted-foreground">Published</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Users className="h-5 w-5 text-blue-600 mb-1" /><p className="text-2xl font-bold">{totalEnrollments}</p><p className="text-xs text-muted-foreground">Enrollments</p></CardContent></Card>
        <Card><CardContent className="pt-4"><GraduationCap className="h-5 w-5 text-green-600 mb-1" /><p className="text-2xl font-bold">{completedEnrollments}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="academy" className="gap-1"><Layers className="h-3.5 w-3.5" />Academy Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card><CardContent className="p-0">
            {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">No courses found</div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Course</TableHead><TableHead>Category</TableHead><TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.title}</p>
                        {c.instructor_name && <p className="text-xs text-muted-foreground">by {c.instructor_name}</p>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{c.category.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-sm">{c.duration_minutes}m</TableCell>
                      <TableCell>{c.is_free ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Free</Badge> : `$${c.price}`}</TableCell>
                      <TableCell><Badge variant={c.is_published ? "default" : "secondary"}>{c.is_published ? "Published" : "Draft"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> openEdit(c)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card><CardContent className="p-0">
            {enrollments.length === 0 ? <div className="text-center py-12 text-muted-foreground">No enrollments yet</div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>User</TableHead><TableHead>Course</TableHead><TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead><TableHead>Enrolled</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {enrollments.slice(0, 50).map((e: any) => {
                    const course = courses.find((c: any) => c.id === e.course_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.user_id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{course?.title || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress_percent}%` }} />
                            </div>
                            <span className="text-xs">{e.progress_percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={e.status === "completed" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                        <TableCell className="text-xs">{format(new Date(e.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="academy">
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <AdminAcademyManager />
          </Suspense>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Create"} Course</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated if empty" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Instructor</Label><Input value={form.instructor_name} onChange={e => setForm(f => ({ ...f, instructor_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
              <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={v => setForm(f => ({ ...f, is_free: v }))} /><Label>Free Course</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} /><Label>Published</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertMutation.mutate(form)} disabled={upsertMutation.isPending || !form.title}>{upsertMutation.isPending ? "Saving..." : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
