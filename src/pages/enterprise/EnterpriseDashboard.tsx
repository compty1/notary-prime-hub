import React from "react";
import { Rocket, FileCheck, ShieldCheck, Globe, Award, FileEdit, FolderOpen, Truck, Hammer, ScrollText, Package, Building2, Scale, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";

const tools = [
  { title: "AI Document Grader", description: "AI compliance analysis against ORC §147", icon: FileCheck, path: "/admin/enterprise/ai-grader", color: "text-blue-500" },
  { title: "KYC/OFAC Search", description: "OFAC sanctions list screening", icon: ShieldCheck, path: "/admin/enterprise/kyc-search", color: "text-red-500" },
  { title: "IP/Patent Hub", description: "USPTO patent search", icon: Globe, path: "/admin/enterprise/ip-hub", color: "text-purple-500" },
  { title: "Certificate Generator", description: "ORC-compliant notarial certificates", icon: Award, path: "/admin/enterprise/certificates", color: "text-amber-500" },
  { title: "Exhibit Stamper", description: "PDF exhibit label stamping", icon: FileEdit, path: "/admin/enterprise/exhibit-stamper", color: "text-green-500" },
  { title: "Digital Vault", description: "RON audit trails & hash verification", icon: FolderOpen, path: "/admin/enterprise/digital-vault", color: "text-cyan-500" },
  { title: "VIN Decoder", description: "NHTSA VIN decode & odometer forms", icon: Truck, path: "/admin/enterprise/auto-fleet", color: "text-orange-500" },
  { title: "Lien Center", description: "Construction lien & waiver management", icon: Hammer, path: "/admin/enterprise/lien-center", color: "text-rose-500" },
  { title: "Trust Scheduler", description: "Estate trust assets & Schedule A", icon: ScrollText, path: "/admin/enterprise/trust-scheduler", color: "text-indigo-500" },
  { title: "B2B Dispatch", description: "Bulk CSV signing requests", icon: Package, path: "/admin/enterprise/b2b-dispatch", color: "text-teal-500" },
  { title: "BOI/Compliance", description: "Corporate entity search & BOI reports", icon: Building2, path: "/admin/enterprise/corporate-compliance", color: "text-muted-foreground" },
  { title: "Immigration Hub", description: "Visa bulletin & translation affidavits", icon: Globe, path: "/admin/enterprise/immigration-hub", color: "text-emerald-500" },
  { title: "Apostille Matrix", description: "50-state apostille reference & fees", icon: Scale, path: "/admin/enterprise/apostille-matrix", color: "text-violet-500" },
  { title: "Brand Kits", description: "White-label document branding", icon: Palette, path: "/admin/enterprise/brand-settings", color: "text-pink-500" },
];

const EnterpriseDashboard = () => {
  return (
    <EnterpriseLayout title="Enterprise Tools" icon={Rocket} description="Professional-grade tools for notary and legal operations">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path}>
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] bg-muted ${tool.color}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-black">{tool.title}</h3>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </EnterpriseLayout>
  );
};

export default EnterpriseDashboard;
