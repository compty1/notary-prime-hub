import { useState, useEffect, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { validatePasswordComplexity } from "@/lib/security";
import { getPasswordStrength } from "@/lib/utils";

const strengthLabels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  usePageMeta({ title: "Reset Password", description: "Reset your Notar account password securely.", noIndex: true });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setMode("reset");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRequestSent(true);
      setCooldown(30);
      toast({ title: "Check your email", description: "We sent a password reset link." });
    }
    setSubmitting(false);
  };

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    const complexity = validatePasswordComplexity(password);
    if (!complexity.valid) {
      toast({ title: "Weak password", description: complexity.message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      setTimeout(() => navigate("/login"), 2000);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block">
            <Logo size="lg" showText />
          </Link>
          <h1 className="text-3xl font-black text-foreground mb-1">
            {success ? "Password Updated" : mode === "reset" ? "Set New Password" : "Forgot Password"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {success ? "Redirecting you to sign in..." : mode === "reset" ? "Enter your new password below" : "Enter your email to receive a reset link"}
          </p>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 rounded-[24px] border border-border bg-card p-8">
              <CheckCircle className="h-12 w-12 text-primary" />
              <Link to="/login"><Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/85 shadow-soft">Go to Sign In</Button></Link>
            </div>
          ) : requestSent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center rounded-[24px] border border-border bg-card p-8">
              <CheckCircle className="h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">Check your email for a password reset link. It may take a minute to arrive.</p>
              <Link to="/login"><Button variant="outline" className="rounded-xl border-border"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Sign In</Button></Link>
            </div>
          ) : mode === "reset" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Password</Label>
                <div className="relative mt-1">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="rounded-xl border-border bg-card pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Progress value={strength * 20} className="h-1.5 flex-1" />
                      <span className={`text-xs font-medium ${strength <= 2 ? "text-destructive" : strength <= 3 ? "text-yellow-600" : "text-primary"}`}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="confirm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input id="confirm" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="rounded-xl border-border bg-card pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/85 shadow-soft h-11" disabled={submitting}>
                {submitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) = autoComplete="email"> setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" className="mt-1 rounded-xl border-border bg-card" />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/85 shadow-soft h-11" disabled={submitting || cooldown > 0}>
                {submitting ? "Sending..." : cooldown > 0 ? `Wait ${cooldown}s` : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-bold text-foreground hover:underline">Back to Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Right — Brand panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center bg-foreground p-12 text-white">
        <div className="max-w-sm text-center space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/20">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black">Secure Account<br />Recovery</h2>
          <p className="text-muted-foreground">Your account security is our priority. Reset links expire after 24 hours for your protection.</p>
        </div>
      </div>
    </div>
  );
}
