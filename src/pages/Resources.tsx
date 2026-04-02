import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FileText, Shield, Monitor, Scale, DollarSign, HelpCircle } from "lucide-react";

const resources = [
  {
    title: "How to Notarize a Power of Attorney in Ohio",
    desc: "Step-by-step guide for notarizing POA documents including durable, springing, and healthcare powers of attorney under Ohio law.",
    icon: Scale,
    link: "/notary-guide",
    category: "Guide",
  },
  {
    title: "Remote Online Notarization (RON) Explained",
    desc: "Learn how Ohio's RON framework works under ORC §147.65-.66, including KBA requirements, session recording, and interstate acceptance.",
    icon: Monitor,
    link: "/ron-info",
    category: "Education",
  },
  {
    title: "Ohio Notary Fee Schedule & Calculator",
    desc: "Understand Ohio's statutory fee caps (ORC §147.08), travel fees, after-hours surcharges, and get an instant estimate for your signing.",
    icon: DollarSign,
    link: "/fee-calculator",
    category: "Tool",
  },
  {
    title: "What Documents Can Be Notarized?",
    desc: "Discover which documents require notarization, the difference between acknowledgments and jurats, and what a notary cannot do.",
    icon: FileText,
    link: "/notary-guide",
    category: "Guide",
  },
  {
    title: "ID Requirements for Notarization",
    desc: "Accepted forms of identification, expired ID policies, and special requirements for RON sessions including credential analysis.",
    icon: Shield,
    link: "/notary-guide#id-requirements",
    category: "Reference",
  },
  {
    title: "The Notarization Process Step by Step",
    desc: "From booking to e-seal — learn exactly what happens during an in-person or remote notarization appointment.",
    icon: HelpCircle,
    link: "/notary-guide-process",
    category: "Guide",
  },
];

export default function Resources() {
  usePageMeta({ title: "Notary Resources & Guides", description: "Free notary resources, Ohio compliance guides, document preparation tips, and helpful tools for signers and notaries." });

  return (
    <PageShell>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Breadcrumbs />
        <h1 className="mb-4 font-sans text-3xl font-bold text-foreground">Notary Resources & Guides</h1>
        <p className="mb-10 max-w-2xl text-muted-foreground">
          Educational resources to help you understand Ohio notarization requirements, prepare for your appointment, and make informed decisions about your document needs.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r, i) => (
            <Link key={i} to={r.link} className="group">
              <Card className="h-full border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <r.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{r.category}</Badge>
                  </div>
                  <h2 className="font-sans text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {r.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
