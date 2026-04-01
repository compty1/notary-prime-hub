import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { AILeadChatbot } from "@/components/AILeadChatbot";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, FileSignature, Video, CheckCircle, Loader2, ArrowRight, Phone, Mail } from "lucide-react";
import { submitLead } from "@/lib/submitLead";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ComingSoon() {
  usePageTitle("Coming Soon");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    try {
      const result = await submitLead({
        email,
        source: "coming_soon",
        notes: "Signed up for launch notifications",
      });
      if (!result.success) throw new Error(result.error);
      setSubmitted(true);
      toast({ title: "You're on the list!", description: "We'll notify you when we launch." });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main aria-label="Coming Soon" className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Logo size="sm" showText theme="dark" />
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Ohio ORC §147 Compliant · Fully Licensed
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
            Professional Notary.{" "}
            <span className="text-gradient-primary">Launching Soon.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-lg text-primary-foreground/70">
            Ohio's modern notary & document services platform. In-person, mobile, and Remote Online Notarization — all in one place.
          </p>

          {/* Email capture */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md gap-2">
              <Input
                type="email"
                placeholder="Enter your email for launch updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 flex-1 border-border bg-card"
              />
              <Button type="submit" disabled={submitting} className="h-11 gap-2 px-6">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Notify Me <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-8 flex items-center gap-2 text-primary"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You're on the list! We'll be in touch.</span>
            </motion.div>
          )}
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3"
        >
          <FeatureCard
            icon={<FileSignature className="h-5 w-5 text-primary" />}
            title="In-Person & Mobile"
            desc="Franklin County and greater Columbus area coverage"
          />
          <FeatureCard
            icon={<Video className="h-5 w-5 text-primary" />}
            title="Remote Online (RON)"
            desc="Legally notarize documents from anywhere, 50-state binding"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title="Bank-Grade Security"
            desc="KBA verification, encrypted sessions, tamper-evident seals"
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary-foreground/10 py-6 text-center text-xs text-primary-foreground/50">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
          <a href="tel:6143006890" className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <Phone className="h-3.5 w-3.5" /> (614) 300-6890
          </a>
          <a href="mailto:contact@notardex.com" className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <Mail className="h-3.5 w-3.5" /> contact@notardex.com
          </a>
          <Link to="/terms" className="transition-colors hover:text-primary">Terms & Privacy</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} Notar. Ohio Notary & Document Services.</p>
      </footer>
      <AILeadChatbot />
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass-card rounded-xl p-5 text-left transition-all hover:glow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="font-heading text-sm font-semibold text-primary-foreground">{title}</h3>
      <p className="mt-1 text-xs text-primary-foreground/60">{desc}</p>
    </div>
  );
}
