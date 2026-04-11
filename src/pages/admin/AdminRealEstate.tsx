import { usePageMeta } from "@/hooks/usePageMeta";
import PageShell from "@/components/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Home } from "lucide-react";

const subtypeLabels: Record<string, string> = {
  photography: "Photography", lockbox: "Lockbox", open_house: "Open House",
  tenant_docs: "Tenant Docs", inspection: "Inspection", signing_ceremony: "Signing Ceremony",
};

export default function AdminRealEstate() {
  usePageMeta({ title: "Real Estate Services", noIndex: true });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["real-estate-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("real_estate_services").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const subtypes = ["photography", "lockbox", "open_house", "tenant_docs", "inspection", "signing_ceremony"];

  return (
    <PageShell title="Real Estate Services" description="Photography, lockbox, open house support, inspections, and more." icon={Home}>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {subtypes.map(s => <TabsTrigger key={s} value={s}>{subtypeLabels[s] || s}</TabsTrigger>)}
        </TabsList>
        {["all", ...subtypes].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Property</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead>
                  <TableHead>Fee</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(tab === "all" ? services : services.filter((s: any) => s.service_subtype === tab)).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No services found</TableCell></TableRow>
                  ) : (tab === "all" ? services : services.filter((s: any) => s.service_subtype === tab)).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.property_address}</TableCell>
                      <TableCell>{subtypeLabels[s.service_subtype] || s.service_subtype}</TableCell>
                      <TableCell>{s.scheduled_date ? format(new Date(s.scheduled_date), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>{s.fee ? `$${Number(s.fee).toFixed(2)}` : "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
