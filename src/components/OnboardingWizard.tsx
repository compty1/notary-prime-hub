import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, MapPin, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
  profile: { full_name?: string | null; phone?: string | null; address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null; [key: string]: unknown } | null;
  onComplete: () => void;
}

export function OnboardingWizard({ profile, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: String(profile?.full_name || ""),
    phone: String(profile?.phone || ""),
    address: String(profile?.address || ""),
    city: String(profile?.city || ""),
    state: String(profile?.state || "OH"),
    zip: String(profile?.zip_code || ""),
  });

  const steps = [
    { title: "Your Name", icon: User, fields: ["full_name"] },
    { title: "Contact Info", icon: Phone, fields: ["phone"] },
    { title: "Address", icon: MapPin, fields: ["address", "city", "state", "zip"] },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
    }).eq("user_id", user.id);
    if (error) toast({ title: "Error saving profile", variant: "destructive" });
    else {
      toast({ title: "Profile complete!", description: "Welcome to the platform." });
      onComplete();
    }
    setSaving(false);
  };

  const StepIcon = steps[step].icon;

  return (
    <Card className="mx-auto max-w-md border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">Complete Your Profile</h3>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length} — {steps[step].title}</p>
          </div>
        </div>

        <Progress value={progress} className="mb-6 h-1.5" />

        <div className="space-y-4">
          {step === 0 && (
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full legal name" />
            </div>
          )}
          {step === 1 && (
            <div>
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(XXX) XXX-XXXX" />
            </div>
          )}
          {step === 2 && (
            <>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
                <div><Label>ZIP</Label><Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} /></div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button onClick={handleNext} disabled={saving} className="ml-auto">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : step < steps.length - 1 ? <ArrowRight className="mr-1 h-4 w-4" /> : <CheckCircle className="mr-1 h-4 w-4" />}
            {step < steps.length - 1 ? "Next" : "Complete"}
          </Button>
        </div>

        <Button variant="link" size="sm" className="mt-2 w-full text-muted-foreground" onClick={onComplete}>
          Skip for now
        </Button>
      </CardContent>
    </Card>
  );
}
