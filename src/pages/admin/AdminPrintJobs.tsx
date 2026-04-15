import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, Search, FileText, Loader2, Palette, BookOpen } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const statusColors: Record<string, string> = {
  queued: "bg-yellow-100 text-yellow-800",
  printing: "bg-blue-100 text-blue-800",
  ready: "bg-emerald-100 text-emerald-800",
  picked_up: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminPrintJobs() {
  usePageMeta({ title: "Print Queue", noIndex: true });
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("print_jobs").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { if (data) setJobs(data); setLoading(false); });
  }, []);

  const filtered = jobs.filter(j =>
    j.file_name?.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "ready" || status === "picked_up") update.completed_at = new Date().toISOString();
    await supabase.from("print_jobs").update(update).eq("id", id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...update } : j));
    toast({ title: "Status updated" });
  };

  const stats = {
    queued: jobs.filter(j => j.status === "queued").length,
    printing: jobs.filter(j => j.status === "printing").length,
    ready: jobs.filter(j => j.status === "ready").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Print Queue</h1>
          <p className="text-sm text-muted-foreground">Manage print, copy, and binding jobs</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1 bg-yellow-50">{stats.queued} Queued</Badge>
          <Badge variant="outline" className="gap-1 bg-blue-50">{stats.printing} Printing</Badge>
          <Badge variant="outline" className="gap-1 bg-emerald-50">{stats.ready} Ready</Badge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No print jobs in queue</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Printer className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{job.file_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span>{job.page_count} pages × {job.copies} copies</span>
                    {job.color && <span className="flex items-center gap-1"><Palette className="h-3 w-3" />Color</span>}
                    {job.double_sided && <span>Duplex</span>}
                    {job.binding_type && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{job.binding_type}</span>}
                    {job.price && <span className="font-medium">${job.price}</span>}
                    <span className="uppercase text-[10px]">{job.paper_size}</span>
                    {job.priority === "rush" && <Badge variant="destructive" className="text-[10px] h-4">RUSH</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[job.status] || ""}>{job.status?.replace(/_/g, " ")}</Badge>
                  <Select value={job.status} onValueChange={v => updateStatus(job.id, v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
