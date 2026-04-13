/**
 * AP-003: Admin Notary Approval page
 * Lists pending notary pages for admin review and approval
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Search, Clock, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingNotary {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  title: string;
  professional_type: string;
  status: string;
  credentials: Record<string, any>;
  created_at: string;
  email: string;
  phone: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminNotaryApproval() {
  const [notaries, setNotaries] = useState<PendingNotary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");

  const fetchNotaries = async () => {
    setLoading(true);
    let query = supabase
      .from("notary_pages")
      .select("id, user_id, slug, display_name, title, professional_type, status, credentials, created_at, email, phone")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setNotaries((data as PendingNotary[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotaries(); }, [filter]);

  const updateStatus = async (id: string, newStatus: string, note?: string) => {
    const { error } = await supabase
      .from("notary_pages")
      .update({
        status: newStatus,
        is_published: newStatus === "active",
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    // Log to audit
    await supabase.from("audit_log").insert({
      action: `notary_${newStatus}`,
      entity_type: "notary_page",
      entity_id: id,
      details: { new_status: newStatus, note: note || null },
    });

    toast.success(`Notary page ${newStatus === "active" ? "approved" : newStatus}`);
    fetchNotaries();
  };

  const filtered = notaries.filter(n =>
    n.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    n.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notary Approval Queue</h2>
        <p className="text-muted-foreground">Review and approve professional pages before they go live</p>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="font-medium">No {filter === "all" ? "" : filter} notary pages to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(notary => (
            <Card key={notary.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{notary.display_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{notary.title || notary.professional_type}</p>
                  </div>
                  <Badge className={STATUS_COLORS[notary.status] || ""}>{notary.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" /> {notary.email || "No email"}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {new Date(notary.created_at).toLocaleDateString()}
                  </div>
                  {notary.credentials?.commission_number && (
                    <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                      <Shield className="h-3 w-3" /> Commission: {notary.credentials.commission_number}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {notary.status === "pending" && (
                    <>
                      <Button size="sm" className="flex-1 gap-1" onClick={() => updateStatus(notary.id, "active")}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1 gap-1">
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject {notary.display_name}?</DialogTitle>
                          </DialogHeader>
                          <Textarea
                            placeholder="Reason for rejection (optional)..."
                            value={rejectionNote}
                            onChange={e => setRejectionNote(e.target.value)}
                          />
                          <Button variant="destructive" onClick={() => { updateStatus(notary.id, "suspended", rejectionNote); setRejectionNote(""); }}>
                            Confirm Rejection
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  {notary.status === "active" && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus(notary.id, "suspended")}>
                      <XCircle className="h-3 w-3" /> Suspend
                    </Button>
                  )}
                  {notary.status === "suspended" && (
                    <Button size="sm" className="gap-1" onClick={() => updateStatus(notary.id, "active")}>
                      <CheckCircle className="h-3 w-3" /> Reactivate
                    </Button>
                  )}
                  <a href={`/n/${notary.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Eye className="h-3 w-3" /> Preview
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
