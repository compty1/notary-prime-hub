/**
 * C-02: Email Verification Gate — blocks booking/uploads/payments for unverified users.
 */
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MailCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationGateProps {
  children: React.ReactNode;
  /** Description of what's being gated */
  action?: string;
}

export default function EmailVerificationGate({ children, action = "this feature" }: EmailVerificationGateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  const emailConfirmed = user?.email_confirmed_at || user?.confirmed_at;

  if (emailConfirmed) return <>{children}</>;

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (error) throw error;
      toast({ title: "Verification email sent", description: "Please check your inbox and spam folder." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to resend verification email.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Alert className="max-w-lg border-yellow-500/30 bg-yellow-500/5">
        <ShieldAlert className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-700 dark:text-yellow-400">Email Verification Required</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            You must verify your email address before accessing {action}. 
            Please check your inbox for a verification link.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resending}
            className="gap-2"
          >
            <MailCheck className="h-4 w-4" />
            {resending ? "Sending…" : "Resend Verification Email"}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
