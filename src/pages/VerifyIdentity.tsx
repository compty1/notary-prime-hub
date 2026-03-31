import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Camera, ChevronLeft, CheckCircle, XCircle, Loader2, Shield, Upload, AlertTriangle, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import IDScanAssistant from "@/components/IDScanAssistant";

export default function VerifyIdentity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [idData, setIdData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);

  usePageTitle("ID Verification");

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 10MB.", variant: "destructive" });
      return;
    }

    setScanning(true);
    setIdData(null);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const { data, error: fnError } = await supabase.functions.invoke("scan-id", {
            body: { imageBase64: base64 },
          });
          if (fnError) throw fnError;
          if (data?.error) {
            setError(data.error);
          } else {
            setIdData(data);
            if (data.is_expired) {
              toast({ title: "Expired ID", description: "This ID appears to be expired.", variant: "destructive" });
            }
          }
        } catch (e: any) {
          setError(e.message || "Could not process the ID image.");
        }
        setScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Could not process the ID image.");
      setScanning(false);
    }
  };

  const saveToProfile = async () => {
    if (!user || !idData) return;
    const { error: err } = await supabase.from("profiles").update({
      full_name: idData.full_name || undefined,
      address: idData.address || undefined,
      state: idData.state || undefined,
    }).eq("user_id", user.id);
    if (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated with ID data" });
      setSaved(true);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="font-sans text-lg font-bold text-foreground">Notar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/services"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Services</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-sans text-2xl font-bold">ID Verification / KYC Check</h1>
            <p className="text-sm text-muted-foreground mt-2">Upload a photo of your government-issued ID for instant AI verification. No appointment needed.</p>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-6">
              {/* AI ID Scan Assistant */}
              {showAssistant && !idData && !scanning && (
                <IDScanAssistant
                  onCapture={async (base64) => {
                    setShowAssistant(false);
                    setScanning(true);
                    setError(null);
                    try {
                      const { data, error: fnError } = await supabase.functions.invoke("scan-id", {
                        body: { imageBase64: base64 },
                      });
                      if (fnError) throw fnError;
                      if (data?.error) setError(data.error);
                      else {
                        setIdData(data);
                        if (data.is_expired) toast({ title: "Expired ID", description: "This ID appears to be expired.", variant: "destructive" });
                      }
                    } catch (e: any) {
                      setError(e.message || "Could not process the ID image.");
                    }
                    setScanning(false);
                  }}
                  onSkip={() => setShowAssistant(false)}
                />
              )}

              {/* Manual Upload Section (shown after skipping assistant or on fallback) */}
              {!showAssistant && !idData && (
              <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center">
                <Camera className="mx-auto mb-3 h-10 w-10 text-primary/60" />
                <p className="mb-3 text-sm font-medium">Upload ID Photo</p>
                <p className="mb-4 text-xs text-muted-foreground">Driver's license, state ID, or passport — front side</p>
                <Input type="file" accept="image/*" onChange={handleIdScan} disabled={scanning} className="max-w-xs mx-auto" />
              </div>
              )

              {scanning && (
                <div className="flex items-center justify-center gap-3 py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">Scanning your ID...</span>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Verification Failed</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}

              {idData && !idData.error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className={`rounded-lg border p-4 ${idData.is_expired ? "border-amber-300 bg-amber-50" : "border-primary/30 bg-primary/5"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {idData.is_expired ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      <span className={`text-sm font-semibold ${idData.is_expired ? "text-amber-800" : "text-primary"}`}>
                        {idData.is_expired ? "Expired ID Detected" : "ID Verified Successfully"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground block text-xs">Full Name</span><span className="font-medium">{idData.full_name}</span></div>
                      <div><span className="text-muted-foreground block text-xs">ID Type</span><span className="font-medium">{idData.id_type}</span></div>
                      {idData.date_of_birth && <div><span className="text-muted-foreground block text-xs">Date of Birth</span><span className="font-medium">{idData.date_of_birth}</span></div>}
                      {idData.expiration_date && <div><span className="text-muted-foreground block text-xs">Expiration</span><span className="font-medium">{idData.expiration_date}</span></div>}
                      {idData.state && <div><span className="text-muted-foreground block text-xs">State</span><span className="font-medium">{idData.state}</span></div>}
                      {idData.id_number && <div><span className="text-muted-foreground block text-xs">ID Number</span><span className="font-medium">***{idData.id_number.slice(-4)}</span></div>}
                    </div>
                  </div>

                  {user && !saved && (
                    <Button onClick={saveToProfile} variant="outline" className="w-full">
                      <User className="mr-2 h-4 w-4" /> Save to My Profile
                    </Button>
                  )}
                  {saved && (
                    <p className="text-center text-sm text-primary flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Saved to profile
                    </p>
                  )}

                  <div className="text-center space-y-2">
                    <Link to="/book"><Button className="">Book a Notarization</Button></Link>
                    <p className="text-xs text-muted-foreground">Your ID data will be pre-filled during booking.</p>
                  </div>
                </motion.div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Your ID image is processed securely and not stored. Only extracted text data is used.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Notar — Ohio Notary & Document Services</p>
      </footer>
    </div>
  );
}
