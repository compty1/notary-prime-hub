/**
 * CC-004: Locale switcher component for DocuDex
 */
import { useState } from "react";
import { SUPPORTED_LOCALES, setLocale, getLocale, type SupportedLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LocaleSwitcher() {
  const [current, setCurrent] = useState<SupportedLocale>(getLocale());

  const handleChange = (locale: SupportedLocale) => {
    setLocale(locale);
    setCurrent(locale);
  };

  const currentConfig = SUPPORTED_LOCALES.find(l => l.code === current);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title="Language" aria-label="Action">
          <Globe className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map(locale => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleChange(locale.code)}
            className={current === locale.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{locale.flag}</span>
            <span>{locale.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
