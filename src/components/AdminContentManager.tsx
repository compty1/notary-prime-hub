/**
 * AP-005: Admin CMS for guides/glossary content
 * Simple content management for NotaryGuide, NotaryGlossary, and Resources pages
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ContentPost {
  id: string;
  title: string;
  body: string | null;
  category: string;
  status: string;
  published_at: string | null;
  created_at: string;
}

export function AdminContentManager() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [form, setForm] = useState({ title: "", body: "", category: "guide", status: "draft" });
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => { fetchPosts(); }, [categoryFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from("content_posts").select("*").order("created_at", { ascending: false });
    if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
    const { data } = await query;
    setPosts((data as ContentPost[]) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", body: "", category: "guide", status: "draft" });
    setDialogOpen(true);
  };

  const openEdit = (post: ContentPost) => {
    setEditing(post);
    setForm({ title: post.title, body: post.body || "", category: post.category, status: post.status });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    try {
      if (editing) {
        const { error } = await supabase.from("content_posts").update({
          title: form.title,
          body: form.body,
          category: form.category,
          status: form.status,
          published_at: form.status === "published" ? new Date().toISOString() : null,
        }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_posts").insert({
          title: form.title,
          body: form.body,
          category: form.category,
          status: form.status,
          author_id: user!.id,
          published_at: form.status === "published" ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }
      toast({ title: editing ? "Content updated" : "Content created" });
      setDialogOpen(false);
      fetchPosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const togglePublish = async (post: ContentPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await supabase.from("content_posts").update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", post.id);
    fetchPosts();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Content Manager
        </CardTitle>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="guide">Guides</SelectItem>
              <SelectItem value="glossary">Glossary</SelectItem>
              <SelectItem value="resource">Resources</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell><Badge variant="outline">{post.category}</Badge></TableCell>
                <TableCell>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} aria-label="Action">
                      {post.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(post)} aria-label="Action">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Content" : "New Content"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="glossary">Glossary</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Content body..." rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
