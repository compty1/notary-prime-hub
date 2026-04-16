/**
 * C-04: Password re-entry confirmation dialog before destructive actions.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  title?: string;
  description?: string;
}

export default function PasswordConfirmDialog({
  open,
  onOpenChange,
  onConfirmed,
  title = "Confirm Your Identity",
  description = "Please re-enter your password to continue with this action.",
}: PasswordConfirmDialogProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    setVerifying(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password,
      });

      if (signInError) {
        setError("Incorrect password. Please try again.");
        return;
      }

      setPassword("");
      onConfirmed();
      onOpenChange(false);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPassword(""); setError(""); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="confirm-password">Current Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleVerify} disabled={verifying}>
            {verifying && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
