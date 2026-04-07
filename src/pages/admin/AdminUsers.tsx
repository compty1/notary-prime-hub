import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { logAuditEvent } from "@/lib/auditLog";

type AppRole = "admin" | "notary" | "client";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminUsers() {
  usePageMeta({ title: "User Management", noIndex: true });
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async (pageNum = 0) => {
    setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("profiles").select("user_id, full_name, email, created_at", { count: "exact" }).order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    query = query.range(from, to);

    const [{ data: profileData, count, error: profileError }, { data: roleData, error: roleError }] = await Promise.all([
      query,
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (profileError || roleError) {
      toast({ title: "Failed to load users", description: profileError?.message || roleError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const nextRoles: Record<string, AppRole[]> = {};
    (roleData || []).forEach((row: any) => {
      if (!nextRoles[row.user_id]) nextRoles[row.user_id] = [];
      nextRoles[row.user_id].push(row.role as AppRole);
    });

    setProfiles((profileData || []) as ProfileRow[]);
    setRolesByUser(nextRoles);
    setTotalCount(count || 0);
    setPage(pageNum);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers(0);
  }, [isAdmin]);

  // Debounced search
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => fetchUsers(0), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const hasRole = (userId: string, role: AppRole) => (rolesByUser[userId] || []).includes(role);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const toggleRole = async (targetUserId: string, role: AppRole) => {
    if (!isAdmin) return;
    if (user?.id === targetUserId && role === "admin" && hasRole(targetUserId, "admin")) {
      toast({ title: "Action blocked", description: "You can't remove your own admin role.", variant: "destructive" });
      return;
    }

    const key = `${targetUserId}:${role}`;
    setSavingKey(key);
    const wasActive = hasRole(targetUserId, role);

    let opError: { message?: string } | null = null;
    if (wasActive) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role);
      opError = error;
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: targetUserId, role } as any);
      opError = error;
    }

    if (opError) {
      toast({ title: "Role update failed", description: opError.message, variant: "destructive" });
      setSavingKey(null);
      return;
    }

    // UM-005: Audit log role change
    try {
      logAuditEvent(wasActive ? "role_removed" : "role_assigned", {
        entityType: "user",
        entityId: targetUserId,
        details: { role, action: wasActive ? "removed" : "assigned" },
      });
    } catch { /* never block on audit */ }

    setRolesByUser((prev) => {
      const current = prev[targetUserId] || [];
      const updated = wasActive ? current.filter((r) => r !== role) : [...current, role];
      return { ...prev, [targetUserId]: updated };
    });

    toast({ title: "Role updated", description: `${role} role ${wasActive ? "removed" : "assigned"}.` });
    setSavingKey(null);
  };

  if (!isAdmin) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center text-muted-foreground">Only admins can manage user roles.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Assign or remove admin, notary, and client roles. {totalCount > 0 && `${totalCount} total users`}</p>
        </div>
        <Button variant="outline" onClick={() => fetchUsers(page)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" /> Search users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" aria-label="Search users" />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" /> Role assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            profiles.map((profile) => {
              const userRoles = rolesByUser[profile.user_id] || [];
              return (
                <div key={profile.user_id} className="rounded-lg border border-border/60 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{profile.full_name || "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground">{profile.email || profile.user_id}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length > 0 ? userRoles.map((r) => (
                        <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>
                      )) : <Badge variant="outline">No roles</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["admin", "notary", "client"] as AppRole[]).map((role) => {
                      const active = hasRole(profile.user_id, role);
                      const busy = savingKey === `${profile.user_id}:${role}`;
                      return (
                        <Button key={role} size="sm" variant={active ? "default" : "outline"} className="capitalize" onClick={() => toggleRole(profile.user_id, role)} disabled={busy}>
                          {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                          {active ? `Remove ${role}` : `Add ${role}`}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* UM-004: Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{totalCount} users total</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => fetchUsers(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => fetchUsers(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
