import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";

export default function TermsPrivacy() {
  return (
    <PageShell>

      <div className="container mx-auto max-w-3xl px-4 py-12 space-y-12">
        {/* Terms of Service */}
        <section>
          <h1 className="mb-6 font-sans text-3xl font-bold text-foreground">Terms of Service</h1>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p><strong>Effective Date:</strong> January 1, 2026</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">1. Services Provided</h2>
            <p>Notar Services ("we," "us") provides in-person and remote online notarization (RON) services in compliance with Ohio Revised Code §147 and all applicable Ohio laws. We are commissioned as a Notary Public in the State of Ohio, Franklin County.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">2. Eligibility</h2>
            <p>You must be at least 18 years old and possess a valid government-issued photo ID to use our notarization services. For RON sessions, you must also successfully complete Knowledge-Based Authentication (KBA) as required by ORC §147.65-.66.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">3. Fees</h2>
            <p>Notary fees are governed by Ohio law. The statutory maximum per notarial act is $5.00 per signature (ORC §147.08). Additional fees for travel, technology platforms (RON), and KBA verification may apply and will be disclosed before your appointment.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">4. Cancellation Policy</h2>
            <p>Appointments may be cancelled or rescheduled through the client portal. We request at least 2 hours' notice for cancellations. Repeated no-shows may result in a required deposit for future bookings.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">5. Notary Limitations</h2>
            <p>A notary public is not an attorney and cannot provide legal advice, draft legal documents, or counsel you on the content of documents. We notarize signatures — we do not validate the legal sufficiency of your documents.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">6. RON Session Recording</h2>
            <p>Per ORC §147.66, all RON sessions are audio/video recorded and stored securely for a minimum of 10 years. By participating in a RON session, you consent to this recording.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>Our liability is limited to the fees paid for the specific notarial act in question. We maintain a $25,000 surety bond as required by Ohio law. We are not liable for the legal consequences of documents you choose to notarize.</p>

            <h2 className="font-sans text-lg font-semibold text-foreground">8. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Ohio, Franklin County.</p>
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

        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <Shield className="h-5 w-5 flex-shrink-0 text-primary" />
          <span>We take your privacy seriously. All data handling complies with Ohio Revised Code §147 and applicable privacy regulations.</span>
        </div>
      </div>

    </PageShell>
  );
}
