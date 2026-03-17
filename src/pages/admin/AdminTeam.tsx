import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Shield, Clock, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";

export default function AdminTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [notaries, setNotaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    const [{ data: inviteData }, { data: roleData }] = await Promise.all([
      supabase.from("notary_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "notary" as any),
    ]);
    if (inviteData) setInvites(inviteData);
    if (roleData && roleData.length > 0) {
      const userIds = roleData.map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      setNotaries(profiles || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setSending(true);
    // Check if already invited
    const existing = invites.find((i) => i.email.toLowerCase() === inviteEmail.toLowerCase());
    if (existing) {
      toast({ title: "Already invited", description: `${inviteEmail} has already been invited.`, variant: "destructive" });
      setSending(false);
      return;
    }
    const { error } = await supabase.from("notary_invites").insert({
      email: inviteEmail.trim().toLowerCase(),
      invited_by: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invite sent", description: `${inviteEmail} will be assigned the notary role when they sign up.` });
      setInviteEmail("");
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "notary_invited",
        entity_type: "notary_invite",
        details: { email: inviteEmail },
      });
      fetchData();
    }
    setSending(false);
  };

  const revokeInvite = async (id: string) => {
    await supabase.from("notary_invites").delete().eq("id", id);
    toast({ title: "Invite revoked" });
    fetchData();
  };

  const removeNotaryRole = async (userId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "notary" as any);
    toast({ title: "Notary role removed" });
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Team & Notary Invites</h1>
        <p className="text-sm text-muted-foreground">Invite other notaries to join your platform with limited access</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-accent" /> Invite a Notary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invited notaries can view appointments, manage their own journal entries, and access resources. They cannot change platform settings, manage clients, or view revenue.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="notary@example.com"
                  onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={sendInvite} disabled={sending || !inviteEmail.trim()} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                  {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
                  Invite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Notaries */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> Active Notaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notaries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notaries have joined yet</p>
            ) : (
              <div className="space-y-3">
                {notaries.map((n) => (
                  <div key={n.user_id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{n.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{n.email || n.user_id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent/10 text-accent text-xs">
                        <Shield className="mr-1 h-3 w-3" /> Notary
                      </Badge>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeNotaryRole(n.user_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" /> Invite History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invites sent yet</p>
            ) : (
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div className="flex items-center gap-3">
                      {inv.status === "pending" ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : inv.status === "accepted" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited {new Date(inv.created_at).toLocaleDateString()}
                          {inv.accepted_at && ` • Accepted ${new Date(inv.accepted_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={inv.status === "accepted" ? "default" : "secondary"} className="text-xs">
                        {inv.status}
                      </Badge>
                      {inv.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => revokeInvite(inv.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
