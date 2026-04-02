import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function TermsPrivacy() {
  usePageMeta({ title: "Terms of Service & Privacy Policy", description: "Notar terms of service, privacy policy, and data handling practices. Learn how we protect your information." });
  return (
    <PageShell>

      <div className="container mx-auto max-w-3xl px-4 py-12 space-y-12">
        <Breadcrumbs />
        {/* Terms of Service */}
        <section>
          <h1 className="mb-6 font-sans text-3xl font-bold text-foreground">Terms of Service</h1>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p><strong>Effective Date:</strong> January 1, 2026</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">1. Services Provided</h2>
            <p>Notar Services ("we," "us") provides in-person and remote online notarization (RON) services in compliance with Ohio Revised Code §147 and all applicable Ohio laws. We are commissioned as a Notary Public in the State of Ohio, Franklin County.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">2. Eligibility</h2>
            <p>You must be at least 18 years old and possess a valid government-issued photo ID to use our notarization services. For RON sessions, you must also successfully complete Knowledge-Based Authentication (KBA) as required by ORC §147.65-.66. The signer must be of sound mind, acting voluntarily, and aware of the nature and consequences of the document being signed.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">3. Fees</h2>
            <p>Notary fees are governed by Ohio law. The statutory maximum per notarial act is $5.00 per signature (ORC §147.08). Additional fees for travel, technology platforms (RON), and KBA verification may apply and will be disclosed before your appointment.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">4. Cancellation & No-Show Policy</h2>
            <p>Appointments may be cancelled or rescheduled through the client portal. We request at least 2 hours' notice for cancellations. Repeated no-shows may result in a required deposit for future bookings.</p>
            <p><strong>Travel Fee Policy:</strong> For mobile notary appointments, travel fees are non-refundable once the notary has departed. If the signer fails to appear (no-show) or lacks valid identification upon arrival, the full travel fee plus a $25 service charge will apply. Payment for travel is due regardless of whether the notarization is completed.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">5. Notary Limitations</h2>
            <p>A notary public is not an attorney and cannot provide legal advice, draft legal documents, or counsel you on the content of documents. We notarize signatures — we do not validate the legal sufficiency of your documents.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">6. RON Session Recording</h2>
            <p>Per ORC §147.66, all RON sessions are audio/video recorded and stored securely for a minimum of 10 years. By participating in a RON session, you consent to this recording.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>Our liability is limited to the fees paid for the specific notarial act in question. We maintain a $25,000 surety bond as required by Ohio law. We are not liable for the legal consequences of documents you choose to notarize.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">8. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Ohio, Franklin County.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">9. Cancellation & Rescheduling</h2>
            <p>We request at least <strong>2 hours' notice</strong> for cancellations. Appointments may be rescheduled through the client portal at no charge with 2+ hours' notice. No-show fees of $25 may apply. For mobile appointments, travel fees are non-refundable once the notary has departed.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">10. After-Hours & Emergency Services</h2>
            <p>After-hours service (before 9 AM or after 7 PM Mon–Fri, Sundays) incurs a $25 surcharge. Rush/same-day appointments incur a $35 priority fee. All surcharges are disclosed before booking.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">11. Witness Services</h2>
            <p>We provide witnesses at $10 per witness per session. Some documents (wills, healthcare directives) have specific witness requirements under Ohio law. See our <a href="/notary-guide" className="text-primary hover:underline">Notary Guide</a> for details.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">12. Conflict of Interest</h2>
            <p>Per ORC §147.141, our notaries will decline to notarize any document in which they have a direct financial or beneficial interest, or in which a close family member is a party. Notaries will not notarize documents for transactions in which they are acting as an agent, broker, or representative.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* Privacy Policy */}
        <section>
          <h2 className="mb-6 font-sans text-3xl font-bold text-foreground">Privacy Policy</h2>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p><strong>Effective Date:</strong> January 1, 2026</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Information We Collect</h3>
            <p>We collect the following information to perform notarial services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full legal name, address, phone number, and email</li>
              <li>Government-issued photo ID information (type, number, expiration)</li>
              <li>Knowledge-Based Authentication (KBA) responses (for RON sessions)</li>
              <li>Audio/video recordings of RON sessions (required by Ohio law)</li>
              <li>Notary journal entries documenting each notarial act</li>
            </ul>

            <h3 className="font-sans text-lg font-semibold text-foreground">How We Use Your Information</h3>
            <p>Your information is used solely for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Performing and documenting notarial acts as required by law</li>
              <li>Communicating about your appointments</li>
              <li>Complying with Ohio recordkeeping requirements (ORC §147.551)</li>
              <li>Maintaining our notary journal for the legally required retention period</li>
            </ul>

            <h3 className="font-sans text-lg font-semibold text-foreground">Data Retention</h3>
            <p>Notary journal entries are retained for at least 5 years as required by ORC §147.551. RON session recordings are retained for at least 10 years per ORC §147.66. Account data is retained while your account is active.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Data Security</h3>
            <p>We use industry-standard security measures including encrypted data storage, secure authentication, and access controls. RON sessions use end-to-end encrypted video connections.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Your Rights</h3>
            <p>You may request access to or deletion of your personal information by contacting us. Note that we cannot delete notary journal entries or RON session recordings as they are legally required records.</p>

            <h3 className="font-sans text-lg font-semibold text-foreground">Contact</h3>
            <p>For questions about this privacy policy, contact Notar Services at the contact information provided on our website.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* Data Retention Policy */}
        <section>
          <h2 className="mb-6 font-sans text-3xl font-bold text-foreground">Data Retention Policy</h2>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p>In accordance with Ohio Revised Code, we retain records as follows:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Notary Journal Entries:</strong> Minimum 5 years from the date of the notarial act (ORC §147.551). Journal entries include signer name, ID type, date, type of act, and fee charged.</li>
              <li><strong>RON Session Recordings:</strong> Minimum 10 years (ORC §147.66). Audio/video recordings are stored in encrypted cloud storage with access restricted to the commissioned notary and authorized officials.</li>
              <li><strong>Client Account Data:</strong> Retained while your account is active and for 1 year after account closure, unless a longer period is required by law.</li>
              <li><strong>Payment Records:</strong> 7 years per IRS requirements.</li>
              <li><strong>Communication Logs:</strong> 2 years for appointment-related emails and messages.</li>
            </ul>
            <p>You may request deletion of non-legally-required data by contacting us. We cannot delete notary journal entries or RON recordings as they are mandatory legal records.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* Refund & Cancellation Policy */}
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
            <p>Contact us through your client portal or email us. Refunds are processed within 5-10 business days to the original payment method.</p>
          </div>
        </section>

        <hr className="border-border" />

        {/* Foreign Language Document Policy */}
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

        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <Shield className="h-5 w-5 flex-shrink-0 text-primary" />
          <span>We take your privacy seriously. All data handling complies with Ohio Revised Code §147 and applicable privacy regulations.</span>
        </div>
      </div>

    </PageShell>
  );
}
