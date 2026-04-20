import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Shield, CheckCircle, Loader2, MapPin, FileText, Star } from "lucide-react";

const SPECIALIZATIONS = [
  "General Notary", "RON (Remote Online Notarization)", "Loan Signing Agent",
  "Apostille / Authentication", "Process Serving", "Translation Services",
  "I-9 Verification", "Fingerprinting", "Mobile Notary",
];

export default function ContractorRegistration() {
  usePageMeta({
    title: "Join Our Team — Notar",
    description: "Apply to join Notar's professional notary and document services network in Ohio.",
  });
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", location: "",
    specializations: [] as string[], experience_years: "",
    commission_state: "OH", commission_number: "", commission_expiry: "",
    has_eo_insurance: false, has_background_check: false,
    bio: "", referral_source: "",
  });

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleSpec = (s: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter(x => x !== s)
        : [...f.specializations, s],
    }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast({ title: "Required fields missing", description: "Please fill in name, email, and phone.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("service_requests").insert({
        client_id: "00000000-0000-0000-0000-000000000000",
        service_name: "contractor_application",
        status: "pending",
        priority: "normal",
        notes: JSON.stringify({
          ...form,
          applied_at: new Date().toISOString(),
          source: "public_registration",
        }),
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you within 48 hours." });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <PageShell>
        <div className="container mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Application Received!</h1>
          <p className="text-muted-foreground mb-6">Thank you for your interest in joining the Notar team. We'll review your application and contact you within 48 business hours.</p>
          <Button onClick={() => window.location.href = "/"}>Return Home</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Breadcrumbs />
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary">Now Hiring</Badge>
          <h1 className="text-3xl font-bold mb-2">Join the Notar Network</h1>
          <p className="text-muted-foreground">Apply to become a contracted notary or document services professional serving Central Ohio.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[
            { icon: MapPin, title: "Flexible Schedule", desc: "Choose your own hours and service area" },
            { icon: Star, title: "Competitive Pay", desc: "Earn per appointment with transparent pricing" },
            { icon: Shield, title: "Full Support", desc: "Technology, compliance tools, and training provided" },
          ].map((b, i) => (
            <Card key={i}><CardContent className="pt-6 text-center">
              <b.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-semibold text-sm">{b.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Your Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="Jane Smith" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e = autoComplete="email"> update("email", e.target.value)} placeholder="jane@example.com" /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(614) 555-0000" /></div>
              <div><Label>Service Area</Label><Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="Columbus, OH" /></div>
            </div>

            <div>
              <Label className="mb-2 block">Specializations</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => (
                  <Badge
                    key={s}
                    variant={form.specializations.includes(s) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSpec(s)}
                  >{s}</Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Years of Experience</Label><Input value={form.experience_years} onChange={e => update("experience_years", e.target.value)} placeholder="5" /></div>
              <div><Label>Commission #</Label><Input value={form.commission_number} onChange={e => update("commission_number", e.target.value)} placeholder="OH-12345" /></div>
              <div><Label>Commission Expiry</Label><Input type="date" value={form.commission_expiry} onChange={e => update("commission_expiry", e.target.value)} /></div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.has_eo_insurance} onCheckedChange={v => update("has_eo_insurance", !!v)} />
                <Label>I have active E&O insurance</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.has_background_check} onCheckedChange={v => update("has_background_check", !!v)} />
                <Label>I have a current background check</Label>
              </div>
            </div>

            <div><Label>Brief Bio</Label><Textarea value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Tell us about your experience and why you'd like to join Notar..." rows={3} /></div>

            <div>
              <Label>How did you hear about us?</Label>
              <Select value={form.referral_source} onValueChange={v => update("referral_source", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Search</SelectItem>
                  <SelectItem value="referral">Referral from a colleague</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="nna">NNA / Notary Association</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Submit Application
            </Button>

            <p className="text-xs text-muted-foreground text-center">By submitting, you agree to our background check and credential verification process.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
