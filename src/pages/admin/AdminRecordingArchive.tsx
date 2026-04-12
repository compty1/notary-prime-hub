import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Video, Search, Download, Clock, Shield, Loader2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function AdminRecordingArchive() {
  usePageMeta({ title: "Recording Archive", description: "Manage RON session recordings with 10-year retention compliance" });

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("notarization_sessions")
        .select("*")
        .not("recording_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
      setSessions(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = sessions.filter(s =>
    !search || (s.signer_name || "").toLowerCase().includes(search.toLowerCase()) || (s.session_unique_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const getRetentionYears = (createdAt: string) => {
    const created = new Date(createdAt);
    const expires = new Date(created.getTime() + 10 * 365.25 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const yearsLeft = ((expires.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(0, yearsLeft).toFixed(1);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Recording Archive</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" /> 10-Year Retention per ORC §147.66 — {sessions.length} recordings archived
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by signer name or session ID..." className="pl-10" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Session ID</TableHead><TableHead>Signer</TableHead><TableHead>Date</TableHead><TableHead>Retention</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground"><Video className="mx-auto mb-2 h-8 w-8 opacity-30" /><p>No recordings found</p></TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.session_unique_id || s.id.slice(0, 8)}</TableCell>
                  <TableCell>{s.signer_name || "Unknown"}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" /> {getRetentionYears(s.created_at)} yrs left
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.recording_url && (
                      <a href={s.recording_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
