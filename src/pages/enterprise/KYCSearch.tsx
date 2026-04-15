import React, { useState } from "react";
import { ShieldCheck, Search, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const KYCSearch = () => {
  const { user, isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.from("ofac_sdn_list").select("*").ilike("sdn_name", `%${query.trim()}%`).limit(50);
      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-ofac-data");
      if (error) throw error;
      toast.success(`Synced ${data?.synced || 0} SDN entries`);
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <EnterpriseLayout title="KYC / OFAC Search" icon={ShieldCheck} description="Screen names against US Treasury OFAC Sanctions List">
      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Enter name to screen against OFAC SDN list..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} variant="dark">
                {searching ? "Searching..." : "Screen Name"}
              </Button>
              {isAdmin && (
                <Button onClick={handleSync} disabled={syncing} variant="outline">
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Data"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && results.length === 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="flex items-center gap-4 p-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <h3 className="text-lg font-black text-green-700 dark:text-green-400">No Matches Found</h3>
                <p className="text-sm text-muted-foreground">"{query}" does not appear on the OFAC SDN list. This is a preliminary screening only.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive font-black">
                <AlertTriangle className="h-5 w-5" />
                {results.length} Potential Match{results.length > 1 ? "es" : ""} Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold text-destructive">{r.sdn_name}</TableCell>
                      <TableCell><Badge variant="outline">{r.sdn_type || "N/A"}</Badge></TableCell>
                      <TableCell className="text-sm">{r.program || "N/A"}</TableCell>
                      <TableCell className="text-sm">{r.title || "N/A"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.remarks || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </EnterpriseLayout>
  );
};

export default KYCSearch;
