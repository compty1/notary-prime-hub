import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Search, Users, Eye, MessageSquare, Clock,
  ArrowUpRight, ArrowDownLeft, CheckCircle, AlertCircle,
  Loader2, User, MailOpen, Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CorrespondenceItem = {
  id: string;
  client_id: string;
  direction: string;
  from_address: string | null;
  to_address: string | null;
  subject: string;
  body: string;
  status: string;
  notes: string | null;
  handled_at: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
};

type ClientProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  replied: { label: "Replied", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  archived: { label: "Archived", color: "bg-muted text-muted-foreground", icon: MailOpen },
  flagged: { label: "Flagged", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
};

export default function AdminClientEmails() {
  usePageTitle("Client Emails");
  const { user } = useAuth();
  const { toast } = useToast();

  const [correspondence, setCorrespondence] = useState<CorrespondenceItem[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<CorrespondenceItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime subscription — auto-refresh when client_correspondence changes
  useEffect(() => {
    const channel = supabase
      .channel("client-correspondence-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_correspondence" },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [corrRes, clientRes] = await Promise.all([
      supabase.from("client_correspondence").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    if (corrRes.data) setCorrespondence(corrRes.data as CorrespondenceItem[]);
    if (clientRes.data) setClients(clientRes.data);
    setLoading(false);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.user_id === clientId);
    return client?.full_name || client?.email || clientId.slice(0, 8);
  };

  const getClientEmail = (clientId: string) => {
    const client = clients.find(c => c.user_id === clientId);
    return client?.email || "";
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    if (newStatus === "replied" || newStatus === "archived") {
      updateData.handled_at = new Date().toISOString();
      updateData.handled_by = user?.id;
    }
    const { error } = await supabase.from("client_correspondence").update(updateData).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setCorrespondence(prev => prev.map(c => c.id === id ? { ...c, ...updateData } : c));
      toast({ title: `Marked as ${newStatus}` });
    }
  };

  const filtered = correspondence.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (directionFilter !== "all" && c.direction !== directionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const clientName = getClientName(c.client_id).toLowerCase();
      return (
        c.subject.toLowerCase().includes(term) ||
        clientName.includes(term) ||
        (c.from_address || "").toLowerCase().includes(term) ||
        (c.to_address || "").toLowerCase().includes(term)
      );
    }
    return true;
  });

  const stats = {
    total: correspondence.length,
    pending: correspondence.filter(c => c.status === "pending").length,
    replied: correspondence.filter(c => c.status === "replied").length,
    inbound: correspondence.filter(c => c.direction === "inbound").length,
    outbound: correspondence.filter(c => c.direction === "outbound").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Mail, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
          { label: "Replied", value: stats.replied, icon: CheckCircle, color: "text-green-500" },
          { label: "Inbound", value: stats.inbound, icon: ArrowDownLeft, color: "text-blue-500" },
          { label: "Outbound", value: stats.outbound, icon: ArrowUpRight, color: "text-violet-500" },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by client, subject, or email..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><Filter className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Correspondence List */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Client Correspondence ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[60vh]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Mail className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No correspondence found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map(item => {
                  const sc = statusConfig[item.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        item.direction === "inbound" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-violet-100 dark:bg-violet-900/30"
                      }`}>
                        {item.direction === "inbound"
                          ? <ArrowDownLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          : <ArrowUpRight className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">{item.subject}</span>
                          <Badge className={`${sc.color} text-xs shrink-0`}>{sc.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getClientName(item.client_id)}
                          </span>
                          <span>{item.from_address || item.to_address}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="font-sans">{selectedItem.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client</span>
                    <p className="font-medium text-foreground">{getClientName(selectedItem.client_id)}</p>
                    <p className="text-xs text-muted-foreground">{getClientEmail(selectedItem.client_id)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Direction</span>
                    <p className="font-medium text-foreground capitalize">{selectedItem.direction}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">From</span>
                    <p className="text-foreground">{selectedItem.from_address || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To</span>
                    <p className="text-foreground">{selectedItem.to_address || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received</span>
                    <p className="text-foreground">{new Date(selectedItem.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={`${(statusConfig[selectedItem.status] || statusConfig.pending).color} mt-1`}>
                      {(statusConfig[selectedItem.status] || statusConfig.pending).label}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Message</p>
                  <div className="rounded-md bg-muted/50 p-4 text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedItem.body }} />
                </div>

                {selectedItem.notes && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.notes}</p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  {selectedItem.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => { updateStatus(selectedItem.id, "replied"); setSelectedItem(null); }}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Mark Replied
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedItem.id, "flagged"); setSelectedItem(null); }}>
                        <AlertCircle className="mr-1 h-4 w-4" /> Flag
                      </Button>
                    </>
                  )}
                  {selectedItem.status !== "archived" && (
                    <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedItem.id, "archived"); setSelectedItem(null); }}>
                      <MailOpen className="mr-1 h-4 w-4" /> Archive
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
