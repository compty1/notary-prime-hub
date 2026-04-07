import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Shield, Scale, Lock, FileCheck2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsPrivacy() {
  usePageMeta({ title: "Terms of Service & Privacy Policy | NotarDex", description: "NotarDex terms of service, privacy policy, data retention, refund policy, and foreign language document policy. Learn how we protect your information under Ohio law." });
  return (
    <PageShell>
      <div className="container mx-auto max-w-3xl px-4 py-12 space-y-12">
        <Breadcrumbs />

        {/* ====== TERMS OF SERVICE ====== */}
        <section>
          <h1 className="mb-6 font-sans text-3xl font-bold text-foreground">Terms of Service</h1>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p><strong>Effective Date:</strong> January 1, 2026</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using the NotarDex platform ("Platform"), including our website, mobile applications, and Remote Online Notarization (RON) services, you agree to be bound by these Terms of Service. If you do not agree, do not use our services.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">2. Services Provided</h2>
            <p>NotarDex provides in-person and remote online notarization (RON) services, document preparation assistance, document digitization, apostille facilitation, and related business document services. Our RON services operate in compliance with Ohio Revised Code §147.60–147.66 and all applicable Ohio laws. Our notaries are commissioned as Notaries Public in the State of Ohio.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">3. Eligibility</h2>
            <p>You must be at least 18 years old and possess a valid, unexpired government-issued photo ID to use our notarization services. For RON sessions, you must also successfully complete Knowledge-Based Authentication (KBA) as required by ORC §147.65–.66. The signer must be of sound mind, acting voluntarily, and aware of the nature and consequences of the document being signed.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">4. Identity Verification</h2>
            <p>For RON sessions, you will undergo multi-factor identity verification including credential analysis of your government-issued ID and Knowledge-Based Authentication (KBA). You are permitted a maximum of 2 KBA attempts. If KBA fails, the session will be terminated and you may need to schedule a new appointment or use in-person services. By proceeding with identity verification, you consent to the collection and processing of your identification documents and biometric data for verification purposes.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">5. User Responsibilities</h2>
            <p>You are responsible for: providing accurate and truthful information; ensuring documents are complete and ready for notarization; maintaining the security of your account credentials; complying with all applicable laws regarding the documents you present; and appearing for scheduled appointments or providing timely cancellation notice.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">6. Notary Responsibilities & Limitations</h2>
            <p>Our notaries will: verify your identity per Ohio law; confirm your willingness and awareness; administer oaths when required; apply official notary seals; and maintain journal entries. A notary public is not an attorney and cannot provide legal advice, draft legal documents, or counsel you on the content or legal consequences of documents. We notarize signatures — we do not validate the legal sufficiency of your documents.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">7. Fees & Payment</h2>
            <p>Notary fees comply with Ohio law. The statutory maximum per notarial act is $5.00 per signature (ORC §147.08). Additional fees for travel, technology platform (RON), KBA verification, after-hours service, and witness services are disclosed before your appointment. All prices shown on our platform are inclusive of applicable service fees unless otherwise stated. Payment is due at the time of service.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">8. RON Session Recording</h2>
            <p>Per ORC §147.66, all RON sessions are audio/video recorded and stored securely for a minimum of 10 years. By participating in a RON session, you expressly consent to this recording. You may not record the session independently without the notary's consent.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">9. Cancellation & No-Show Policy</h2>
            <p>We request at least 2 hours' notice for cancellations. Appointments may be rescheduled through the client portal at no charge with 2+ hours' notice. No-show fees of $25 may apply. For mobile appointments, travel fees are non-refundable once the notary has departed. If the signer fails to appear or lacks valid identification upon arrival, the full travel fee plus a $25 service charge will apply.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">10. Prohibited Uses</h2>
            <p>You may not use NotarDex to: notarize documents you know to be fraudulent or illegal; impersonate another person during identity verification; submit falsified identification documents; circumvent identity verification requirements; or notarize prohibited documents (e.g., Ohio vital records including birth, death, and marriage certificates).</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">11. Intellectual Property</h2>
            <p>All content, features, and functionality of the NotarDex platform — including text, graphics, logos, icons, images, and software — are the exclusive property of NotarDex and protected by copyright, trademark, and other intellectual property laws.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">12. Limitation of Liability</h2>
            <p>Our liability is limited to the fees paid for the specific notarial act in question. We maintain a $25,000 surety bond as required by Ohio law and carry E&O insurance. We are not liable for the legal consequences of documents you choose to notarize, for system outages beyond our control, or for any indirect, incidental, or consequential damages.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">13. Dispute Resolution</h2>
            <p>Any disputes arising from these terms shall be resolved through binding arbitration in Franklin County, Ohio, under the rules of the American Arbitration Association. You agree to waive any right to a jury trial. Small claims court actions may be filed in Franklin County.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">14. Termination</h2>
            <p>We may suspend or terminate your access to the platform at any time for violation of these terms, suspected fraudulent activity, or failure to pay fees. You may close your account through the client portal or by contacting us. Notary journal entries and RON session recordings will be retained per legal requirements regardless of account status.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">15. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Ohio, Franklin County. Any legal proceedings shall be brought exclusively in the courts of Franklin County, Ohio.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">16. After-Hours & Emergency Services</h2>
            <p>After-hours service (before 9 AM or after 7 PM Mon–Fri, Sundays) incurs a $25 surcharge. Rush/same-day appointments incur a $35 priority fee. All surcharges are disclosed before booking.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">17. Witness Services</h2>
            <p>We provide witnesses at $10 per witness per session. Some documents (wills, healthcare directives) have specific witness requirements under Ohio law. See our <Link to="/notary-guide" className="text-primary hover:underline">Notary Guide</Link> for details.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">18. Conflict of Interest</h2>
            <p>Per ORC §147.141, our notaries will decline to notarize any document in which they have a direct financial or beneficial interest, or in which a close family member is a party.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* ====== PRIVACY POLICY ====== */}
        <section>
          <h2 className="mb-6 font-sans text-3xl font-bold text-foreground">Privacy Policy</h2>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p><strong>Effective Date:</strong> January 1, 2026</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Information We Collect</h3>
            <p>We collect information in the following categories:</p>
            <p><strong>A. Identity Information:</strong> Full legal name, date of birth, address, phone number, and email address.</p>
            <p><strong>B. Identification Documents:</strong> Government-issued photo ID information (type, number, expiration, issuing state/country). ID images are processed for credential analysis and are not stored after verification is complete.</p>
            <p><strong>C. Biometric Data:</strong> Facial recognition data used during RON sessions for identity verification. This data is processed in real time and is not stored beyond the session verification period. By using our RON services, you consent to the collection and processing of biometric data for identity verification purposes as required by Ohio law.</p>
            <p><strong>D. Session Data:</strong> Knowledge-Based Authentication (KBA) question responses, audio/video recordings of RON sessions (required by ORC §147.66), IP addresses, device information, and geolocation data.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">How We Use Your Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Performing and documenting notarial acts as required by Ohio law</li>
              <li>Verifying your identity through credential analysis, KBA, and biometric comparison</li>
              <li>Communicating about your appointments and services</li>
              <li>Complying with Ohio recordkeeping requirements (ORC §147.551)</li>
              <li>Maintaining our notary journal for the legally required retention period</li>
              <li>Improving our services and platform functionality</li>
              <li>Processing payments and preventing fraud</li>
            </ul>

            <h3 className="font-sans text-lg font-semibold text-foreground">How We Share Your Information</h3>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Identity verification service providers (for KBA and credential analysis)</li>
              <li>Payment processors (Stripe) for transaction processing</li>
              <li>Cloud infrastructure providers for secure data storage</li>
              <li>Law enforcement or government agencies when required by valid legal process</li>
            </ul>

            <h3 className="font-sans text-lg font-semibold text-foreground">Data Retention</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Notary Journal Entries:</strong> Minimum 5 years (ORC §147.551)</li>
              <li><strong>RON Session Recordings:</strong> Minimum 10 years (ORC §147.66)</li>
              <li><strong>Client Account Data:</strong> While active + 1 year after closure</li>
              <li><strong>Payment Records:</strong> 7 years per IRS requirements</li>
              <li><strong>Communication Logs:</strong> 2 years</li>
            </ul>

            <h3 className="font-sans text-lg font-semibold text-foreground">Data Security</h3>
            <p>We use industry-standard security measures including AES-256 encrypted data storage, TLS 1.2+ transport encryption, secure authentication with session token rotation, RBAC access controls, and continuous security monitoring. RON sessions use end-to-end encrypted video connections. See our <Link to="/security" className="text-primary hover:underline">Security Overview</Link> for full details.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Cookies</h3>
            <p>We use essential cookies for authentication and session management. We use analytics cookies to understand usage patterns and improve our platform. You can manage cookie preferences through our cookie consent banner.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Children's Privacy</h3>
            <p>NotarDex is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from minors. If we become aware of such collection, we will delete the data promptly.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Your Rights</h3>
            <p>You may request access to, correction of, or deletion of your personal information by contacting us through your client portal or by email. Note that we cannot delete notary journal entries or RON session recordings as they are legally required records under Ohio law.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Contact</h3>
            <p>For questions about this privacy policy, contact NotarDex at the contact information provided on our website or email <a href="mailto:privacy@notardex.com" className="text-primary hover:underline">privacy@notardex.com</a>.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* ====== REFUND & CANCELLATION ====== */}
        <section>
          <h2 className="mb-6 font-sans text-3xl font-bold text-foreground">Refund & Cancellation Policy</h2>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <h3 className="font-sans text-lg font-semibold text-foreground">Cancellations</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>2+ hours before appointment:</strong> Full refund (minus processing fees)</li>
              <li><strong>Less than 2 hours before:</strong> 50% refund</li>
              <li><strong>No-show:</strong> No refund. A $25 no-show fee applies.</li>
            </ul>
            <h3 className="font-sans text-lg font-semibold text-foreground">Refunds</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Notarization fees are <strong>non-refundable</strong> once the notarial act has been performed.</li>
              <li>If the notary is unable to complete the act (e.g., signer fails KBA, expired ID), the notarization fee is refunded but platform/tech fees are not.</li>
              <li>Travel fees for mobile appointments are <strong>non-refundable</strong> once the notary has departed.</li>
            </ul>
            <h3 className="font-sans text-lg font-semibold text-foreground">How to Request a Refund</h3>
            <p>Contact us through your client portal or email us. Refunds are processed within 5–10 business days to the original payment method.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* ====== FOREIGN LANGUAGE ====== */}
        <section>
          <h2 className="mb-6 font-sans text-3xl font-bold text-foreground">Foreign Language Document Policy</h2>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p>Ohio law requires the notary to be able to communicate directly with the signer. For documents in foreign languages:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The <strong>notarial certificate</strong> (jurat, acknowledgment) must be in English.</li>
              <li>The signer must understand what they are signing. If needed, bring a qualified interpreter — they cannot be a party to the document.</li>
              <li>Notaries are not required to read or understand the foreign-language content of the document, but they must verify the signer's identity and willingness.</li>
              <li>For certified translation services, see our <Link to="/services" className="text-primary hover:underline">Translation Coordination service</Link>.</li>
              <li>Apostille/authentication for foreign-language documents may require additional processing time.</li>
            </ul>
          </div>
        </section>

        {/* Compliance Badge */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">
                We take your privacy seriously. All data handling complies with Ohio Revised Code §147 and applicable privacy regulations.
                <Link to="/compliance" className="ml-1 text-primary hover:underline">View full compliance details →</Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
