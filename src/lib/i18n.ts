/**
 * Multi-language support utilities.
 * Enhancement #13 (Spanish priority for Ohio demographics)
 */

export type SupportedLocale = "en" | "es";

const TRANSLATIONS: Record<string, Record<SupportedLocale, string>> = {
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.services": { en: "Services", es: "Servicios" },
  "nav.about": { en: "About", es: "Acerca de" },
  "nav.contact": { en: "Contact", es: "Contacto" },
  "nav.login": { en: "Sign In", es: "Iniciar sesión" },
  "nav.book": { en: "Book Now", es: "Reservar ahora" },
  "booking.selectService": { en: "Select a Service", es: "Seleccionar un servicio" },
  "booking.selectDate": { en: "Select a Date", es: "Seleccionar una fecha" },
  "booking.selectTime": { en: "Select a Time", es: "Seleccionar una hora" },
  "booking.confirm": { en: "Confirm Booking", es: "Confirmar reserva" },
  "booking.success": { en: "Booking Confirmed!", es: "¡Reserva confirmada!" },
  "common.loading": { en: "Loading...", es: "Cargando..." },
  "common.error": { en: "An error occurred", es: "Ocurrió un error" },
  "common.save": { en: "Save", es: "Guardar" },
  "common.cancel": { en: "Cancel", es: "Cancelar" },
  "common.submit": { en: "Submit", es: "Enviar" },
  "common.search": { en: "Search", es: "Buscar" },
  "common.back": { en: "Back", es: "Volver" },
  "common.next": { en: "Next", es: "Siguiente" },
  "notary.findNotary": { en: "Find a Notary", es: "Encontrar un notario" },
  "notary.bookAppointment": { en: "Book Appointment", es: "Reservar cita" },
  "notary.mobileNotary": { en: "Mobile Notary", es: "Notario móvil" },
  "notary.ronSession": { en: "Remote Online Notarization", es: "Notarización remota en línea" },
  "footer.rights": { en: "All rights reserved", es: "Todos los derechos reservados" },
  "footer.privacy": { en: "Privacy Policy", es: "Política de privacidad" },
  "footer.terms": { en: "Terms of Service", es: "Términos de servicio" },
};

/** Get current locale from localStorage or browser */
export function getLocale(): SupportedLocale {
  const stored = localStorage.getItem("locale");
  if (stored === "es") return "es";
  // Auto-detect from browser
  const browserLang = navigator.language?.slice(0, 2);
  if (browserLang === "es") return "es";
  return "en";
}

/** Set locale */
export function setLocale(locale: SupportedLocale) {
  localStorage.setItem("locale", locale);
}

/** Translate a key */
export function t(key: string, locale?: SupportedLocale): string {
  const lang = locale || getLocale();
  return TRANSLATIONS[key]?.[lang] || TRANSLATIONS[key]?.en || key;
}
