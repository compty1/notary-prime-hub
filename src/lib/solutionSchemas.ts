/**
 * GB-0008/0009/0018/0019/0028/0029/0038/0039/0048/0049/0058/0059 —
 * FAQPage + Service JSON-LD payloads for each /solutions/* vertical page.
 *
 * Each entry returns a combined @graph so a single <script type="application/ld+json">
 * can ship both rich-result types. Consumed via usePageMeta({ schema }).
 */
import { combineSchemas, faqSchema, serviceSchema } from "@/lib/seoSchemas";

interface FAQ { question: string; answer: string }

interface VerticalSpec {
  slug: string;          // /solutions/<slug>
  serviceName: string;
  serviceDescription: string;
  priceRange?: string;
  faqs: FAQ[];
}

const VERTICALS: VerticalSpec[] = [
  {
    slug: "individuals",
    serviceName: "Personal Notary & Document Services for Ohio Residents",
    serviceDescription:
      "Wills, vehicle titles, affidavits, immigration documents, and Remote Online Notarization (RON) for Ohio individuals. ORC §147 compliant.",
    faqs: [
      { question: "Can I get my will notarized online in Ohio?", answer: "Yes. Ohio permits Remote Online Notarization (RON) for most wills when two witnesses participate live in the video session and statutory requirements under ORC §2107 are met." },
      { question: "How much does a vehicle title transfer notarization cost?", answer: "Ohio caps physical notarial acts at $5 per act under ORC §147. Mobile travel fees are billed separately and disclosed upfront." },
      { question: "What ID do I need for RON?", answer: "Government-issued photo ID (driver's license, state ID, or passport) plus Knowledge-Based Authentication (KBA) — 5 multiple-choice questions answered in under 2 minutes with 80% accuracy." },
      { question: "Do you notarize I-864 affidavits of support?", answer: "Yes. We routinely handle USCIS forms including I-864, I-130, I-485, and translation certifications for consular processing." },
      { question: "What if my signer is bedridden or in hospice?", answer: "We offer bedside mobile notary visits 7 days a week within our 50-mile Columbus, Ohio service radius." },
    ],
  },
  {
    slug: "small-business",
    serviceName: "Small Business Notary & Document Services in Ohio",
    serviceDescription:
      "Corporate resolutions, contracts, I-9 employment verification, and subscription plans for Ohio small businesses. Volume pricing available.",
    faqs: [
      { question: "Do you offer subscription notary plans?", answer: "Yes. Monthly plans start at $79 and include a fixed allotment of notarizations plus discounted overage rates." },
      { question: "Can you handle remote I-9 Employment Eligibility Verification?", answer: "Yes — through DHS-authorized E-Verify partner workflows and authorized representative procedures. We are not Department of Homeland Security." },
      { question: "How quickly can you complete a corporate document signing?", answer: "Same-day in most cases for our Columbus service area; RON sessions can be scheduled within 2 hours of booking." },
      { question: "Do you provide signing certificates for our records?", answer: "Every session generates a tamper-evident audit certificate with timestamps, IP address, ID verification proof, and the notary's commission number." },
      { question: "Can you sign an NDA before reviewing our documents?", answer: "Yes. We sign mutual NDAs on request and retain documents only for the 10-year statutory period required by Ohio RON law." },
    ],
  },
  {
    slug: "notaries",
    serviceName: "Notary Platform, Tools, and Commissioning Support",
    serviceDescription:
      "Join the Notar professional network. Access Ohio-authorized RON technology, client management, training, and revenue-share signing opportunities.",
    faqs: [
      { question: "What revenue share do contractor notaries earn?", answer: "Contractors receive 70% of completed signing fees; Notar retains 30% to cover platform, KBA, RON technology, and dispatch." },
      { question: "Do I need my own RON platform?", answer: "No. Our managed Ohio-approved RON workspace, e-seal, and journal are included for active contractors at no monthly cost." },
      { question: "Is training required before taking signings?", answer: "Yes — our 10-course Notary Academy is required before activation. It covers Ohio §147, RON technology, KBA, and loan-signing fundamentals." },
      { question: "What insurance is required?", answer: "Active $25,000 E&O insurance plus a current Ohio notary commission and bond. We can recommend providers." },
      { question: "How are payouts handled?", answer: "Weekly ACH payouts via Stripe Connect with a detailed earnings statement and IRS-aligned Schedule C export." },
    ],
  },
  {
    slug: "real-estate",
    serviceName: "Real Estate Closings, Deeds, and Title Notarizations in Ohio",
    serviceDescription:
      "Loan signings, deed transfers, title work, and lender packages — in-person and Remote Online Notarization (RON) for Ohio real estate transactions.",
    faqs: [
      { question: "Can refinance closings be completed via RON in Ohio?", answer: "Yes — Ohio RON law expressly authorizes refinance and home-equity closings; most major lenders and title underwriters accept Ohio RON eNotarizations." },
      { question: "Do you handle reverse mortgages?", answer: "Yes. Our certified loan signing agents complete reverse mortgage packages on-site, including the HUD-1, Closing Disclosure, and counseling certificates." },
      { question: "What is the turnaround for scan-backs?", answer: "Same-day scan-backs to lender/title within 2 business hours of signing; originals shipped via tracked FedEx or UPS next-business-day." },
      { question: "Are your signing agents NNA certified and background-screened?", answer: "Yes. All loan signing agents are NNA-certified, background-screened annually, and carry $100,000+ E&O." },
      { question: "How do you handle errors at the table?", answer: "We carry a stamp/printer kit for at-the-table corrections; lender re-draws are scanned and re-signed under the original signing fee." },
    ],
  },
  {
    slug: "law-firms",
    serviceName: "Legal Document Notarization for Ohio Law Firms",
    serviceDescription:
      "Affidavits, depositions, powers of attorney, court filings, and high-volume signings for Ohio law firms. Privilege-aware workflows.",
    faqs: [
      { question: "Are session recordings privileged?", answer: "RON recordings are retained for 10 years per Ohio law in encrypted storage. Access is restricted by RLS and requires admin/court authorization." },
      { question: "Can you accommodate jurat-vs-acknowledgment distinctions?", answer: "Yes — our journal and certificate engine select the correct certificate (jurat, acknowledgment, copy certification, oath/affirmation) based on the act type." },
      { question: "Do you sign authentications for apostille?", answer: "Yes. We handle notarizations preceding Ohio Secretary of State apostille/authentication and can submit on your behalf as a courier service." },
      { question: "How do you handle Signature-by-Mark?", answer: "We enforce two-witness gating in software per ORC §147 — the workflow is blocked until two witnesses are verified and identified." },
      { question: "What's your volume pricing?", answer: "Custom retainers for firms running 20+ signings per month — includes priority dispatch, dedicated account manager, and consolidated monthly invoicing." },
    ],
  },
  {
    slug: "hospitals",
    serviceName: "Bedside and Facility Notarization for Ohio Hospitals",
    serviceDescription:
      "HIPAA-aware bedside notarizations for healthcare directives, POA, beneficiary forms, and patient documents. ORC §147 and §2133 compliant.",
    faqs: [
      { question: "How quickly can a notary arrive bedside?", answer: "Same-day within our 50-mile Columbus radius; 2-hour priority dispatch available for ICU and hospice settings." },
      { question: "Can you notarize for a patient who cannot speak?", answer: "Yes — Ohio law permits Signature-by-Mark with two qualified witnesses. We verify mental capacity and willingness through documented observation; we do not provide legal or medical determinations." },
      { question: "Do you handle advance directives and living wills?", answer: "Yes. Healthcare POA, living wills, and DNR-related declarations notarized per Ohio §2133, with proper witness coordination." },
      { question: "Is your service HIPAA compliant?", answer: "We sign BAAs with healthcare facilities. PHI is handled per HIPAA Privacy and Security Rules; documents are stored in encrypted, RLS-protected storage." },
      { question: "Can you coordinate with case management?", answer: "Yes — our hospital portal lets case managers submit requests, attach documents, and track status without exposing PHI in email." },
    ],
  },
];

function buildGraph(spec: VerticalSpec) {
  return combineSchemas(
    faqSchema(spec.faqs),
    serviceSchema({
      name: spec.serviceName,
      description: spec.serviceDescription,
      url: `/solutions/${spec.slug}`,
      price: spec.priceRange,
    })
  );
}

export const SOLUTION_SCHEMAS: Record<string, ReturnType<typeof buildGraph>> = Object.fromEntries(
  VERTICALS.map((v) => [v.slug, buildGraph(v)])
);

export type SolutionSlug = (typeof VERTICALS)[number]["slug"];
