/**
 * Business Contracts Module — mockup-driven
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { ProductCalloutCard } from "@/components/shop/ProductCalloutCard";
import { Briefcase, Clock, Shield, ArrowRight } from "lucide-react";

const BUSINESS_SERVICES = [
  { num: 1, name: "Articles of Incorporation", time: "30 min", price: "$25", desc: "Notarization of corporate formation documents for Ohio Secretary of State filing." },
  { num: 2, name: "Operating Agreements", time: "25 min", price: "$25", desc: "LLC operating agreement notarization for member signatures." },
  { num: 3, name: "Partnership Agreements", time: "25 min", price: "$25", desc: "General and limited partnership agreement notarization." },
  { num: 4, name: "Commercial Leases", time: "30 min", price: "$25", desc: "Commercial property lease notarization for landlords and tenants." },
  { num: 5, name: "Vendor Contracts", time: "20 min", price: "$25", desc: "Vendor and supplier contract notarization for businesses." },
  { num: 6, name: "Corporate Resolutions", time: "20 min", price: "$25", desc: "Board resolution and corporate action document notarization." },
];

export default function BusinessContractsServices() {
  return (
    <PageErrorBoundary pageName="Business Contracts">
      <PageShell>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
            <Briefcase className="h-3 w-3 mr-1" /> Business Contracts
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Business Document Notarization
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-2">
            Professional notarization for all business formation and contract documents.
          </p>
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 20-40 min per document</span>
            <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Starting at $25/notarization</span>
          </div>

          <div className="space-y-4 mb-8">
            {BUSINESS_SERVICES.map(svc => (
              <Card key={svc.num} className="rounded-[24px] hover:shadow-md transition-shadow">
                <CardContent className="flex items-start gap-4 py-5">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary">{svc.num}</div>
                  <div className="flex-1"><h3 className="font-bold">{svc.name}</h3><p className="text-sm text-muted-foreground mt-1">{svc.desc}</p></div>
                  <div className="text-right shrink-0"><p className="font-black text-lg">{svc.price}</p><p className="text-xs text-muted-foreground">{svc.time}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/book"><Button size="lg" className="w-full rounded-full font-bold">Book Business Notarization <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            <ProductCalloutCard title="Business Builder Package" description="Stamps, cards, and digital tools for your business" price="From $349" linkTo="/shop/business-builder" />
          </div>
        </div>
      </PageShell>
    </PageErrorBoundary>
  );
}
