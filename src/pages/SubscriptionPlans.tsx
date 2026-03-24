import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, ChevronLeft, Briefcase, Code, Award, Zap } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Notar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/services"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Services</Button></Link>
            <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 font-display text-4xl font-bold text-primary-foreground">Business Plans</h1>
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
                    <Badge className="bg-accent text-accent-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <plan.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="font-display text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.price === "Custom" ? "/#contact" : "/signup"}>
                    <Button className={`w-full ${plan.highlight ? "bg-accent text-accent-foreground hover:bg-gold-dark" : ""}`} variant={plan.highlight ? "default" : "outline"} size="lg">
                      {plan.cta}
                    </Button>
                  </Link>
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
            <Badge className="mb-3 bg-accent/10 text-accent"><Award className="mr-1 h-3 w-3" /> Partner Program</Badge>
            <h2 className="font-display text-2xl font-bold mb-2">White-Label & API Partners</h2>
            <p className="text-muted-foreground">Integrate notarization into your platform with our partner programs.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {partnerBenefits.map(b => (
              <Card key={b.label} className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-display text-sm font-semibold mb-1">{b.label}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/join"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-gold-dark">Apply for Partnership</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Notar — Ohio Notary & Document Services</p>
      </footer>
    </div>
  );
}
