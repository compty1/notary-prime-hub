import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Home } from "lucide-react";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

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

  const renderTable = (items: any[]) => (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Property</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead>
          <TableHead>Fee</TableHead><TableHead>Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No services found</TableCell></TableRow>
          ) : items.map((s: any) => (
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
  );

  return (
    <DashboardEnhancer category="real-estate">
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Real Estate Services</h1>
          <p className="text-sm text-muted-foreground">Photography, lockbox, open house, inspections, and more.</p>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {subtypes.map(s => <TabsTrigger key={s} value={s}>{subtypeLabels[s] || s}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="all">{renderTable(services)}</TabsContent>
          {subtypes.map(tab => (
            <TabsContent key={tab} value={tab}>
              {renderTable(services.filter((s: any) => s.service_subtype === tab))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
