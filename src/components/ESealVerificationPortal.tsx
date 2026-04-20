import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";

type VerifyResult = {
  found: boolean;
  status?: string;
  documentName?: string;
  notaryName?: string;
  notarizedAt?: string;
  signerName?: string;
} | null;

export function ESealVerificationPortal() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // Search by document hash or document ID
      const { data } = await supabase
        .from("e_seal_verifications")
        .select("*")
        .or(`document_hash.eq.${query.trim()},document_id.eq.${query.trim()},id.eq.${query.trim()}`)
        .maybeSingle();

      if (data) {
        setResult({
          found: true,
          status: data.status,
          documentName: data.document_name,
          notaryName: data.notary_name,
          notarizedAt: data.notarized_at,
          signerName: data.signer_name,
        });

        // Log verification attempt
        await supabase.from("audit_log").insert({
          action: "e_seal_verification_lookup",
          entity_type: "e_seal_verification",
          entity_id: data.id,
          details: { query: query.trim(), found: true },
        });
      } else {
        setResult({ found: false });
        await supabase.from("audit_log").insert({
          action: "e_seal_verification_lookup",
          entity_type: "e_seal_verification",
          details: { query: query.trim(), found: false },
        });
      }
    } catch {
      toast.error("Verification lookup failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> E-Seal Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a document hash, document ID, or verification code to verify the authenticity of a notarized document.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Document hash or verification ID"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
          />
          <Button onClick={handleVerify} disabled={!query.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {searched && result !== null && (
          <div className={`p-4 rounded-lg border ${result.found ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
            {result.found ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-semibold">Document Verified</span>
                  <Badge className="bg-success/10 text-success border-success/30">{result.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><Label className="text-xs text-muted-foreground">Document</Label><p>{result.documentName}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Notary</Label><p>{result.notaryName}</p></div>
                  {result.signerName && <div><Label className="text-xs text-muted-foreground">Signer</Label><p>{result.signerName}</p></div>}
                  {result.notarizedAt && <div><Label className="text-xs text-muted-foreground">Date</Label><p>{format(parseISO(result.notarizedAt), "MMM d, yyyy")}</p></div>}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-semibold">No Record Found</span>
                <p className="text-sm text-muted-foreground">This document could not be verified in our system.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
