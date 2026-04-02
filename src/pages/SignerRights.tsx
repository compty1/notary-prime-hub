import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, Scale, Eye, Phone, UserX, Monitor, Clock } from "lucide-react";

const rights = [
  { icon: UserX, title: "Right to Refuse", desc: "You may refuse to proceed with notarization at any time without penalty. No notary can compel you to sign a document." },
  { icon: Monitor, title: "Right to Choose In-Person", desc: "You always have the option to request in-person notarization instead of remote online notarization (RON)." },
  { icon: Eye, title: "Right to Read Your Document", desc: "You have the right to read and understand your document before signing. Never sign a document you haven't read or don't understand." },
  { icon: Scale, title: "Right to Understand the Process", desc: "The notary must explain the notarial act being performed and answer any procedural questions before proceeding." },
  { icon: Shield, title: "Right to Privacy", desc: "Your identity verification documents and personal information are handled securely and in compliance with Ohio data protection standards." },
  { icon: Clock, title: "10-Year Data Retention", desc: "Per Ohio ORC §147.66, RON session recordings and journal entries are retained for a minimum of 10 years for your protection." },
  { icon: Phone, title: "Right to Report Misconduct", desc: "If you believe a notary acted improperly, you may file a complaint with the Ohio Secretary of State at (614) 466-3910." },
  { icon: CheckCircle, title: "Right to a Certified Copy", desc: "You are entitled to receive a certified copy of the notarial certificate and e-seal verification for your records." },
];

export default function SignerRights() {
  usePageMeta({
    title: "Signer Bill of Rights",
    description: "Know your rights as a signer. Ohio notary signer protections including right to refuse, privacy, and 10-year data retention under ORC §147.66.",
  });

  return (
    <PageShell>
      <Breadcrumbs />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Signer Bill of Rights</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            As a signer, you are protected by Ohio notary law and professional ethics standards. 
            Here are your rights during any notarization — in-person or remote.
          </p>
        </div>

        <div className="space-y-4">
          {rights.map((r, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-lg bg-muted/50 border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            These rights are informed by Ohio Revised Code Chapter 147 and the National Notary Association's best practices.
            If you have questions about your rights as a signer, contact us at{" "}
            <a href="tel:6143006890" className="text-primary hover:underline">(614) 300-6890</a> or{" "}
            <a href="mailto:contact@notardex.com" className="text-primary hover:underline">contact@notardex.com</a>.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
