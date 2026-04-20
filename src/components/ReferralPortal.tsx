import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Gift, Copy, CheckCircle2, Clock, TrendingUp, Percent } from "lucide-react";

export default function AdminReferrals() {
  return null; // Placeholder — rendered inside client portal
}

export function ReferralPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Array<{ id: string; referee_email: string; created_at: string; status: string; referral_code?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReferrals(data || []);
        const code = data?.[0]?.referral_code;
        if (code) setReferralCode(code);
        setLoading(false);
      });
  }, [user]);

  const handleSubmit = async () => {
    if (!email.trim() || !user) return;
    setSubmitting(true);

    const { data, error } = await supabase.from("referrals").insert({
      referrer_id: user.id,
      referee_email: email.trim(),
    }).select().single();

    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      setReferrals((prev) => [data, ...prev]);
      setEmail("");
      toast({ title: "Referral sent!", description: `Referral created for ${email}` });
    }
    setSubmitting(false);
  };

  const referralLink = user && referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!" });
  };

  // Analytics calculations
  const converted = referrals.filter((r) => r.status === "converted").length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const conversionRate = referrals.length > 0 ? ((converted / referrals.length) * 100).toFixed(1) : "0.0";

  // Monthly trend
  const thisMonthReferrals = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return referrals.filter(r => r.created_at >= monthStart).length;
  }, [referrals]);

  const lastMonthReferrals = useMemo(() => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return referrals.filter(r => r.created_at >= lastMonthStart && r.created_at < thisMonthStart).length;
  }, [referrals]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
            <div className="text-2xl font-bold">{referrals.length}</div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-accent-foreground" />
            <div className="text-2xl font-bold">{pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="mx-auto mb-2 h-8 w-8 text-primary" />
            <div className="text-2xl font-bold">{converted}</div>
            <div className="text-xs text-muted-foreground">Converted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Percent className="mx-auto mb-2 h-8 w-8 text-primary" />
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{thisMonthReferrals} referrals</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className={`h-4 w-4 ${thisMonthReferrals >= lastMonthReferrals ? "text-primary" : "text-destructive"}`} />
              <span className={thisMonthReferrals >= lastMonthReferrals ? "text-primary" : "text-destructive"}>
                {lastMonthReferrals > 0
                  ? `${thisMonthReferrals >= lastMonthReferrals ? "+" : ""}${((thisMonthReferrals - lastMonthReferrals) / lastMonthReferrals * 100).toFixed(0)}%`
                  : thisMonthReferrals > 0 ? "New" : "—"}
              </span>
              <span className="text-muted-foreground ml-1">vs last month ({lastMonthReferrals})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Refer a Friend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode && (
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="flex-1 bg-muted text-xs" />
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Friend's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={submitting || !email.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Referral"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{ref.referee_email}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={ref.status === "converted" ? "default" : "secondary"}>
                    {ref.status === "converted" ? (
                      <><CheckCircle2 className="mr-1 h-3 w-3" /> Converted</>
                    ) : (
                      "Pending"
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
