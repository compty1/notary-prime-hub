import React, { useState } from "react";
import { FolderOpen, Shield, Download, Copy, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const DigitalVault = () => {
  const { user } = useAuth();
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<"match" | "mismatch" | null>(null);
  const [generatingHash, setGeneratingHash] = useState<string | null>(null);
  const [hashResult, setHashResult] = useState<any>(null);

  const { data: sessions } = useQuery({
    queryKey: ["vault-sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notarization_sessions").select("*").eq("status", "completed").order("completed_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const handleGenerateHash = async (session: any) => {
    setGeneratingHash(session.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-audit-hash", {
        body: {
          document_name: session.document_name || "RON Session",
          signer_name: session.signer_name || "Unknown",
          notary_name: session.notary_name || "Unknown",
          timestamp: session.completed_at || session.created_at,
          session_id: session.id,
        },
      });
      if (error) throw error;
      setHashResult(data);
      toast.success("Hash generated");
    } catch (err: any) {
      toast.error(err.message || "Hash generation failed");
    } finally {
      setGeneratingHash(null);
    }
  };

  const handleCopyHash = () => {
    if (hashResult?.hash) {
      navigator.clipboard.writeText(hashResult.hash);
      toast.success("Hash copied to clipboard");
    }
  };

  const handleDownloadAuditPackage = async () => {
    if (!hashResult) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file("metadata.json", JSON.stringify(hashResult.metadata, null, 2));
      zip.file("hash_certificate.txt", `SHA-256 Hash: ${hashResult.hash}\nFingerprint: ${hashResult.fingerprint}\nGenerated: ${new Date().toISOString()}`);
      if (hashResult.chain_of_custody?.length) {
        zip.file("chain_of_custody.json", JSON.stringify(hashResult.chain_of_custody, null, 2));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "audit_package.zip"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit package downloaded");
    } catch (err: any) {
      toast.error("Download failed");
    }
  };

  return (
    <EnterpriseLayout title="Digital Vault & Audit Trail" icon={FolderOpen} description="Completed RON session audit trails with SHA-256 hash verification">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black">Completed Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions?.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No completed RON sessions found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Signer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions?.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.session_unique_id || s.id.substring(0, 8)}</TableCell>
                        <TableCell>{s.signer_name || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.completed_at ? new Date(s.completed_at).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell><Badge variant="secondary">Completed</Badge></TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleGenerateHash(s)} disabled={generatingHash === s.id}>
                            <Shield className="mr-1.5 h-3.5 w-3.5" />{generatingHash === s.id ? "..." : "Hash"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Hash result */}
          {hashResult && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-4 p-6">
                <h3 className="text-sm font-black flex items-center gap-2"><Shield className="h-4 w-4" />Hash Certificate</h3>
                <div className="rounded-[8px] bg-background p-3 font-mono text-xs break-all">{hashResult.hash}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyHash}><Copy className="mr-1 h-3 w-3" />Copy</Button>
                  <Button variant="dark" size="sm" onClick={handleDownloadAuditPackage}><Download className="mr-1 h-3 w-3" />ZIP</Button>
                </div>
                {hashResult.chain_of_custody?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground">Chain of Custody</p>
                    {hashResult.chain_of_custody.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{c.event}</span>
                        <span className="text-muted-foreground">{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Verify */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-sm font-black">Verify Hash</h3>
              <Input placeholder="Paste SHA-256 hash..." value={verifyHash} onChange={(e) => { setVerifyHash(e.target.value); setVerifyResult(null); }} />
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                if (hashResult && verifyHash.toLowerCase() === hashResult.hash.toLowerCase()) setVerifyResult("match");
                else setVerifyResult("mismatch");
              }}>Verify</Button>
              {verifyResult === "match" && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="h-4 w-4" />Hash matches!</div>}
              {verifyResult === "mismatch" && <div className="flex items-center gap-2 text-sm text-destructive">Hash does not match</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default DigitalVault;
