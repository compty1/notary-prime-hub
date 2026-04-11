import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/dateUtils";
import { Mail, AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminEmailHealth() {
  usePageMeta({ title: "Email Health | Admin", description: "Email deliverability and DLQ monitoring" });
  const [tab, setTab] = useState("deliverability");

  // Email send log stats
  const { data: sendLog = [] } = useQuery({
    queryKey: ["email-send-log"],
    queryFn: async () => {
      const { data } = await supabase.from("email_send_log").select("*").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  // Suppressed emails
  const { data: suppressed = [] } = useQuery({
    queryKey: ["suppressed-emails"],
    queryFn: async () => {
      const { data } = await supabase.from("suppressed_emails").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Stats
  const totalSent = sendLog.length;
  const delivered = sendLog.filter(e => e.status === "sent" || e.status === "delivered").length;
  const failed = sendLog.filter(e => e.status === "failed" || e.status === "error").length;
  const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : "0";
  const failureRate = totalSent > 0 ? ((failed / totalSent) * 100).toFixed(1) : "0";

  // Group by template
  const byTemplate = sendLog.reduce((acc: Record<string, { sent: number; failed: number }>, e) => {
    const tpl = e.template_name || "unknown";
    if (!acc[tpl]) acc[tpl] = { sent: 0, failed: 0 };
    if (e.status === "sent" || e.status === "delivered") acc[tpl].sent++;
    else if (e.status === "failed" || e.status === "error") acc[tpl].failed++;
    return acc;
  }, {});
  const templateData = Object.entries(byTemplate).map(([name, d]) => ({ name: name.replace(/_/g, " "), ...d })).sort((a, b) => (b.sent + b.failed) - (a.sent + a.failed));

  // Daily volume (last 14 days)
  const dailyVolume = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = sendLog.filter(e => e.created_at?.startsWith(dateStr)).length;
    return { day: label, emails: count };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Health Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor email deliverability and failed messages</p>
      </div>

      {/* Alert banners */}
      {Number(failureRate) > 10 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm font-medium text-destructive">Critical: Email failure rate is {failureRate}% — investigate immediately</p>
        </div>
      )}
      {Number(failureRate) > 5 && Number(failureRate) <= 10 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <p className="text-sm font-medium">Warning: Bounce rate is {failureRate}% — review failed emails</p>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4 text-center"><Mail className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">Total Sent</p><p className="text-lg font-bold">{totalSent}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-xs text-muted-foreground">Delivered</p><p className="text-lg font-bold text-success">{delivered}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="h-5 w-5 mx-auto text-destructive mb-1" /><p className="text-xs text-muted-foreground">Failed</p><p className="text-lg font-bold text-destructive">{failed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Delivery Rate</p><p className="text-lg font-bold text-success">{deliveryRate}%</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Suppressed</p><p className="text-lg font-bold">{suppressed.length}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="deliverability">Deliverability</TabsTrigger><TabsTrigger value="failed">Failed Messages</TabsTrigger><TabsTrigger value="suppressed">Suppression List</TabsTrigger></TabsList>

        <TabsContent value="deliverability" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Send Volume (14 Days)</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyVolume}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="day" className="text-xs" /><YAxis className="text-xs" /><Tooltip /><Bar dataKey="emails" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">By Template</CardTitle></CardHeader><CardContent>
              <Table><TableHeader><TableRow><TableHead>Template</TableHead><TableHead className="text-right">Sent</TableHead><TableHead className="text-right">Failed</TableHead></TableRow></TableHeader>
                <TableBody>
                  {templateData.slice(0, 10).map(t => (
                    <TableRow key={t.name}><TableCell className="text-sm capitalize">{t.name}</TableCell><TableCell className="text-right text-success">{t.sent}</TableCell><TableCell className="text-right text-destructive">{t.failed}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="failed">
          <Card><CardContent className="pt-4">
            <Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Recipient</TableHead><TableHead>Template</TableHead><TableHead>Error</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {sendLog.filter(e => e.status === "failed" || e.status === "error").slice(0, 50).map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{formatDateTime(e.created_at)}</TableCell>
                    <TableCell className="text-sm">{e.recipient_email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{e.template_name}</Badge></TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">{e.error_message || "Unknown error"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Re-enqueue via email queue not yet implemented")}><RefreshCw className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sendLog.filter(e => e.status === "failed" || e.status === "error").length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No failed emails 🎉</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="suppressed">
          <Card><CardContent className="pt-4">
            <Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Reason</TableHead><TableHead>Added</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {suppressed.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.email}</TableCell>
                    <TableCell className="text-sm">{s.reason || "Bounce"}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        await supabase.from("suppressed_emails").delete().eq("id", s.id);
                        toast.success("Removed from suppression list");
                      }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {suppressed.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No suppressed emails</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
