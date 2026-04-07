import { useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield, FileText, CheckCircle, XCircle, AlertTriangle, Monitor, MapPin,
  ChevronRight, Stamp, Eye, Mic, Camera, BookOpen, Scale, Users, Clock
} from "lucide-react";
import juratExample from "@/assets/jurat-example.jpg";
import { PageShell } from "@/components/PageShell";

export default function NotaryProcessGuide() {
  const { user } = useAuth();

  usePageMeta({ title: "Notary Process Guide — Step by Step", description: "Step-by-step guide to the Ohio notarization process. Learn what to expect, what to bring, and how to prepare for your appointment." });

  return (
    <PageShell>
      {/* Nav */}

      {/* Hero */}
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <Breadcrumbs />
          <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
            <BookOpen className="mr-1 h-3 w-3" /> Provider Reference
          </Badge>
          <h1 className="mb-3 font-sans text-3xl font-bold text-white md:text-4xl">
            Notary Process Guide
          </h1>
          <p className="mx-auto max-w-2xl text-white/70">
            Comprehensive reference for notaries covering seal placement, signer deliverables, step-by-step procedures, and Ohio compliance requirements.
          </p>
        </div>
      </section>

      {/* Seal Placement Guide */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground flex items-center gap-2">
            <Stamp className="h-6 w-6 text-primary" /> Seal Placement Guide
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-3 font-sans text-lg font-semibold">Ohio Seal Requirements</h3>
                <p className="text-sm text-muted-foreground mb-3">Per ORC §147.04, the Ohio notary seal must contain:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Notary's full legal name</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> "Notary Public" designation</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> "State of Ohio"</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Commission expiration date</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-3 font-sans text-lg font-semibold">Placement Rules</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Place near (not on) the notary's signature</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Do NOT cover any text or signatures</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Apply on the same page as the notarial certificate</li>
                  <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" /> For acknowledgments: seal on the acknowledgment certificate</li>
                  <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" /> For jurats: seal on the jurat certificate below the oath</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Jurat example image */}
          <Card className="mt-6 border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img src={juratExample} alt="Example jurat certificate with seal placement" className="w-full h-auto object-cover" />
                </div>
                <div className="p-6 md:w-1/2 flex flex-col justify-center">
                  <h3 className="mb-2 font-sans text-lg font-semibold">Jurat Certificate Example</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This example shows proper seal placement on a jurat certificate. The seal is positioned near the notary's signature without covering any text.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Key elements:</strong></p>
                    <p>• "Subscribed and sworn to before me" — oath language</p>
                    <p>• Date of notarization</p>
                    <p>• Notary signature and printed name</p>
                    <p>• Commission expiration date</p>
                    <p>• Notary seal (embossed or stamped)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* In-Person Process */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> In-Person Notarization Process
          </h2>

          <div className="space-y-4">
            {[
              { step: 1, icon: Eye, title: "Verify Signer Identity", desc: "Check a valid government-issued photo ID. Verify the name matches the document. Check the ID is not expired. Record ID type, number, and expiration in the journal." },
              { step: 2, icon: FileText, title: "Review the Document", desc: "Confirm the document is complete (no blank spaces to be filled after notarization). Ensure the signer understands what they are signing. Check for the correct notarial certificate (acknowledgment vs. jurat)." },
              { step: 3, icon: Mic, title: "Administer Oath/Affirmation (if jurat)", desc: "For jurats: \"Do you solemnly swear (or affirm) that the statements in this document are true and correct to the best of your knowledge?\" Record the oath timestamp." },
              { step: 4, icon: FileText, title: "Witness Signing", desc: "For acknowledgments: signer acknowledges their signature (may have already signed). For jurats: signer must sign in the notary's presence. Any required witnesses must also sign." },
              { step: 5, icon: Stamp, title: "Complete Notarial Certificate & Seal", desc: "Fill in the notarial certificate completely — date, county, signer name. Sign your name as notary. Apply your official seal near your signature, not covering text." },
              { step: 6, icon: BookOpen, title: "Record Journal Entry", desc: "Document: date, signer name, address, ID details, document type, service performed, fee charged, oath administered (yes/no)." },
            ].map((s) => (
              <Card key={s.step} className="border-border/50">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="mb-1 font-sans font-semibold text-foreground flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-primary" /> {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* RON Process */}
      <section className="py-12 bg-muted/30 border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" /> RON Session Process
          </h2>

          <div className="space-y-4">
            {[
              { step: 1, icon: Camera, title: "Tech Check", desc: "Verify signer has a working webcam, microphone, and stable internet. Confirm they are using a supported browser. Audio/video recording begins automatically once the session starts." },
              { step: 2, icon: Shield, title: "Credential Analysis", desc: "Signer uploads their government-issued photo ID. The platform performs automated credential analysis — checking for tampering, expiration, and matching the signer's appearance via live video." },
              { step: 3, icon: Scale, title: "Knowledge-Based Authentication (KBA)", desc: "5 multiple-choice questions from public records. Signer must answer 4 of 5 correctly within 2 minutes. One retry permitted. If KBA fails twice, the session cannot proceed." },
              { step: 4, icon: Mic, title: "Administer Oath (if jurat)", desc: "For jurats, administer the oath verbally on the recorded video call. The oath timestamp is captured in the recording and journal." },
              { step: 5, icon: FileText, title: "E-Signing & E-Seal", desc: "Signer applies their electronic signature to the document(s). Notary applies the electronic notary seal and e-signature. Tamper-evident technology is applied to the completed document." },
              { step: 6, icon: BookOpen, title: "Journal Entry & Recording", desc: "Digital journal entry is created with all required details. The full audio/video recording is stored securely for a minimum of 10 years per ORC §147.66." },
            ].map((s) => (
              <Card key={s.step} className="border-border/50">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="mb-1 font-sans font-semibold text-foreground flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-primary" /> {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Signers Receive */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> What Signers Leave With
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-3 font-sans text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> In-Person Session
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Original notarized document(s) with seal</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Completed notarial certificate (acknowledgment or jurat)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Receipt with fee breakdown</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> E-seal verification link (if applicable)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-3 font-sans text-lg font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" /> RON Session
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Digitally notarized document(s) with e-seal</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Tamper-evident sealed PDF download</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Session recording access (stored 10+ years)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Digital receipt and verification link</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> KBA completion confirmation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Prohibited Acts & Common Mistakes */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" /> Prohibited Acts & Common Mistakes
          </h2>

          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "Notarizing your own signature", a: "Ohio law (ORC §147.141) prohibits notarizing your own signature or any document in which you are a named party." },
              { q: "Notarizing for family members (with financial interest)", a: "You cannot notarize a document if you have a direct financial or beneficial interest in the transaction. Notarizing for a spouse on a property deed, for example, is prohibited." },
              { q: "Notarizing without the signer present", a: "The signer MUST personally appear before the notary at the time of notarization. This means physical presence for in-person, or live audio/video for RON. Never notarize a pre-signed document unless performing an acknowledgment AND the signer personally appears." },
              { q: "Giving legal advice", a: "Notaries are NOT attorneys (unless separately licensed). Never advise signers on the legal effects of a document, which document to choose, or how to fill in blanks. Refer to an attorney." },
              { q: "Failing to complete the journal entry", a: "Ohio requires notaries to maintain a journal. Each notarization must be recorded with date, signer info, document type, ID details, and fee charged. Failure to maintain a journal can result in commission revocation." },
              { q: "Using an expired seal or commission", a: "Always verify your commission is current before notarizing. Using an expired seal invalidates the notarization and may result in liability." },
              { q: "Certifying copies of vital records", a: "Ohio notaries CANNOT certify copies of birth certificates, death certificates, or marriage certificates. These must be obtained from the issuing vital records office." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`prohibited-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                <AccordionTrigger className="text-left text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    {item.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Document-Specific Quick Reference */}
      <section className="py-12 border-t border-border/50">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground">Document-Specific Notes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Real Estate Closings", notes: "Seal every signature page. Include wire fraud awareness notice. Verify all parties named on the document are present." },
              { title: "Power of Attorney", notes: "Principal must be competent and willing. Cannot notarize for family members with financial interest. Some institutions require specific POA forms." },
              { title: "I-9 Employment Verification", notes: "Notary cannot complete Section 2 (employer section). Only verify identity of the employee in Section 1. Do NOT certify document authenticity." },
              { title: "Wills & Trusts", notes: "Ohio allows RON for wills, but 2 disinterested witnesses are still required. Witnesses may participate remotely. Consult with the estate planning attorney." },
            ].map((item) => (
              <Card key={item.title} className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="mb-2 font-sans font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/notary-guide">
              <Button variant="outline" size="lg">
                <FileText className="mr-2 h-4 w-4" /> Full Document Reference Guide <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
