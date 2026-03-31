import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, ChevronLeft, Briefcase, Code, Award, Zap, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For small businesses with occasional notarization needs",
    icon: Zap,
    features: [
      "5 notarizations/month included",
      "Document storage vault (1 GB)",
      "Email support",
      "Basic compliance reminders",
      "Client portal access",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/mo",
    description: "For growing businesses with regular document needs",
    icon: Briefcase,
    features: [
      "25 notarizations/month included",
      "Document storage vault (10 GB)",
      "Priority support (2-hour response)",
      "Advanced compliance & reminders",
      "Multiple authorized signers",
      "Virtual mailroom",
      "Bulk notarization scheduling",
      "Dedicated account manager",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations and API integrations",
    icon: Code,
    features: [
      "Unlimited notarizations",
      "Unlimited document storage",
      "24/7 priority support",
      "API access & webhooks",
      "White-label options",
      "Custom workflow automation",
      "Dedicated success team",
      "SLA guarantees",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const partnerBenefits = [
  { label: "Revenue Share", desc: "Earn commissions on every transaction through your white-label platform" },
  { label: "Full Branding", desc: "Your logo, colors, and domain — seamless client experience" },
  { label: "API Integration", desc: "RESTful API with webhooks for real-time status updates" },
  { label: "Dedicated Support", desc: "Technical account manager and priority onboarding" },
];

export default function SubscriptionPlans() {
  usePageTitle("Subscription Plans");
  const { user } = useAuth();
  const navTo = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.price === "Custom") { navTo("/#contact"); return; }
    if (!user) { toast({ title: "Sign in required", description: "Please create an account first.", variant: "destructive" }); navTo("/signup"); return; }
    setLoadingPlan(plan.name);
    try {
      const amount = parseInt(plan.price.replace("$", ""));
      const { data, error } = await supabase.functions.invoke("create-payment-intent", { body: { amount, description: `${plan.name} Plan Subscription` } });
      if (error) throw error;
      toast({ title: "Payment initiated", description: `Your ${plan.name} plan setup is being processed.` });
    } catch (err: any) {
      toast({ title: "Payment setup failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally { setLoadingPlan(null); }
  };

  return (
    <PageShell>

      {/* Hero */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 font-sans text-4xl font-bold text-primary-foreground">Business Plans</h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/70">
            Scalable notarization and document services for teams of every size.
          </p>
        </div>
      </section>

      {/* Plans */}
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`h-full ${plan.highlight ? "border-2 border-accent shadow-lg relative" : "border-border/50"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <plan.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-sans text-lg font-bold">{plan.name}</h3>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="font-sans text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                    disabled={loadingPlan === plan.name}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {loadingPlan === plan.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Partner / White-Label Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/10 text-primary"><Award className="mr-1 h-3 w-3" /> Partner Program</Badge>
            <h2 className="font-sans text-2xl font-bold mb-2">White-Label & API Partners</h2>
            <p className="text-muted-foreground">Integrate notarization into your platform with our partner programs.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {partnerBenefits.map(b => (
              <Card key={b.label} className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-sans text-sm font-semibold mb-1">{b.label}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/join"><Button size="lg" className="">Apply for Partnership</Button></Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
