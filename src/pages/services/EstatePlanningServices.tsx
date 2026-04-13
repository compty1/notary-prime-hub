/**
 * Enhanced Estate Planning Services Module
 * Mockup-driven: numbered items, ORC references, pricing, time estimates
 */
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageShell } from "@/components/PageShell";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { ProductCalloutCard } from "@/components/shop/ProductCalloutCard";
import { Shield, Clock, FileText, CheckCircle, Scale, ArrowRight } from "lucide-react";

const ESTATE_SERVICES = [
  { num: 1, name: "Power of Attorney (POA)", orc: "ORC §1337.12", time: "30 min", price: "$25", desc: "Durable and limited POA preparation and notarization. Grants authority to act on behalf of another person." },
  { num: 2, name: "Living Will / Advance Directive", orc: "ORC §2133.02", time: "25 min", price: "$25", desc: "Healthcare directive notarization ensuring your medical wishes are documented and legally binding." },
  { num: 3, name: "Healthcare Power of Attorney", orc: "ORC §1337.11", time: "25 min", price: "$25", desc: "Designate someone to make medical decisions on your behalf if you become incapacitated." },
  { num: 4, name: "Trust Certification", orc: "ORC §5810.13", time: "30 min", price: "$25", desc: "Notarized certification of trust documents for financial institutions and real estate transactions." },
  { num: 5, name: "Last Will & Testament Witnessing", orc: "ORC §2107.03", time: "30 min", price: "$25", desc: "Witness services and notarization for last will and testament execution." },
  { num: 6, name: "Beneficiary Designation Forms", orc: "", time: "15 min", price: "$25", desc: "Notarization of beneficiary change forms for insurance, retirement, and financial accounts." },
];

export default function EstatePlanningServices() {
  return (
    <PageErrorBoundary pageName="Estate Planning">
      <PageShell title="Estate Planning Services" description="Comprehensive estate planning document preparation and notarization">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Hero */}
          <div className="mb-8">
            <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
              <Scale className="h-3 w-3 mr-1" /> Estate Planning
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Protect Your Family's Future
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Professional estate planning document preparation and notarization services. All documents comply with Ohio Revised Code requirements.
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 15-30 min per document</span>
              <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Ohio ORC Compliant</span>
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> Starting at $25/notarization</span>
            </div>
          </div>

          {/* Service List */}
          <div className="space-y-4 mb-8">
            {ESTATE_SERVICES.map(svc => (
              <Card key={svc.num} className="rounded-[24px] hover:shadow-md transition-shadow">
                <CardContent className="flex items-start gap-4 py-5">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-black text-primary">
                    {svc.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{svc.name}</h3>
                      {svc.orc && <Badge variant="outline" className="text-[10px]">{svc.orc}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{svc.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-lg">{svc.price}</p>
                    <p className="text-xs text-muted-foreground">{svc.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA + Shop Callout */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="rounded-[24px]">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-bold">Estate Plan Bundle</h3>
                <p className="text-sm text-muted-foreground">Get POA, Living Will, and Healthcare POA notarized together and save.</p>
                <ul className="text-sm space-y-1">
                  {["Power of Attorney", "Living Will", "Healthcare POA"].map(item => (
                    <li key={item} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />{item}</li>
                  ))}
                </ul>
                <Link to="/book">
                  <Button className="w-full rounded-full font-bold mt-2">
                    Book Estate Plan Bundle <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <ProductCalloutCard
                title="Notary Stamp & Supplies"
                description="Get your official Ohio notary stamp and supplies"
                price="From $29.99"
                linkTo="/shop"
              />
              <Card className="rounded-[24px] bg-muted/30">
                <CardContent className="pt-6">
                  <h4 className="font-bold text-sm mb-2">Important Notice</h4>
                  <p className="text-xs text-muted-foreground">
                    We provide document preparation and notarization services only. We are not attorneys and do not provide legal advice per ORC §4705.07. For legal counsel, please consult a licensed attorney.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageShell>
    </PageErrorBoundary>
  );
}
