import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, Briefcase, Code, Award, Zap, Loader2, FileCheck2, Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/hooks/use-toast";
import PaymentForm from "@/components/PaymentForm";

const individualPricing = [
  { item: "Standard Notarization", price: "$25", note: "per document" },
  { item: "Additional Seals", price: "$10", note: "per seal" },
  { item: "Apostille Preparation", price: "$35", note: "per document" },
  { item: "Mobile Travel Fee", price: "$15–$40", note: "based on distance" },
  { item: "After-Hours Surcharge", price: "$25", note: "before 9AM / after 7PM" },
  { item: "Rush/Same-Day Fee", price: "$35", note: "priority scheduling" },
  { item: "Witness Fee", price: "$10", note: "per witness per session" },
];

const plans = [
  {
    name: "Business Essentials",
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
    name: "Business Pro",
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

const addOns = [
  { item: "Extended Document Storage", price: "$5/mo", note: "per additional 5 GB" },
  { item: "Additional Authorized Signers", price: "$10/mo", note: "per signer" },
  { item: "Apostille Preparation Bundle", price: "$35", note: "per document" },
  { item: "Dedicated Phone Support", price: "$25/mo", note: "direct line" },
];

const partnerBenefits = [
  { label: "Revenue Share", desc: "Earn commissions on every transaction through your white-label platform" },
  { label: "Full Branding", desc: "Your logo, colors, and domain — seamless client experience" },
  { label: "API Integration", desc: "RESTful API with webhooks for real-time status updates" },
  { label: "Dedicated Support", desc: "Technical account manager and priority onboarding" },
];

export default function SubscriptionPlans() {
  usePageMeta({ title: "Pricing & Plans | Notar", description: "Transparent notary pricing — Individual ($25/notarization), Business Essentials ($49/mo), Business Pro ($149/mo), and Enterprise plans." });
  const { user } = useAuth();
  const navTo = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.price === "Custom") { navTo("/#contact"); return; }
    if (!user) { toast({ title: "Sign in required", description: "Please create an account first.", variant: "destructive" }); navTo("/signup"); return; }
    setSelectedPlan(plan);
  };

  if (selectedPlan) {
    const amount = parseInt(selectedPlan.price.replace("$", ""));
    return (
      <PageShell>
        <section className="bg-sidebar-background py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 font-sans text-4xl font-bold text-white">{selectedPlan.name} Plan</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">Complete your subscription payment below.</p>
          </div>
        </section>
        <div className="container mx-auto max-w-lg px-4 py-16">
          <PaymentForm
            defaultAmount={amount}
            description={`${selectedPlan.name} Plan Subscription`}
            onSuccess={() => { toast({ title: "Subscription activated!", description: `Your ${selectedPlan.name} plan is now active.` }); setSelectedPlan(null); navTo("/portal"); }}
            onCancel={() => setSelectedPlan(null)}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Hero */}
      <section className="bg-sidebar-background py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <Breadcrumbs />
          <h1 className="mb-4 font-sans text-4xl font-bold">Transparent Pricing</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Simple, transparent pricing for individuals and businesses. No hidden fees.
          </p>
        </div>
      </section>

      {/* Individual Pricing */}
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-primary/10 text-primary">
            <FileCheck2 className="mr-1 h-3 w-3" /> Individual Pricing
          </Badge>
          <h2 className="font-sans text-2xl font-bold mb-2">Pay Per Service</h2>
          <p className="text-muted-foreground">No subscription required. Pay only for what you need.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-4xl mx-auto">
          {individualPricing.map((item) => (
            <Card key={item.item} className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="font-sans text-2xl font-bold text-primary">{item.price}</p>
                <p className="font-semibold text-sm text-foreground">{item.item}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Ohio statutory notary fee: $5.00 per signature (ORC §147.08). Platform and technology fees included in pricing above.
        </p>
      </div>

      {/* Business Plans */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/10 text-primary">
              <Briefcase className="mr-1 h-3 w-3" /> Business Plans
            </Badge>
            <h2 className="font-sans text-2xl font-bold mb-2">Subscription Plans for Teams</h2>
            <p className="text-muted-foreground">Scalable notarization and document services for teams of every size.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`h-full ${plan.highlight ? "border-2 border-primary shadow-lg relative" : "border-border/50"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <plan.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-sans text-lg font-bold">{plan.name}</h3>
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
                    <Button className="w-full" variant={plan.highlight ? "default" : "outline"} size="lg" onClick={() => handleSubscribe(plan)}>
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="font-sans text-xl font-bold mb-2">Available Add-Ons</h2>
          <p className="text-sm text-muted-foreground">Enhance any business plan with these optional add-ons.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {addOns.map((addon) => (
            <Card key={addon.item} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{addon.item}</p>
                  <p className="text-xs text-muted-foreground">{addon.note}</p>
                </div>
                <Badge variant="secondary" className="text-sm font-bold">{addon.price}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Partner Section */}
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
            <Link to="/join"><Button size="lg">Apply for Partnership</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
