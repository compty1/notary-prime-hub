import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Inbox, Mail, Archive, Forward, Eye, Download, ChevronLeft, Loader2, MailOpen, Package } from "lucide-react";
import { Logo } from "@/components/Logo";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-muted text-muted-foreground",
  forwarded: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function VirtualMailroom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  usePageMeta({ title: "Virtual Mailroom", description: "Track and manage your physical mail items — scanned documents, forwarding, and secure digital access." });

  useEffect(() => {
    if (!user) return;
    supabase.from("mailroom_items").select("*").eq("client_id", user.id).order("received_date", { ascending: false }).then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("mailroom_items").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      toast({ title: `Marked as ${newStatus}` });
    }
  };

  const downloadScan = async (item: any) => {
    if (!item.scanned_file_path) {
      toast({ title: "No scan available", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.storage.from("documents").download(item.scanned_file_path);
    if (error) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = `mail_${item.subject.replace(/\s+/g, "_")}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const newCount = items.filter(i => i.status === "new").length;

  return (
    <PageShell>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Inbox className="h-6 w-6 text-primary" />
            <h1 className="font-sans text-2xl font-bold">Your Mailroom</h1>
            {newCount > 0 && <Badge className="">{newCount} new</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">View scanned mail, forward items, and manage your correspondence.</p>
        </motion.div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="forwarded">Forwarded</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{filter === "all" ? "No mail items yet. When mail arrives at your registered address, scanned copies will appear here." : `No ${filter} items.`}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <Card key={item.id} className={`border-border/50 transition-all ${item.status === "new" ? "border-l-4 border-l-accent" : ""}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${item.status === "new" ? "bg-primary/10" : "bg-muted"}`}>
                      {item.status === "new" ? <Mail className="h-5 w-5 text-primary" /> : <MailOpen className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${item.status === "new" ? "text-foreground" : "text-muted-foreground"}`}>{item.subject}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {item.sender && <span>From: {item.sender}</span>}
                        <span>{new Date(item.received_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={statusColors[item.status] || "bg-muted"}>{item.status}</Badge>
                    {item.scanned_file_path && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => downloadScan(item)}>
                        <Download className="mr-1 h-3 w-3" /> View
                      </Button>
                    )}
                    {item.status === "new" && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(item.id, "read")}>
                        <Eye className="mr-1 h-3 w-3" /> Mark Read
                      </Button>
                    )}
                    {item.status !== "archived" && (
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => updateStatus(item.id, "archived")}>
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
