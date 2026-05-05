/**
 * Renders a service FAQ list with Accordion answers and citation chips
 * linked to the Ohio Revised Code.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, HelpCircle } from "lucide-react";
import { faqJsonLd } from "@/lib/seoHelpers";
import { useEffect } from "react";
import type { ServiceFaqItem } from "@/lib/serviceFaqs";

interface ServiceFAQAccordionProps {
  items: ServiceFaqItem[];
  title?: string;
  /** Unique slug used for JSON-LD script id */
  slug?: string;
}

export function ServiceFAQAccordion({
  items,
  title = "Frequently Asked Questions",
  slug = "service",
}: ServiceFAQAccordionProps) {
  useEffect(() => {
    if (!items.length) return;
    const id = `faq-jsonld-${slug}`;
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(
      faqJsonLd(items.map((i) => ({ q: i.question, a: i.answer }))),
    );
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [items, slug]);

  if (!items.length) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h2 className="font-sans text-xl font-bold text-foreground">{title}</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {items.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="rounded-xl border border-border bg-card px-4"
          >
            <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4 text-sm text-muted-foreground">
              <p className="leading-relaxed">{faq.answer}</p>
              {faq.citations && faq.citations.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-medium text-foreground">
                    Sources:
                  </span>
                  {faq.citations.map((c, i) => (
                    <a
                      key={i}
                      href={
                        c.url ||
                        `https://codes.ohio.gov/search?q=${encodeURIComponent(c.label)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      title={c.description}
                      aria-label={`${c.label}${c.description ? ` — ${c.description}` : ""}`}
                    >
                      <Badge
                        variant="outline"
                        className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        {c.label}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default ServiceFAQAccordion;
