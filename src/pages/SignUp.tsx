import { useState, useMemo, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, EyeOff, Shield, FileText, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getPasswordStrength } from "@/lib/utils";
import { checkPasswordBreach } from "@/lib/hibpCheck";
import { isDisposableEmail } from "@/lib/security";

const strengthLabels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

export default function SignUp() {
 const { user, signUp, isAdmin, isNotary, loading } = useAuth();
 const { toast } = useToast();
 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [acceptTerms, setAcceptTerms] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [signupSuccess, setSignupSuccess] = useState(false);
 const [searchParams] = useSearchParams();
 const refCode = searchParams.get("ref") || "";

 const strength = useMemo(() => getPasswordStrength(password), [password]);

 usePageMeta({ title: "Sign Up", description: "Create a free Notar account to book notarization appointments, upload documents, and access Ohio notary services online.", noIndex: true });

 if (!loading && user) {
 if (isAdmin || isNotary) return <Navigate to="/admin" replace />;
 return <Navigate to="/portal" replace />;
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (password.length < 8) {
 toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
 return;
 }
 if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
 toast({ title: "Weak password", description: "Password must contain uppercase, lowercase, number, and special character.", variant: "destructive" });
 return;
 }
 if (password !== confirmPassword) {
 toast({ title: "Passwords don't match", description: "Please make sure both passwords match.", variant: "destructive" });
 return;
 }
 if (!acceptTerms) {
 toast({ title: "Accept Terms", description: "Please accept the Terms of Service to continue.", variant: "destructive" });
 return;
 }
 // Sprint B (B-46): Block disposable email domains
 if (isDisposableEmail(email)) {
 toast({ title: "Disposable email blocked", description: "Please use a permanent email address.", variant: "destructive" });
 return;
 }
 setSubmitting(true);
 // Sprint B (B-46): HIBP breach check (k-anonymity, password never leaves device)
 const hibp = await checkPasswordBreach(password);
 if (hibp.breached) {
 setSubmitting(false);
 toast({
 title: "Password found in data breach",
 description: `This password has appeared in ${hibp.count.toLocaleString()} known breaches. Please choose a different password.`,
 variant: "destructive",
 });
 return;
 }
 const { error } = await signUp(email, password, fullName);
 if (error) {
 toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
 } else {
 setSignupSuccess(true);
 if (refCode) {
 try {
 await supabase.from("referrals").update({ status: "signed_up" } as never)
 .eq("referral_code", refCode)
 .eq("status", "pending");
 } catch (e) { console.error("Referral tracking error:", e); }
 }
 }
 setSubmitting(false);
 };

 const handleResendVerification = async () => {
 setSubmitting(true);
 const { error } = await supabase.auth.resend({ type: "signup", email });
 if (error) {
 toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
 } else {
 toast({ title: "Verification email sent", description: "Check your inbox." });
 }
 setSubmitting(false);
 };

 if (signupSuccess) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-background px-4">
 <div className="w-full max-w-md rounded-[24px] border border-border bg-card p-8 shadow-sm">
 <div className="flex flex-col items-center text-center">
 <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
 <CheckCircle className="h-8 w-8 text-primary" />
 </div>
 <h2 className="text-2xl font-black text-foreground mb-2">Check Your Email</h2>
 <p className="text-muted-foreground mb-2">We sent a verification link to</p>
 <p className="font-bold text-foreground mb-4">{email}</p>
 <p className="text-sm text-muted-foreground mb-2">Click the link in the email to verify your account, then sign in.</p>
 <p className="text-xs text-muted-foreground mb-4">Don't see it? Check your spam or junk folder.</p>
 <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={submitting} className="mb-4 rounded-xl">
 {submitting ? "Sending..." : "Resend Verification Email"}
 </Button>
 <Link to="/login">
 <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/85 shadow-soft">Go to Sign In</Button>
 </Link>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="flex min-h-screen bg-background">
 {/* Left — Form */}
 <div className="flex flex-1 items-center justify-center px-6 py-12">
 <div className="w-full max-w-md">
 <Link to="/" className="mb-8 inline-block">
 <Logo size="lg" showText />
 </Link>
 <h1 className="text-3xl font-black text-foreground mb-1">Create Account</h1>
 <p className="text-muted-foreground mb-8">Sign up to book notary appointments</p>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
 <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className="mt-1 rounded-xl border-border bg-card" />
 </div>
 <div>
 <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
 <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="mt-1 rounded-xl border-border bg-card" />
 </div>
 <div>
 <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
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
 <p className="text-xs text-muted-foreground">Use 10+ chars with uppercase, numbers, and symbols</p>
 </div>
 )}
 {!password && <p className="mt-1 text-xs text-muted-foreground">Minimum 8 characters with uppercase, lowercase, numbers & special characters</p>}
 </div>
 <div>
 <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
 <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="mt-1 rounded-xl border-border bg-card" />
 {confirmPassword && password !== confirmPassword && (
 <p className="mt-1 text-xs text-destructive">Passwords don't match</p>
 )}
 </div>
 <div className="flex items-start gap-2">
 <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} className="mt-0.5" />
 <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
 I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/terms" className="text-primary hover:underline">Privacy Policy</Link>
 </Label>
 </div>
 <Button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/85 shadow-soft h-11" disabled={submitting || !acceptTerms}>
 {submitting ? "Creating account..." : "Create Account"}
 </Button>
 <div className="relative my-4">
 <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
 <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
 </div>
 <Button
 type="button"
 variant="outline"
 className="w-full rounded-xl border-border"
 onClick={async () => {
 const { error } = await lovable.auth.signInWithOAuth("google", {
 redirect_uri: `${window.location.origin}/portal`,
 });
 if (error) toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
 }}
 >
 <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
 Continue with Google
 </Button>
 </form>
 <p className="mt-6 text-center text-sm text-muted-foreground">
 Already have an account?{" "}
 <Link to="/login" className="font-bold text-foreground hover:underline">Sign in</Link>
 </p>
 </div>
 </div>

 {/* Right — Brand panel (desktop only) */}
 <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center bg-foreground p-12 text-background">
 <div className="max-w-sm text-center space-y-8">
 <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/20">
 <Shield className="h-10 w-10 text-primary" />
 </div>
 <h2 className="text-3xl font-black">Ohio's Trusted<br />Notary Platform</h2>
 <p className="text-background/70">Join thousands of Ohioans who trust Notar for secure, compliant notarization services.</p>
 <div className="grid grid-cols-2 gap-4 text-left">
 <div className="rounded-2xl bg-background/10 p-4">
 <FileText className="h-5 w-5 text-primary mb-2" />
 <p className="text-sm font-bold">Document Upload</p>
 <p className="text-xs text-background/70">Secure cloud storage</p>
 </div>
 <div className="rounded-2xl bg-background/10 p-4">
 <Lock className="h-5 w-5 text-primary mb-2" />
 <p className="text-sm font-bold">Bank-Level Security</p>
 <p className="text-xs text-background/70">End-to-end encryption</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
