import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX, Calendar, FileText, User, Building2, Loader2, ArrowLeft, Scale } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { usePageTitle } from "@/lib/usePageTitle";

interface ESealRecord {
  id: string;
  document_name: string;
  notarized_at: string;
  signer_name: string | null;
  notary_name: string;
  commissioned_state: string;
  verification_note: string | null;
  status: string;
}

export default function VerifySeal() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<ESealRecord | null>(null);
  usePageTitle("Verify E-Seal");

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("e_seal_verifications")
        .select("id, document_name, notarized_at, signer_name, notary_name, commissioned_state, verification_note, status")
        .eq("id", id)
        .eq("status", "valid")
        .maybeSingle();
      setRecord((data as ESealRecord | null) || null);
      setLoading(false);
    };
    run();
  }, [id]);

  return (
    <PageShell>
      <div className="container mx-auto max-w-2xl px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="font-sans text-2xl">E-Seal Verification</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Verifying record...</p>
              </div>
            ) : !record ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
                <ShieldX className="mx-auto mb-3 h-10 w-10 text-destructive" />
                <h2 className="mb-1 font-sans text-xl font-semibold text-foreground">Verification Not Found</h2>
                <p className="text-sm text-muted-foreground">This verification record is invalid, revoked, or does not exist.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">Verified & Active</span>
                  </div>
                  <p className="text-sm text-primary">This notarization verification record is valid and has not been revoked.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> Document</p>
                    <p className="font-medium text-sm text-foreground">{record.document_name}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Notarized On</p>
                    <p className="font-medium text-sm text-foreground">{new Date(record.notarized_at).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Signer</p>
                    <p className="font-medium text-sm text-foreground">{record.signer_name || "On file"}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Commission</p>
                    <p className="font-medium text-sm text-foreground">{record.notary_name} ({record.commissioned_state})</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Scale className="h-3 w-3" /> Ohio Compliance</p>
                  <p className="text-xs text-foreground">This notarization was performed in compliance with Ohio Revised Code §147.60-66. The notary public was duly commissioned by the State of Ohio at the time of notarization.</p>
                </div>

                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Verification ID</p>
                  <p className="font-mono text-sm text-foreground break-all">{record.id}</p>
                </div>

                {record.verification_note && (
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Verification Note</p>
                    <p className="text-sm text-foreground">{record.verification_note}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  This verification page confirms record authenticity and is for informational purposes only.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
