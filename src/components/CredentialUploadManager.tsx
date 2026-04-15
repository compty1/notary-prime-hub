import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Shield, AlertTriangle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CredentialUploadManager() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [credType, setCredType] = useState("notary_commission");
  const [expiresAt, setExpiresAt] = useState("");

  // platform_credentials table accessed via dynamic name (not in generated types)
  const credTable = () => (supabase as unknown as { from: (t: string) => Record<string, (...args: unknown[]) => unknown> }).from("platform_credentials");

  const fetchCredentials = async () => {
    if (!user) return;
    const { data } = await (credTable().select("*") as unknown as { eq: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null }> } }).eq("user_id", user.id).order("created_at", { ascending: false });
    setCredentials(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCredentials(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `credentials/${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
    if (uploadErr) { toast.error("Upload failed"); setUploading(false); return; }

    const { error } = await (supabase.from("platform_credentials" as never) as ReturnType<typeof supabase.from>).insert({
      user_id: user.id,
      credential_type: credType,
      file_path: path,
      expires_at: expiresAt || null,
      status: "pending_review",
    } as never);
    if (error) { toast.error(error.message); } else {
      toast.success("Credential uploaded for review");
      await fetchCredentials();
    }
    setUploading(false);
  };

  const isExpiringSoon = (date: string) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (date: string) => date && new Date(date) < new Date();

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Credentials & Stamps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Credential Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={credType} onChange={e => setCredType(e.target.value)}>
              <option value="notary_commission">Notary Commission</option>
              <option value="e_and_o_insurance">E&O Insurance</option>
              <option value="surety_bond">Surety Bond</option>
              <option value="notary_stamp">Notary Stamp Image</option>
              <option value="background_check">Background Check</option>
            </select>
          </div>
          <div>
            <Label>Expiration Date</Label>
            <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" disabled={uploading} asChild>
              <label className="cursor-pointer">
                {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload File"}
                <input type="file" className="hidden" accept=".pdf,.jpg,.png,.jpeg" onChange={handleUpload} />
              </label>
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No credentials uploaded yet</TableCell></TableRow>
            ) : credentials.map(c => (
              <TableRow key={c.id}>
                <TableCell className="capitalize">{(c.credential_type || "").replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                    {c.status === "approved" ? <CheckCircle className="mr-1 h-3 w-3" /> : null}
                    {c.status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {c.expires_at ? (
                    <span className={isExpired(c.expires_at) ? "text-destructive font-medium" : isExpiringSoon(c.expires_at) ? "text-amber-600 font-medium" : ""}>
                      {isExpired(c.expires_at) && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                      {new Date(c.expires_at).toLocaleDateString()}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
