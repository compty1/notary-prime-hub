import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "source_language", label: "Source Language", type: "text", required: true, placeholder: "e.g. Spanish, Arabic, Mandarin" },
  { name: "target_language", label: "Target Language", type: "text", required: true, placeholder: "e.g. English" },
  { name: "certification_level", label: "Certification Level", type: "select", required: true, options: [
    { value: "standard", label: "Standard Translation" },
    { value: "certified", label: "Certified Translation (with certificate of accuracy)" },
    { value: "court", label: "Court-Certified (with notarized affidavit)" },
  ]},
  { name: "purpose", label: "Purpose", type: "select", required: true, options: [
    { value: "uscis", label: "USCIS / Immigration" },
    { value: "court", label: "Court Filing" },
    { value: "academic", label: "Academic / University" },
    { value: "business", label: "Business / Corporate" },
    { value: "personal", label: "Personal Use" },
  ]},
  { name: "page_count", label: "Estimated Page Count", type: "number", placeholder: "1" },
  { name: "files", label: "Upload Documents", type: "file", required: true },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

const PACKAGES = [
  { id: "standard", name: "Standard Translation", price: "$30.00/page", description: "Professional translation without certification", features: ["Professional translator", "Proofreading included", "Digital delivery", "3–5 business days"] },
  { id: "certified", name: "Certified Translation", price: "$45.00/page", description: "With signed certificate of accuracy", features: ["ATA-certified translator", "Certificate of accuracy", "Accepted by USCIS", "Hard copy available"], popular: true },
  { id: "court", name: "Court-Certified", price: "$60.00/page", description: "Notarized affidavit for court use", features: ["Court-qualified translator", "Notarized translator affidavit", "Court-ready formatting", "Apostille available"] },
];

const ADD_ONS = [
  { id: "apostille", label: "Apostille Certification", price: "+$85.00", description: "For international use in Hague countries" },
  { id: "notarize", label: "Notarization", price: "+$5.00", description: "Notarize the certificate of accuracy" },
  { id: "rush", label: "Rush Processing", price: "+50%", description: "24–48 hour turnaround" },
  { id: "hard-copy", label: "Certified Hard Copy", price: "+$15.00", description: "Printed and mailed certified copy" },
];

const FAQ = [
  { q: "What is a certified translation?", a: "A certified translation includes a signed statement attesting that the translation is complete and accurate. Required by USCIS and most government agencies." },
  { q: "Which languages do you translate?", a: "We translate 50+ languages including Spanish, Arabic, Mandarin, French, German, Portuguese, Russian, Korean, Japanese, Vietnamese, and more." },
  { q: "Is the translation accepted by USCIS?", a: "Yes. Our certified translations meet USCIS requirements per 8 CFR 103.2(b)(3)." },
  { q: "How is pricing calculated?", a: "Pricing is per page of the source document. A 'page' is 250 words. Documents with fewer than 250 words are charged as one page." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Upload & Quote", description: "Submit documents and receive price quote" },
    { step: 2, label: "Translation", description: "Professional translator completes work" },
    { step: 3, label: "Quality Review", description: "Proofreading and accuracy check" },
    { step: 4, label: "Certification & Delivery", description: "Certificate attached, documents delivered" },
  ],
  turnaround: "3–7 business days (rush available)",
};

export default function CertifiedTranslation() {
  usePageMeta({ title: "Certified Translation Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="certified-translation"
        serviceTitle="Certified Translation Services"
        serviceDescription="Professional certified and court-certified translations accepted by USCIS, courts, and government agencies. 50+ languages."
        fields={FIELDS}
        estimatedPrice="From $30.00/page"
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
