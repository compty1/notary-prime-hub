import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, FileText, Languages, Search, Plus, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const VISA_TYPES = ["F-1 Student", "H-1B Work", "L-1 Intracompany", "O-1 Extraordinary", "K-1 Fiancé", "Green Card", "Naturalization", "Other"];
const DOC_CHECKLISTS: Record<string, string[]> = {
  "F-1 Student": ["I-20", "DS-160", "Passport", "Financial Docs", "SEVIS Fee Receipt", "Transcripts"],
  "H-1B Work": ["I-129", "LCA", "Passport", "Degree Certificates", "Resume/CV", "Employment Letter"],
  "Green Card": ["I-485", "I-130", "Birth Certificate", "Marriage Certificate", "Tax Returns", "Police Clearance"],
  "Naturalization": ["N-400", "Green Card Copy", "Tax Returns (5 yr)", "Travel History", "Passport Photos"],
};

export default function AdminImmigration() {
  usePageMeta({ title: "Immigration Support | Admin", noIndex: true });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: requests = [] } = useQuery({
    queryKey: ["immigration-requests"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("*")
        .ilike("service_name", "%immigration%").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = requests.filter((r: any) =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (!search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="h-6 w-6 text-primary" /> Immigration Document Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Scrivener-only document preparation assistance (no legal advice)</p>
        </div>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Active Requests</TabsTrigger>
          <TabsTrigger value="checklists">Document Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No immigration requests found</TableCell></TableRow>
                  ) : filtered.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.reference_number}</TableCell>
                      <TableCell>{r.client_id?.slice(0, 8)}</TableCell>
                      <TableCell>{r.service_name}</TableCell>
                      <TableCell><Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(DOC_CHECKLISTS).map(([visa, docs]) => (
              <Card key={visa}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> {visa}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {docs.map(d => (
                      <li key={d} className="flex items-center gap-2 text-sm"><FileText className="h-3 w-3 text-muted-foreground" /> {d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
