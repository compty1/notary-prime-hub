import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, Search, Loader2, Users, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const PARTNER_TYPES = [
  { value: "attorney", label: "Attorney / Law Firm", icon: "⚖️" },
  { value: "cpa", label: "CPA / Tax Preparer", icon: "📊" },
  { value: "realtor", label: "Real Estate Agent", icon: "🏠" },
  { value: "title_company", label: "Title Company", icon: "📋" },
  { value: "insurance", label: "Insurance Agent", icon: "🛡️" },
  { value: "translator", label: "Certified Translator", icon: "🌐" },
  { value: "mediator", label: "Mediator / ADR", icon: "🤝" },
  { value: "financial_advisor", label: "Financial Advisor", icon: "💰" },
];

export default function AdminReferralNetwork() {
  usePageMeta({ title: "Referral Network — Admin", noIndex: true });
  const [search, setSearch] = useState("");

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["referral-professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profitShares = [] } = useQuery({
    queryKey: ["profit-shares-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profit_share_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = professionals.filter((p: any) =>
    !search || p.display_name?.toLowerCase().includes(search.toLowerCase()) || p.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const totalReferralRevenue = profitShares.reduce((s: number, t: any) => s + (t.gross_amount || 0), 0);
  const totalPayouts = profitShares.reduce((s: number, t: any) => s + (t.professional_share || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Handshake className="h-6 w-6 text-primary" /> Referral Partner Network
        </h1>
        <p className="text-sm text-muted-foreground">CPA, attorney, translator & professional referral management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Partners</p><p className="text-2xl font-bold">{professionals.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Partner Types</p><p className="text-2xl font-bold text-primary">{PARTNER_TYPES.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Referral Revenue</p><p className="text-2xl font-bold text-green-600">${totalReferralRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Partner Payouts</p><p className="text-2xl font-bold">${totalPayouts.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="partners">
        <TabsList>
          <TabsTrigger value="partners" className="gap-1"><Users className="h-3.5 w-3.5" /> Partners</TabsTrigger>
          <TabsTrigger value="commissions" className="gap-1"><DollarSign className="h-3.5 w-3.5" /> Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No referral partners found. Invite professionals to join your network.</CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.display_name}</TableCell>
                      <TableCell className="text-sm">{p.specialty || "—"}</TableCell>
                      <TableCell>{p.commission_rate ? `${p.commission_rate}%` : "Default"}</TableCell>
                      <TableCell>{p.referral_count || 0}</TableCell>
                      <TableCell><Badge className={p.is_active ? "bg-green-100 text-green-800" : ""}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          {profitShares.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No commission transactions yet.</CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gross</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Partner Share</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitShares.slice(0, 20).map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">${t.gross_amount?.toFixed(2)}</TableCell>
                      <TableCell>${t.platform_fee?.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">${t.professional_share?.toFixed(2)}</TableCell>
                      <TableCell><Badge>{t.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
