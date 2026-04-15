/**
 * Multi-language support utilities.
 * Enhancement #13 (Spanish priority for Ohio demographics)
 * CC-004: Extended to 5 languages + RTL support
 */

export type SupportedLocale = "en" | "es" | "fr" | "de" | "ar";

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
];

const TRANSLATIONS: Record<string, Partial<Record<SupportedLocale, string>>> = {
  // Navigation
  "nav.home": { en: "Home", es: "Inicio", fr: "Accueil", de: "Startseite", ar: "الرئيسية" },
  "nav.services": { en: "Services", es: "Servicios", fr: "Services", de: "Dienstleistungen", ar: "الخدمات" },
  "nav.about": { en: "About", es: "Acerca de", fr: "À propos", de: "Über uns", ar: "عنّا" },
  "nav.contact": { en: "Contact", es: "Contacto", fr: "Contact", de: "Kontakt", ar: "اتصل بنا" },
  "nav.login": { en: "Sign In", es: "Iniciar sesión", fr: "Se connecter", de: "Anmelden", ar: "تسجيل الدخول" },
  "nav.book": { en: "Book Now", es: "Reservar ahora", fr: "Réserver", de: "Jetzt buchen", ar: "احجز الآن" },
  // Booking
  "booking.selectService": { en: "Select a Service", es: "Seleccionar un servicio", fr: "Choisir un service", de: "Dienst auswählen", ar: "اختر خدمة" },
  "booking.selectDate": { en: "Select a Date", es: "Seleccionar una fecha", fr: "Choisir une date", de: "Datum auswählen", ar: "اختر تاريخ" },
  "booking.selectTime": { en: "Select a Time", es: "Seleccionar una hora", fr: "Choisir une heure", de: "Zeit auswählen", ar: "اختر وقت" },
  "booking.confirm": { en: "Confirm Booking", es: "Confirmar reserva", fr: "Confirmer", de: "Buchung bestätigen", ar: "تأكيد الحجز" },
  "booking.success": { en: "Booking Confirmed!", es: "¡Reserva confirmada!", fr: "Réservation confirmée!", de: "Buchung bestätigt!", ar: "!تم تأكيد الحجز" },
  // Common
  "common.loading": { en: "Loading...", es: "Cargando...", fr: "Chargement...", de: "Laden...", ar: "...جاري التحميل" },
  "common.error": { en: "An error occurred", es: "Ocurrió un error", fr: "Une erreur est survenue", de: "Ein Fehler ist aufgetreten", ar: "حدث خطأ" },
  "common.save": { en: "Save", es: "Guardar", fr: "Enregistrer", de: "Speichern", ar: "حفظ" },
  "common.cancel": { en: "Cancel", es: "Cancelar", fr: "Annuler", de: "Abbrechen", ar: "إلغاء" },
  "common.submit": { en: "Submit", es: "Enviar", fr: "Soumettre", de: "Absenden", ar: "إرسال" },
  "common.search": { en: "Search", es: "Buscar", fr: "Rechercher", de: "Suchen", ar: "بحث" },
  "common.back": { en: "Back", es: "Volver", fr: "Retour", de: "Zurück", ar: "رجوع" },
  "common.next": { en: "Next", es: "Siguiente", fr: "Suivant", de: "Weiter", ar: "التالي" },
  "common.confirm": { en: "Confirm", es: "Confirmar", fr: "Confirmer", de: "Bestätigen", ar: "تأكيد" },
  "common.delete": { en: "Delete", es: "Eliminar", fr: "Supprimer", de: "Löschen", ar: "حذف" },
  "common.success": { en: "Success", es: "Éxito", fr: "Succès", de: "Erfolg", ar: "نجاح" },
  "common.page": { en: "Page", es: "Página", fr: "Page", de: "Seite", ar: "صفحة" },
  "common.of": { en: "of", es: "de", fr: "sur", de: "von", ar: "من" },
  "common.elements": { en: "elements", es: "elementos", fr: "éléments", de: "Elemente", ar: "عناصر" },
  // Notary
  "notary.findNotary": { en: "Find a Notary", es: "Encontrar un notario", fr: "Trouver un notaire", de: "Notar finden", ar: "ابحث عن كاتب عدل" },
  "notary.bookAppointment": { en: "Book Appointment", es: "Reservar cita", fr: "Prendre rendez-vous", de: "Termin buchen", ar: "حجز موعد" },
  "notary.mobileNotary": { en: "Mobile Notary", es: "Notario móvil", fr: "Notaire mobile", de: "Mobiler Notar", ar: "كاتب عدل متنقل" },
  "notary.ronSession": { en: "Remote Online Notarization", es: "Notarización remota en línea", fr: "Notarisation en ligne", de: "Online-Notarisation", ar: "التوثيق عن بعد" },
  // Footer
  "footer.rights": { en: "All rights reserved", es: "Todos los derechos reservados", fr: "Tous droits réservés", de: "Alle Rechte vorbehalten", ar: "جميع الحقوق محفوظة" },
  "footer.privacy": { en: "Privacy Policy", es: "Política de privacidad", fr: "Politique de confidentialité", de: "Datenschutz", ar: "سياسة الخصوصية" },
  "footer.terms": { en: "Terms of Service", es: "Términos de servicio", fr: "Conditions d'utilisation", de: "Nutzungsbedingungen", ar: "شروط الخدمة" },
  // DocuDex Editor
  "editor.title": { en: "Document Editor", es: "Editor de Documentos", fr: "Éditeur de Documents", de: "Dokumenten-Editor", ar: "محرر المستندات" },
  "editor.untitled": { en: "Untitled Document", es: "Documento sin título", fr: "Document sans titre", de: "Unbenanntes Dokument", ar: "مستند بدون عنوان" },
  "editor.save": { en: "Save", es: "Guardar", fr: "Enregistrer", de: "Speichern", ar: "حفظ" },
  "editor.export": { en: "Export", es: "Exportar", fr: "Exporter", de: "Exportieren", ar: "تصدير" },
  "editor.undo": { en: "Undo", es: "Deshacer", fr: "Annuler", de: "Rückgängig", ar: "تراجع" },
  "editor.redo": { en: "Redo", es: "Rehacer", fr: "Rétablir", de: "Wiederholen", ar: "إعادة" },
  "editor.addPage": { en: "Add Page", es: "Añadir Página", fr: "Ajouter une Page", de: "Seite hinzufügen", ar: "إضافة صفحة" },
  "editor.zoom": { en: "Zoom", es: "Zoom", fr: "Zoom", de: "Zoom", ar: "تكبير" },
  "editor.grid": { en: "Toggle Grid", es: "Mostrar Cuadrícula", fr: "Afficher la Grille", de: "Raster anzeigen", ar: "عرض الشبكة" },
  "editor.rulers": { en: "Toggle Rulers", es: "Mostrar Reglas", fr: "Afficher les Règles", de: "Lineale anzeigen", ar: "عرض المساطر" },
  "editor.layers": { en: "Layers", es: "Capas", fr: "Calques", de: "Ebenen", ar: "الطبقات" },
  "editor.comments": { en: "Comments", es: "Comentarios", fr: "Commentaires", de: "Kommentare", ar: "التعليقات" },
  "editor.versions": { en: "Version History", es: "Historial de Versiones", fr: "Historique des Versions", de: "Versionsverlauf", ar: "سجل النسخ" },
  "editor.share": { en: "Share", es: "Compartir", fr: "Partager", de: "Teilen", ar: "مشاركة" },
  // Elements
  "element.text": { en: "Text", es: "Texto", fr: "Texte", de: "Text", ar: "نص" },
  "element.shape": { en: "Shape", es: "Forma", fr: "Forme", de: "Form", ar: "شكل" },
  "element.image": { en: "Image", es: "Imagen", fr: "Image", de: "Bild", ar: "صورة" },
  "element.table": { en: "Table", es: "Tabla", fr: "Tableau", de: "Tabelle", ar: "جدول" },
  "element.signature": { en: "Signature", es: "Firma", fr: "Signature", de: "Unterschrift", ar: "توقيع" },
  "element.qrcode": { en: "QR Code", es: "Código QR", fr: "Code QR", de: "QR-Code", ar: "رمز QR" },
  // AI Suite
  "ai.layout": { en: "Layout", es: "Diseño", fr: "Mise en page", de: "Layout", ar: "تخطيط" },
  "ai.clauses": { en: "Clauses", es: "Cláusulas", fr: "Clauses", de: "Klauseln", ar: "بنود" },
  "ai.compliance": { en: "Compliance", es: "Cumplimiento", fr: "Conformité", de: "Konformität", ar: "امتثال" },
  "ai.generateLayouts": { en: "Generate Layouts", es: "Generar Diseños", fr: "Générer des Mises en page", de: "Layouts generieren", ar: "إنشاء تخطيطات" },
  "ai.detectClauses": { en: "Detect Clauses", es: "Detectar Cláusulas", fr: "Détecter les Clauses", de: "Klauseln erkennen", ar: "اكتشاف البنود" },
  "ai.runCheck": { en: "Run Compliance Check", es: "Verificar Cumplimiento", fr: "Vérifier la Conformité", de: "Konformitätsprüfung", ar: "فحص الامتثال" },
};

/** Get current locale from localStorage or browser */
export function getLocale(): SupportedLocale {
  const stored = localStorage.getItem("locale");
  if (stored && SUPPORTED_LOCALES.some(l => l.code === stored)) return stored as SupportedLocale;
  const browserLang = navigator.language?.slice(0, 2);
  if (SUPPORTED_LOCALES.some(l => l.code === browserLang)) return browserLang as SupportedLocale;
  return "en";
}

/** Set locale and update document direction */
export function setLocale(locale: SupportedLocale) {
  localStorage.setItem("locale", locale);
  const config = SUPPORTED_LOCALES.find(l => l.code === locale);
  if (config) {
    document.documentElement.dir = config.dir;
    document.documentElement.lang = config.code;
  }
}

/** Translate a key */
export function t(key: string, locale?: SupportedLocale): string {
  const lang = locale || getLocale();
  return TRANSLATIONS[key]?.[lang] || TRANSLATIONS[key]?.en || key;
}

export function getLocaleConfig(locale: SupportedLocale): LocaleConfig {
  return SUPPORTED_LOCALES.find(l => l.code === locale)!;
}
