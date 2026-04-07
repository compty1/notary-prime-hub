import { Phone } from "lucide-react";

export function MobileFAB() {
  return (
    <a
      href="tel:6143006890"
      aria-label="Call Notar"
      className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-20" />
      <Phone className="h-6 w-6" />
    </a>
  );
}
