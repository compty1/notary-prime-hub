import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

export default function Login() {
  const { user, signIn, isAdmin, isNotary, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect based on role after login
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin || isNotary) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    }
  }, [user, isAdmin, isNotary, loading, navigate]);

  if (!loading && user) return null; // Will redirect via useEffect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </Link>
          <CardTitle className="font-display text-2xl">
            {forgotMode ? "Reset Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {forgotMode
              ? resetSent
                ? "Check your email for a reset link"
                : "Enter your email to receive a reset link"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {!resetSent && (
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
              )}
              <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
              <button
                type="button"
                className="block w-full text-center text-sm text-muted-foreground hover:text-accent"
                onClick={() => setForgotMode(true)}
              >
                Forgot your password?
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-accent hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
