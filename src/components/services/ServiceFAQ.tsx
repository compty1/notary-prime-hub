import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface FAQItem {
  q: string;
  a: string;
}

interface ServiceFAQProps {
  items: FAQItem[];
  title?: string;
}

export function ServiceFAQ({ items, title = "Frequently Asked Questions" }: ServiceFAQProps) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
