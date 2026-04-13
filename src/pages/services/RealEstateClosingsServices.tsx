/**
 * Real Estate Closings Module — 4-step process flow, service list, coverage area
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { ProductCalloutCard } from "@/components/shop/ProductCalloutCard";
import { Home, Clock, MapPin, Shield, ArrowRight, Phone, FileSearch, Car, CheckCircle } from "lucide-react";

const PROCESS_STEPS = [
  { num: 1, icon: Phone, title: "Title Company Contact", desc: "Title company or lender contacts us to schedule the signing appointment." },
  { num: 2, icon: FileSearch, title: "Document Review", desc: "We receive and review the loan package to ensure completeness before the signing." },
  { num: 3, icon: Car, title: "Mobile Closing", desc: "Our signing agent travels to the borrower's location for a convenient closing experience." },
  { num: 4, icon: CheckCircle, title: "Return & Confirm", desc: "Signed documents are securely returned to the title company or lender within 24 hours." },
];

const SERVICES = [
  { name: "Mortgage Closings", price: "$150", desc: "Full loan package signing for residential purchases" },
  { name: "Deed Transfers", price: "$75", desc: "Property deed transfer notarization" },
  { name: "Refinance Signings", price: "$150", desc: "Refinance document package signing" },
  { name: "Title Affidavits", price: "$25", desc: "Title-related affidavit notarization" },
  { name: "Seller Packages", price: "$75", desc: "Seller closing document notarization" },
  { name: "HELOC Signings", price: "$125", desc: "Home equity line of credit document signing" },
];

const COVERAGE = ["Franklin", "Delaware", "Madison", "Pickaway", "Union", "Fayette", "Clark"];

export default function RealEstateClosingsServices() {
  return (
    <PageErrorBoundary pageName="Real Estate Closings">
      <PageShell title="Real Estate Closings" description="Professional mobile closing and loan signing services">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
            <Home className="h-3 w-3 mr-1" /> Real Estate Closings
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Mobile Real Estate Closings</h1>
          <p className="text-muted-foreground max-w-2xl mb-2">
            Professional loan signing agent services for residential and commercial real estate transactions across Central Ohio.
          </p>
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 45-90 min per signing</span>
            <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Starting at $150/signing</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> 7-County Central Ohio</span>
          </div>

          {/* Process Flow */}
          <h2 className="text-xl font-black mb-4">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {PROCESS_STEPS.map(step => (
              <Card key={step.num} className="rounded-[24px] text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">Step {step.num}</Badge>
                  <h3 className="font-bold text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Service List */}
          <h2 className="text-xl font-black mb-4">Services & Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {SERVICES.map(svc => (
              <Card key={svc.name} className="rounded-[24px]">
                <CardContent className="flex items-center justify-between py-4">
                  <div><h3 className="font-bold text-sm">{svc.name}</h3><p className="text-xs text-muted-foreground">{svc.desc}</p></div>
                  <span className="font-black text-lg text-primary shrink-0 ml-3">{svc.price}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coverage Area */}
          <Card className="rounded-[24px] mb-8">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Coverage Area</h3>
              <p className="text-sm text-muted-foreground mb-3">We serve 7 counties in Central Ohio:</p>
              <div className="flex flex-wrap gap-2">
                {COVERAGE.map(county => (
                  <Badge key={county} variant="secondary" className="rounded-full">{county} County</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/book"><Button size="lg" className="w-full rounded-full font-bold">Schedule a Closing <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            <ProductCalloutCard title="Professional Signing Kit" description="Mobile kit with all supplies for real estate closings" price="From $179" linkTo="/shop/professional" />
          </div>
        </div>
      </PageShell>
    </PageErrorBoundary>
  );
}
