import React, { useState } from "react";
import { Building2, Search, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const CorporateCompliance = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-corporate", { body: { query: query.trim() } });
      if (error) throw error;
      setResults(data?.companies || []);
    } catch (err: any) { toast.error(err.message || "Search failed"); } finally { setSearching(false); }
  };

  return (
    <EnterpriseLayout title="Corporate Compliance / BOI" icon={Building2} description="Search corporate entities and generate Beneficial Ownership reports">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search company name..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              </div>
              <Button onClick={handleSearch} disabled={searching} variant="dark">{searching ? "Searching..." : "Search"}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-sm">{c.name}</h3>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{c.jurisdiction?.toUpperCase()}</Badge>
                  <Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status || "Unknown"}</Badge>
                </div>
                {c.incorporation_date && <p className="text-xs text-muted-foreground">Inc: {c.incorporation_date}</p>}
                {c.registered_address && <p className="text-xs text-muted-foreground">{c.registered_address}</p>}
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setSelectedCompany(c); setShowDocModal(true); }}>
                  <FileText className="mr-1 h-3 w-3" />Generate BOI Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedCompany && (
        <DocumentGeneratorModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} templateId="boi_report"
          data={{ company_name: selectedCompany.name || "", jurisdiction: selectedCompany.jurisdiction || "", ein: "", formation_date: selectedCompany.incorporation_date || "", beneficial_owners_html: "<p><em>Enter beneficial owner information manually.</em></p>", date: new Date().toLocaleDateString() }} />
      )}
    </EnterpriseLayout>
  );
};

export default CorporateCompliance;
