import React, { useState } from "react";
import { Globe, Search, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const IPHub = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(0);

  const handleSearch = async (start = 0) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-uspto", {
        body: { query: query.trim(), start, rows: 9 },
      });
      if (error) throw error;
      setResults(data?.results || []);
      setTotal(data?.total || 0);
      setPage(start);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <EnterpriseLayout title="USPTO / IP Hub" icon={Globe} description="Search U.S. Patent and Trademark Office publications">
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search patents by keyword, assignee, or patent number..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch(0)} />
            </div>
            <Button onClick={() => handleSearch(0)} disabled={searching} variant="dark">
              {searching ? "Searching..." : "Search Patents"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {total > 0 && <p className="text-sm text-muted-foreground">{total.toLocaleString()} results found</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="shrink-0 text-xs">{r.patentNumber || "N/A"}</Badge>
                <span className="text-xs text-muted-foreground">{r.filingDate}</span>
              </div>
              <CardTitle className="text-sm font-bold leading-tight mt-2">{r.title || "Untitled"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-4">{r.abstract || "No abstract available."}</p>
              {r.assignee && <p className="text-xs"><span className="font-semibold">Assignee:</span> {r.assignee}</p>}
              {r.inventors?.length > 0 && <p className="text-xs"><span className="font-semibold">Inventors:</span> {r.inventors.slice(0, 3).join(", ")}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 9 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => handleSearch(page - 9)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page + 9 >= total} onClick={() => handleSearch(page + 9)}>Next</Button>
        </div>
      )}
    </EnterpriseLayout>
  );
};

export default IPHub;
