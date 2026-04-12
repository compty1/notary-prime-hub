/**
 * NS-004: FAQ section for notary pages.
 * Displays common questions with Schema.org markup.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { getFaqJsonLd } from "@/lib/seoHelpers";
import { useEffect } from "react";

export interface FAQ {
  question: string;
  answer: string;
}

const DEFAULT_NOTARY_FAQS: FAQ[] = [
  {
    question: "What is Remote Online Notarization (RON)?",
    answer: "RON allows you to have documents notarized via a live audio-video session from anywhere. Ohio law (ORC §147.66) authorizes commissioned Ohio notaries to perform RON sessions using approved technology platforms.",
  },
  {
    question: "What do I need for a notarization appointment?",
    answer: "You'll need a valid government-issued photo ID (driver's license, passport, or state ID), the document(s) to be notarized, and for RON sessions, a device with camera, microphone, and internet access.",
  },
  {
    question: "How much does notarization cost?",
    answer: "Ohio law caps notary fees at $5 per notarial act for in-person services and $30 per act for RON sessions. Additional fees may apply for travel, technology, or rush services.",
  },
  {
    question: "How long does a notarization take?",
    answer: "Most standard notarizations take 15–30 minutes. Loan signings typically take 45–60 minutes. Estate planning bundles may take up to 60 minutes.",
  },
  {
    question: "Can I get same-day notarization?",
    answer: "Yes! We offer same-day appointments for most services, subject to availability. Book online or call us to check availability.",
  },
  {
    question: "What types of documents can be notarized?",
    answer: "Most legal documents can be notarized, including affidavits, powers of attorney, deeds, contracts, estate planning documents, and more. Some documents have specific requirements — contact us if you're unsure.",
  },
  {
    question: "Is RON legal in Ohio?",
    answer: "Yes. Ohio House Bill 315 (effective September 2019) and ORC Chapter 147 authorize Remote Online Notarization for Ohio-commissioned notaries.",
  },
  {
    question: "Do you serve areas outside Ohio?",
    answer: "For RON services, signers can be located anywhere in the US (the notary must be Ohio-commissioned). For in-person and mobile services, we primarily serve Central Ohio.",
  },
];

interface NotaryFAQProps {
  faqs?: FAQ[];
  notaryName?: string;
}

export function NotaryFAQ({ faqs, notaryName }: NotaryFAQProps) {
  const displayFaqs = faqs?.length ? faqs : DEFAULT_NOTARY_FAQS;

  // Inject FAQ structured data
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(getFaqJsonLd(displayFaqs));
    script.id = "notary-faq-jsonld";
    const existing = document.getElementById("notary-faq-jsonld");
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [displayFaqs]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold text-foreground">
          {notaryName ? `FAQ — ${notaryName}` : "Frequently Asked Questions"}
        </h3>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {displayFaqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
