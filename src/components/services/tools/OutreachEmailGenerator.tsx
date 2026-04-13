import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Copy, Sparkles, Users, Building2, Scale, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TARGETS = [
  { id: "title_company", label: "Title Company", icon: Building2 },
  { id: "law_firm", label: "Law Firm", icon: Scale },
  { id: "real_estate_agent", label: "Real Estate Agent", icon: Briefcase },
  { id: "hospital", label: "Hospital/Facility", icon: Users },
  { id: "insurance", label: "Insurance Company", icon: Building2 },
  { id: "signing_service", label: "Signing Service", icon: Briefcase },
];

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  title_company: {
    subject: "Mobile & RON Notary Services — {your_name}",
    body: `Dear {contact_name},

I'm {your_name}, a commissioned Ohio notary public specializing in real estate closings and loan signings. I'm reaching out because I'd love to support {company_name} with reliable, professional notarization services.

Here's what I offer:
• Mobile notary services — I come to your clients at their convenience
• Remote Online Notarization (RON) — fully compliant with Ohio ORC §147.63
• Same-day and after-hours availability
• NNA-certified, E&O insured ($100,000 coverage)
• Electronic journal with tamper-proof records

I handle closings efficiently with a 99.8% first-pass signing rate and can process most packages within 45 minutes.

I'd welcome the opportunity to discuss how I can be a trusted notary resource for your team. May I schedule a brief introduction call?

Best regards,
{your_name}
{your_phone}
{your_email}`,
  },
  law_firm: {
    subject: "Professional Notary Services for {company_name}",
    body: `Dear {contact_name},

I'm {your_name}, a commissioned Ohio notary public writing to introduce my professional notarization services to {company_name}.

I understand law firms require precision, discretion, and reliability. Here's how I can help:
• On-site visits to your office or client locations
• RON sessions for remote clients (Ohio-compliant per ORC §147.63)
• After-hours and weekend availability for urgent matters
• Experience with estate planning, POA, affidavits, and corporate documents
• Complete journal records for compliance

I'm fully insured, background-checked, and maintain strict confidentiality standards.

Would you have 10 minutes this week for a brief call? I'd love to learn about your firm's notarization needs.

Respectfully,
{your_name}
{your_phone}`,
  },
  real_estate_agent: {
    subject: "Your Go-To Notary for Closings — {your_name}",
    body: `Hi {contact_name},

I'm {your_name}, a mobile notary in the {your_area} area. I help real estate agents like you ensure smooth closings by handling all notarization needs professionally and on time.

Why agents choose me:
• Flexible scheduling — evenings, weekends, same-day
• Mobile service — I come to your clients anywhere in {your_area}
• RON available for remote transactions
• Fast turnaround — documents returned within 24 hours
• NNA-certified with E&O insurance

I know how important closing day is for your clients. My goal is to make the notarization part seamless.

Can I add you to my network? I'd be happy to provide a complimentary first signing to demonstrate my service quality.

Best,
{your_name}
{your_phone}`,
  },
  hospital: {
    subject: "On-Call Notary Services for {company_name}",
    body: `Dear {contact_name},

I'm {your_name}, a commissioned Ohio notary public offering on-call notarization services for hospitals and care facilities.

Patients and families often need urgent notarization for:
• Powers of Attorney (healthcare & financial)
• Advance Directives and Living Wills
• HIPAA authorizations
• Insurance claims and affidavits

I provide:
• Bedside notarization with patience and sensitivity
• 24/7 availability for urgent needs
• Compliance with all Ohio notary laws
• Experience with signature-by-mark procedures (ORC §147.53)

I'd welcome the chance to become a trusted notary partner for your facility. Shall I send my credentials for your vendor approval process?

Sincerely,
{your_name}
{your_phone}`,
  },
  insurance: {
    subject: "Notarization Services for {company_name} Claims & Documents",
    body: `Dear {contact_name},

I'm {your_name}, a professional notary public serving the {your_area} area. I'd like to offer my services for {company_name}'s document notarization needs.

Insurance-specific services I provide:
• Claims affidavits and sworn statements
• Policy document notarization
• Powers of Attorney
• Proof of loss notarizations
• Mobile service to policyholders

I offer volume pricing for ongoing partnerships and can handle batch notarizations efficiently.

May I schedule a brief call to discuss a partnership?

Best regards,
{your_name}`,
  },
  signing_service: {
    subject: "Experienced Signing Agent Available — {your_name}",
    body: `Dear {contact_name},

I'm {your_name}, an NNA-certified signing agent based in {your_area}, Ohio. I'd like to join {company_name}'s notary panel.

My qualifications:
• Ohio Notary Commission (current through {commission_expiry})
• NNA Certified Signing Agent
• E&O Insurance: $100,000 coverage
• Background checked (NNA & state)
• RON certified (Ohio ORC §147.63)
• 99%+ on-time completion rate

Equipment:
• Dual-tray laser printer
• Professional scanner
• Mobile hotspot for remote locations
• Complete signing supplies

I'm available for assignments throughout {your_area} and surrounding counties. My standard turnaround for document return is same-day.

Please let me know your onboarding process and any additional requirements.

Best,
{your_name}
{your_phone}`,
  },
};

export function OutreachEmailGenerator() {
  const { toast } = useToast();
  const [target, setTarget] = useState("title_company");
  const [fields, setFields] = useState({
    your_name: "", contact_name: "", company_name: "", your_phone: "", your_email: "", your_area: "Columbus, OH", commission_expiry: "2028",
  });

  const template = TEMPLATES[target];
  const fillTemplate = (text: string) => {
    let result = text;
    Object.entries(fields).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val || `{${key}}`);
    });
    return result;
  };

  const filledSubject = fillTemplate(template.subject);
  const filledBody = fillTemplate(template.body);

  const copyAll = () => {
    navigator.clipboard.writeText(`Subject: ${filledSubject}\n\n${filledBody}`);
    toast({ title: "Email copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Cold Outreach Email Generator</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TARGETS.map(t => (
          <Button key={t.id} variant={target === t.id ? "default" : "outline"} size="sm" onClick={() => setTarget(t.id)} className="text-xs">
            <t.icon className="h-3 w-3 mr-1" />{t.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Your Name</Label><Input value={fields.your_name} onChange={e => setFields(f => ({ ...f, your_name: e.target.value }))} placeholder="Jane Smith" /></div>
        <div><Label className="text-xs">Contact Name</Label><Input value={fields.contact_name} onChange={e => setFields(f => ({ ...f, contact_name: e.target.value }))} placeholder="John Doe" /></div>
        <div><Label className="text-xs">Company Name</Label><Input value={fields.company_name} onChange={e => setFields(f => ({ ...f, company_name: e.target.value }))} placeholder="ABC Title Co." /></div>
        <div><Label className="text-xs">Your Area</Label><Input value={fields.your_area} onChange={e => setFields(f => ({ ...f, your_area: e.target.value }))} /></div>
        <div><Label className="text-xs">Your Phone</Label><Input value={fields.your_phone} onChange={e => setFields(f => ({ ...f, your_phone: e.target.value }))} placeholder="(614) 555-0100" /></div>
        <div><Label className="text-xs">Your Email</Label><Input value={fields.your_email} onChange={e => setFields(f => ({ ...f, your_email: e.target.value }))} placeholder="jane@example.com" /></div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Preview</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs"><strong>Subject:</strong> {filledSubject}</div>
          <pre className="text-xs whitespace-pre-wrap bg-muted rounded-lg p-3 max-h-64 overflow-y-auto font-sans">{filledBody}</pre>
          <Button onClick={copyAll} size="sm" className="w-full"><Copy className="h-4 w-4 mr-1" /> Copy Email</Button>
        </CardContent>
      </Card>
    </div>
  );
}
