import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Gift, Copy, CheckCircle2, Clock } from "lucide-react";

export default function AdminReferrals() {
  return null; // Placeholder — rendered inside client portal
}

export function ReferralPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Load referrals
    supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReferrals(data || []);
        // Get referral code from first referral or generate one
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

  // FC-2: Use resolved referral code, not loading placeholder
  const referralLink = user && referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!" });
  };

  const converted = referrals.filter((r) => r.status === "converted").length;
  const pending = referrals.filter((r) => r.status === "pending").length;

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
            <div className="text-2xl font-bold">{referrals.length}</div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
            <div className="text-2xl font-bold">{pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <div className="text-2xl font-bold">{converted}</div>
            <div className="text-xs text-muted-foreground">Converted</div>
          </CardContent>
        </Card>
      </div>

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
              onChange={(e) => setEmail(e.target.value)}
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
