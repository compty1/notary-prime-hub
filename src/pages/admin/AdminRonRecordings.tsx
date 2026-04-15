import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Video, Search, Download, Clock, Shield, HardDrive, Loader2 } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { formatDate } from "@/lib/utils";

export default function AdminRonRecordings() {
  usePageMeta({ title: "RON Recordings Archive", noIndex: true });
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("ron_recordings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) setRecordings(data);
        setLoading(false);
      });
  }, []);

  const filtered = recordings.filter(r =>
    r.file_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">RON Recordings Archive</h1>
          <p className="text-sm text-muted-foreground">Ohio ORC §147.63 — 10-year retention required</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" /> {recordings.length} Recordings
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search recordings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No recordings found</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(rec => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{rec.file_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(rec.duration_seconds)}</span>
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{formatFileSize(rec.file_size_bytes)}</span>
                    <span>{formatDate(rec.created_at?.split("T")[0] || "")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rec.consent_verified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Consent ✓</Badge>
                  ) : (
                    <Badge variant="destructive">No Consent</Badge>
                  )}
                  {rec.retention_expires_at && (
                    <span className="text-[10px] text-muted-foreground">
                      Retain until {new Date(rec.retention_expires_at).getFullYear()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
