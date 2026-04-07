import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, ShieldCheck, Trash2, Loader2 } from "lucide-react";

export default function MFASetup() {
  const { toast } = useToast();
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const fetchFactors = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) {
      setFactors([...(data.totp || [])]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFactors(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setEnrolling(false);
      return;
    }
    if (data) {
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    }
    setEnrolling(false);
  };

  const verifyEnrollment = async () => {
    if (!factorId || verifyCode.length < 6) return;
    setVerifying(true);
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) {
      toast({ title: "Challenge failed", description: challengeErr.message, variant: "destructive" });
      setVerifying(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: verifyCode });
    if (verifyErr) {
      toast({ title: "Verification failed", description: verifyErr.message, variant: "destructive" });
      setVerifying(false);
      return;
    }
    toast({ title: "MFA enabled!", description: "Your authenticator app is now linked." });
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerifyCode("");
    setVerifying(false);
    fetchFactors();
  };

  const unenrollFactor = async (id: string) => {
    setUnenrolling(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "MFA removed" });
    setUnenrolling(false);
    fetchFactors();
  };

  const verifiedFactors = factors.filter(f => f.status === "verified");
  const hasActiveMFA = verifiedFactors.length > 0;

  if (loading) return <Card className="mb-6 border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Loading MFA status...</p></CardContent></Card>;

  return (
    <Card className="mb-6 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5 text-primary" /> Multi-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security with an authenticator app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveMFA ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">MFA is active</span>
              <Badge variant="secondary" className="text-xs">TOTP</Badge>
            </div>
            {verifiedFactors.map(f => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{f.friendly_name || "Authenticator"}</p>
                  <p className="text-xs text-muted-foreground">Added {new Date(f.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => unenrollFactor(f.id)} disabled={unenrolling} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
            <div className="flex justify-center">
              <img src={qrCode} alt="TOTP QR Code" className="h-48 w-48 rounded-lg border border-border" />
            </div>
            {secret && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                <code className="text-sm font-mono text-foreground select-all">{secret}</code>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-2">Enter the 6-digit code from your app:</p>
              <div className="flex items-center gap-3">
                <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button onClick={verifyEnrollment} disabled={verifying || verifyCode.length < 6}>
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setQrCode(null); setSecret(null); setFactorId(null); }}>Cancel</Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              MFA adds a second verification step when signing in — a code from an authenticator app on your phone.
            </p>
            <Button onClick={startEnroll} disabled={enrolling}>
              {enrolling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</> : "Enable MFA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
