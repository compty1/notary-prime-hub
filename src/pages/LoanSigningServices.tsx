import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
import { Logo } from "@/components/Logo";
  ChevronLeft, CheckCircle, Send, Loader2, Shield, FileText, Monitor,
  Clock, Phone, Mail, Briefcase, Building2, ChevronRight, ArrowRight
} from "lucide-react";

const capabilities = [
  { icon: Shield, title: "Certified NSA", desc: "NNA-certified Notary Signing Agent with background screening and E&O insurance coverage." },
  { icon: Monitor, title: "RON-Capable", desc: "Ohio-authorized Remote Online Notarization for closings anywhere, fully compliant with ORC §147.65-.66." },
  { icon: FileText, title: "All Document Types", desc: "Purchase, refinance, reverse mortgage, HELOC, seller packages, and loan modifications." },
  { icon: Clock, title: "Flexible Scheduling", desc: "Appointments available Mon–Wed 10 AM – 7 PM, with extended hours by arrangement." },
];

const signingTypes = [
  "Purchase Closings",
  "Refinance Closings",
  "Reverse Mortgages",
  "HELOC Closings",
  "Seller Packages",
  "Loan Modifications",
  "RON Closings",
  "Hybrid Closings (eSign + wet ink)",
];

export default function LoanSigningServices() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Loan Signing Services — Notar";
    return () => { document.title = "Notar — Ohio Notary Public | In-Person & RON"; };
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    volumeEstimate: "",
    signingTypes: "",
    preferredContact: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim()) {
      toast({ title: "Required fields missing", description: "Please fill in company name, contact name, and email.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      business_name: form.companyName.trim().slice(0, 200),
      name: form.contactName.trim().slice(0, 100),
      email: form.email.trim().slice(0, 255),
      phone: form.phone.trim().slice(0, 20) || null,
      service_needed: "Loan Signing Services",
      notes: [
        form.volumeEstimate && `Volume: ${form.volumeEstimate}`,
        form.signingTypes && `Types: ${form.signingTypes}`,
        form.preferredContact && `Preferred contact: ${form.preferredContact}`,
        form.message && `Message: ${form.message.trim().slice(0, 500)}`,
      ].filter(Boolean).join(" | "),
      source: "loan_signing_inquiry",
      lead_type: "business",
      intent_score: "high",
      status: "new",
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: "Please try again or contact us directly.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Inquiry received!", description: "We'll be in touch within 24 hours." });
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <div>
              <span className="block font-display text-lg font-bold text-foreground">Notar</span>
              <span className="block text-xs text-muted-foreground">Notary & Document Services</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link to="/services"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> All Services</Button></Link>
            <Link to="/book"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 border-gold/30 bg-gold/10 text-gold-light">
            <Building2 className="mr-1 h-3 w-3" /> For Title Companies & Lenders
          </Badge>
          <h1 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-5xl">
            Loan Signing Agent Services
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/70">
            Reliable, certified loan signing services for title companies, lenders, and signing services in the Columbus, Ohio area 
            and nationwide via RON.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap, i) => (
              <motion.div key={cap.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-5">
                    <cap.icon className="mb-3 h-8 w-8 text-accent" />
                    <h3 className="mb-1 font-display text-base font-semibold">{cap.title}</h3>
                    <p className="text-sm text-muted-foreground">{cap.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signing Types + Business Hours */}
      <section className="py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold">Signing Types We Handle</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {signingTypes.map(type => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold">Business Hours & Response</h2>
              <Card className="border-border/50">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium">Office Hours</p>
                      <p className="text-sm text-muted-foreground">Monday, Tuesday, Wednesday: 10:00 AM – 7:00 PM</p>
                      <p className="text-sm text-muted-foreground">Extended hours available by arrangement</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium">Response Commitment</p>
                      <p className="text-sm text-muted-foreground">Business calls returned within 24 hours</p>
                      <p className="text-sm text-muted-foreground">Client support typically within 2 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium">Direct Contact</p>
                      <p className="text-sm text-muted-foreground">
                        <a href="tel:6143006890" className="hover:text-accent">(614) 300-6890</a>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <a href="mailto:contact@notardex.com" className="hover:text-accent">contact@notardex.com</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Inquiry Form */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="mb-2 text-center font-display text-2xl font-bold">Partner With Us</h2>
          <p className="mb-8 text-center text-muted-foreground">
            Fill out the form below and we'll reach out to discuss how we can support your signing needs.
          </p>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
                  <h3 className="mb-2 font-display text-xl font-bold">Inquiry Received!</h3>
                  <p className="mb-6 text-muted-foreground">
                    Thank you for your interest. We'll review your information and contact you within 24 hours 
                    to discuss partnership opportunities.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link to="/services"><Button variant="outline">View All Services</Button></Link>
                    <Link to="/"><Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Back to Home</Button></Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input value={form.companyName} onChange={e => update("companyName", e.target.value)} placeholder="Title company or lender name" maxLength={200} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Name *</Label>
                      <Input value={form.contactName} onChange={e => update("contactName", e.target.value)} placeholder="Your full name" maxLength={100} required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@company.com" maxLength={255} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(614) 000-0000" maxLength={20} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Estimated Monthly Volume</Label>
                      <Select value={form.volumeEstimate} onValueChange={v => update("volumeEstimate", v)}>
                        <SelectTrigger><SelectValue placeholder="Select volume" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1–5 signings/month</SelectItem>
                          <SelectItem value="6-15">6–15 signings/month</SelectItem>
                          <SelectItem value="16-30">16–30 signings/month</SelectItem>
                          <SelectItem value="30+">30+ signings/month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Contact Method</Label>
                      <Select value={form.preferredContact} onValueChange={v => update("preferredContact", v)}>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Signing Types Needed</Label>
                    <Input value={form.signingTypes} onChange={e => update("signingTypes", e.target.value)} placeholder="e.g., Purchase, Refinance, HELOC, RON closings" maxLength={300} />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Details</Label>
                    <Textarea value={form.message} onChange={e => update("message", e.target.value)} placeholder="Any other information about your signing needs..." rows={3} maxLength={500} />
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" size="lg" disabled={submitting}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit Partnership Inquiry</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Other Services CTA */}
      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-3 font-display text-2xl font-bold">Explore All Our Services</h2>
          <p className="mb-6 text-muted-foreground">
            Beyond loan signings, we offer a full range of notary, document, and professional services for individuals and businesses.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/services"><Button size="lg" variant="outline">View All Services <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
            <Link to="/ron-check"><Button size="lg" variant="outline">RON Eligibility Checker <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Notar — Ohio Notary & Document Services</p>
      </footer>
    </div>
  );
}
