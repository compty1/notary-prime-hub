import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, QrCode, Trash2 } from "lucide-react";

export function MFASetup() {
  const { toast } = useToast();
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  const fetchFactors = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) {
      setFactors(data.totp || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFactors(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
    if (error) {
      toast({ title: "Enrollment failed", description: error.message, variant: "destructive" });
      setEnrolling(false);
      return;
    }
    if (data) {
      setQrUri(data.totp.uri);
      setFactorId(data.id);
    }
    setEnrolling(false);
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      toast({ title: "Challenge failed", description: challenge.error.message, variant: "destructive" });
      setVerifying(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: verifyCode });
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "MFA enabled successfully!" });
      setQrUri(null);
      setFactorId(null);
      setVerifyCode("");
      await fetchFactors();
    }
    setVerifying(false);
  };

  const handleUnenroll = async (id: string) => {
    setUnenrolling(id);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "MFA factor removed" });
      await fetchFactors();
    }
    setUnenrolling(null);
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /> <span className="text-sm text-muted-foreground">Loading MFA status...</span></div>;
  }

  const verifiedFactors = factors.filter(f => f.factor_type === "totp" && f.status === "verified");

  return (
    <div className="space-y-4">
      {verifiedFactors.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <Badge className="bg-primary/10 text-primary">MFA Enabled</Badge>
          </div>
          {verifiedFactors.map(f => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <p className="text-sm font-medium">{f.friendly_name || "TOTP"}</p>
                <p className="text-xs text-muted-foreground">Added {new Date(f.created_at).toLocaleDateString()}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleUnenroll(f.id)} disabled={unenrolling === f.id}>
                {unenrolling === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </div>
          ))}
        </div>
      ) : qrUri ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
          <div className="flex justify-center rounded-lg border border-border/50 bg-white p-4">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="MFA QR Code" className="h-48 w-48" />
          </div>
          <div>
            <Label htmlFor="mfa-code">Enter 6-digit code from your app</Label>
            <Input id="mfa-code" value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="mt-1 font-mono text-center text-lg tracking-widest" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={verifying || verifyCode.length !== 6}>
              {verifying ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Verify & Enable
            </Button>
            <Button variant="outline" onClick={() => { setQrUri(null); setFactorId(null); setVerifyCode(""); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Add an authenticator app for a second verification step when signing in.
          </p>
          <Button variant="outline" onClick={startEnroll} disabled={enrolling}>
            {enrolling ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <QrCode className="mr-1 h-4 w-4" />}
            Set Up Authenticator
          </Button>
        </div>
      )}
    </div>
  );
}
