import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, Mail } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export default function Accessibility() {
  usePageMeta({
    title: "Accessibility Statement",
    description: "Notar is committed to ensuring digital accessibility for all users in compliance with WCAG 2.1 AA standards.",
  });

  return (
    <PageShell>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Accessibility Statement</h1>
          </div>
          <p className="text-muted-foreground">Last updated: April 8, 2026</p>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Our Commitment</h2>
              <p className="text-muted-foreground leading-relaxed">
                Notar is committed to ensuring digital accessibility for people with disabilities.
                We are continually improving the user experience for everyone, and applying the relevant
                accessibility standards to ensure we provide equal access to all users.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Conformance Status</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Web Content Accessibility Guidelines (WCAG) defines requirements for designers
                and developers to improve accessibility for people with disabilities. Notar
                strives to conform to <strong>WCAG 2.1 Level AA</strong>. View the full guidelines at{" "}
                <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">w3.org/TR/WCAG21</a>.
              </p>
              <p className="text-xs text-muted-foreground"><strong>Last Accessibility Audit:</strong> March 15, 2026</p>
              <div className="space-y-3 mt-4">
                {[
                  "Semantic HTML structure with proper heading hierarchy",
                  "Keyboard navigable interface with visible focus indicators",
                  "ARIA labels and roles on interactive elements",
                  "Color contrast ratios meeting AA standards",
                  "Responsive design supporting zoom up to 200%",
                  "Alt text on all meaningful images",
                  "Skip-to-content navigation links",
                  "Form labels and error identification",
                  "Dark mode support for reduced eye strain",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Assistive Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Notar is designed to be compatible with the following assistive technologies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
                <li>Speech recognition software</li>
                <li>Screen magnification software</li>
                <li>Alternative keyboard and switch devices</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">RON Session Accessibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Remote Online Notarization (RON) sessions are designed with accessibility in mind.
                We support screen reader announcements during session state changes, keyboard-navigable
                controls for all session actions, and high-contrast mode for document review.
                If you require additional accommodations during a notarization session, please contact
                us in advance so we can arrange appropriate support.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">VPAT Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Voluntary Product Accessibility Template (VPAT) is available upon request.
                Contact <a href="mailto:shane@notardex.com" className="text-primary hover:underline">shane@notardex.com</a> to
                request a copy of our accessibility conformance report.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Feedback & Contact</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We welcome your feedback on the accessibility of Notar. If you encounter
                    accessibility barriers or have suggestions for improvement, please contact us:
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-foreground">
                    <p><strong>Email:</strong> <a href="mailto:shane@notardex.com" className="text-primary hover:underline">shane@notardex.com</a></p>
                    <p><strong>Phone:</strong> <a href="tel:6143006890" className="text-primary hover:underline">(614) 300-6890</a></p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    We aim to respond to accessibility feedback within 2 business days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
