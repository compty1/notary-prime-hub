import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Truck, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageMeta } from "@/hooks/usePageMeta";

const STATUS_STEPS = ["received", "processing", "submitted_to_sos", "apostille_received", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  received: "Documents Received", processing: "Under Review", submitted_to_sos: "Submitted to OH SOS",
  apostille_received: "Apostille Received", shipped: "Shipped", delivered: "Delivered",
};

export default function TrackApostille() {
  usePageMeta({ title: "Track Apostille Request", description: "Track your apostille request status" });
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const { data, error: err } = await supabase.from("apostille_requests").select("*").or(`tracking_number.eq.${query.trim()},id.eq.${query.trim()}`).limit(1).maybeSingle();
    if (err || !data) setError("No request found. Please check your tracking number.");
    else setResult(data);
    setLoading(false);
  };

  const currentStepIndex = result ? STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <PageShell>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">Home</a>
          <span>/</span>
          <span>Track Apostille</span>
        </nav>
        <h1 className="mt-4 font-heading text-3xl font-bold">Track Your Apostille</h1>
        <p className="mb-6 text-muted-foreground">Enter your tracking number or request ID to check status.</p>

        <div className="flex gap-2">
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tracking number or request ID" onKeyDown={e => e.key === "Enter" && search()} />
          <Button onClick={search} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />} Track</Button>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {result && (
          <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center justify-between">
              <span>Request Status</span>
              <Badge>{STATUS_LABELS[result.status] || result.status}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Document</span><span>{result.document_description}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span>{result.destination_country || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{new Date(result.created_at).toLocaleDateString()}</span></div>
                {result.tracking_number && <div className="flex justify-between"><span className="text-muted-foreground">Tracking #</span><span className="font-mono">{result.tracking_number}</span></div>}
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStepIndex;
                  const Icon = i <= currentStepIndex ? CheckCircle : Clock;
                  return (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <Icon className={`h-5 w-5 ${done ? "text-green-500" : "text-muted-foreground/30"}`} />
                        {i < STATUS_STEPS.length - 1 && <div className={`h-6 w-0.5 ${done ? "bg-green-500" : "bg-muted-foreground/20"}`} />}
                      </div>
                      <span className={`text-sm ${done ? "font-medium" : "text-muted-foreground/50"}`}>{STATUS_LABELS[step]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
