import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2, CheckCircle, XCircle, Search, Loader2, Users, Mail } from "lucide-react";
import { motion } from "framer-motion";

const verificationColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  verified: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminBusinessClients() {
  usePageMeta({ title: "Business Clients", noIndex: true });
  const { toast } = useToast();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Record<string, any>[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: biz }, { data: members }, { data: profiles }] = await Promise.all([
        supabase.from("business_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("business_members").select("business_id"),
        supabase.from("profiles").select("user_id, full_name, email, phone"),
      ]);
      if (biz) setBusinesses(biz);
      if (members) {
        const counts: Record<string, number> = {};
        members.forEach((m: any) => { counts[m.business_id] = (counts[m.business_id] || 0) + 1; });
        setMemberCounts(counts);
      }
      if (profiles) {
        const map: Record<string, any> = {};
        profiles.forEach((p: any) => { map[p.user_id] = p; });
        setOwnerProfiles(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateVerification = async (id: string, status: string) => {
    const { error } = await supabase.from("business_profiles").update({ verification_status: status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, verification_status: status } : b));
      toast({ title: `Business ${status}` });
      await supabase.from("audit_log").insert({
        user_id: user?.id, action: "business_verification_changed",
        entity_type: "business_profile", entity_id: id,
        details: { new_status: status },
      });
    }
  };

  const filtered = businesses.filter((b) => b.business_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-sans text-2xl font-bold">Business Clients</h1>
        <p className="text-sm text-muted-foreground">Manage business client accounts and KYC verification</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search businesses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          No business clients registered yet
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((biz) => {
            const owner = ownerProfiles[biz.created_by];
            return (
              <motion.div key={biz.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-medium">{biz.business_name}</span>
                          <Badge className={verificationColors[biz.verification_status]}>{biz.verification_status}</Badge>
                        </div>
                        {biz.ein && <p className="text-xs text-muted-foreground">EIN: {biz.ein}</p>}
                        {biz.business_type && <p className="text-xs text-muted-foreground">Type: {biz.business_type}</p>}
                        {owner && (
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            {owner.full_name && <span>Owner: {owner.full_name}</span>}
                            {owner.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{owner.email}</span>}
                            {owner.phone && <span>{owner.phone}</span>}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {memberCounts[biz.id] || 0} members</span>
                          <span>Registered: {new Date(biz.created_at).toLocaleDateString()}</span>
                        </div>
                        {biz.authorized_signers && Array.isArray(biz.authorized_signers) && biz.authorized_signers.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Authorized Signers: {(biz.authorized_signers as string[]).join(", ")}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateVerification(biz.id, "verified")}>
                          <CheckCircle className="mr-1 h-3 w-3" /> Verify
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive" onClick={() => updateVerification(biz.id, "rejected")}>
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
