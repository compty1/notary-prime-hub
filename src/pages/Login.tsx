import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { logAuditEvent } from "@/lib/auditLog";

export default function Login() {
  const { user, signIn, isAdmin, isNotary, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rateLimitEnd, setRateLimitEnd] = useState<number | null>(null);

  usePageTitle(forgotMode ? "Reset Password" : "Sign In");

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin || isNotary) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    }
  }, [user, isAdmin, isNotary, loading, navigate]);

  // Countdown for rate limit
  useEffect(() => {
    if (!rateLimitEnd) return;
    const interval = setInterval(() => {
      if (Date.now() >= rateLimitEnd) { setRateLimitEnd(null); }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitEnd]);

  if (!loading && user) return null;

  const rateLimitSeconds = rateLimitEnd ? Math.max(0, Math.ceil((rateLimitEnd - Date.now()) / 1000)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitEnd && Date.now() < rateLimitEnd) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      if (error.message?.includes("Too many login attempts")) {
        setRateLimitEnd(Date.now() + 60_000);
      }
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      logAuditEvent("login_failed", { entityType: "auth", details: { email, reason: error.message } });
    }
    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
      toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block">
            <Logo size="md" showText />
          </Link>
          <h1 className="mb-1 font-sans text-2xl font-bold text-foreground">
            {forgotMode ? "Reset Password" : "Log in"}
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            {forgotMode
              ? resetSent
                ? "Check your email for a reset link"
                : "Enter your email to receive a reset link"
              : "Sign in to manage your documents and appointments"}
          </p>

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {!resetSent && (
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
              )}
              <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                Back to Sign In
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                   <Label htmlFor="password">Password</Label>
                   <div className="relative">
                     <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                     <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                       {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                     </button>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} />
                   <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</Label>
                 </div>
                {rateLimitSeconds > 0 && (
                  <p className="text-sm text-destructive text-center">Too many attempts. Try again in {rateLimitSeconds}s</p>
                )}
                <Button type="submit" className="w-full" disabled={submitting || rateLimitSeconds > 0}>
                  {submitting ? "Signing in..." : rateLimitSeconds > 0 ? `Wait ${rateLimitSeconds}s` : "Continue"}
                </Button>
                <button
                  type="button"
                  className="block w-full text-center text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setForgotMode(true)}
                >
                  Forgot your password?
                </button>
              </form>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-foreground hover:underline">Create your account</Link>
          </p>
        </div>
      </div>

      {/* Right — decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-muted/30 border-l border-border">
        <div className="max-w-md px-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-3 font-sans text-2xl font-bold text-foreground">Secure Document Services</h2>
          <p className="text-muted-foreground">In-person and remote online notarization, fully compliant with Ohio Revised Code §147.</p>
        </div>
      </div>
    </div>
  );
}
