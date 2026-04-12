export const BOOKING_STORAGE_KEY = "pending_booking_data";

// Ohio state holidays — booking blocked on these dates
export const OHIO_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "07-04": "Independence Day",
  "11-11": "Veterans Day",
  "12-25": "Christmas Day",
};
// Dynamic holidays (computed per year)
export function getHolidaysForYear(year: number): Record<string, string> {
  const holidays: Record<string, string> = {};
  // Fixed holidays
  Object.entries(OHIO_HOLIDAYS).forEach(([mmdd, name]) => {
    holidays[`${year}-${mmdd}`] = name;
  });
  // MLK Day: 3rd Monday of January
  holidays[nthWeekday(year, 1, 1, 3)] = "Martin Luther King Jr. Day";
  // Presidents' Day: 3rd Monday of February
  holidays[nthWeekday(year, 2, 1, 3)] = "Presidents' Day";
  // Memorial Day: last Monday of May
  holidays[lastWeekday(year, 5, 1)] = "Memorial Day";
  // Labor Day: 1st Monday of September
  holidays[nthWeekday(year, 9, 1, 1)] = "Labor Day";
  // Thanksgiving: 4th Thursday of November
  holidays[nthWeekday(year, 11, 4, 4)] = "Thanksgiving Day";
  return holidays;
}
function nthWeekday(year: number, month: number, dow: number, n: number): string {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getMonth() !== month - 1) break;
    if (dt.getDay() === dow) { count++; if (count === n) return dt.toISOString().split("T")[0]; }
  }
  return "";
}
function lastWeekday(year: number, month: number, dow: number): string {
  for (let d = 31; d >= 1; d--) {
    const dt = new Date(year, month - 1, d);
    if (dt.getMonth() !== month - 1) continue;
    if (dt.getDay() === dow) return dt.toISOString().split("T")[0];
  }
  return "";
}

export const MINIMUM_ADVANCE_HOURS = 2;

export const fallbackServiceTypes = [
  "Real Estate Documents",
  "Power of Attorney",
  "Affidavits & Sworn Statements",
  "Estate Planning Documents",
  "Estate Plan Bundle",
  "Business Documents",
  "I-9 Employment Verification",
  "Healthcare Directive",
  "Loan Signing Package",
  "Other",
];

export const DIGITAL_ONLY_CATEGORIES = new Set(["recurring", "consulting", "document_services", "business_services", "admin_support", "content_creation", "research", "customer_service", "technical_support", "ux_testing"]);
export const LOCATION_REQUIRED_SERVICES = new Set(["Closing Coordination", "Bulk Notarization"]);
export const DIGITAL_ONLY_SERVICES = new Set([
  "Consultation", "Document Storage Vault", "Cloud Document Storage", "Virtual Mailroom",
  "Compliance Reminders", "Document Retention", "Notary API Access",
  "White-Label Notarization", "Registered Agent Service", "Subscription Plans",
  "ID / KYC Verification", "Background Check Coordination", "Document Translation",
]);

export const COMMON_LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese", "Italian", "Chinese (Simplified)",
  "Chinese (Traditional)", "Japanese", "Korean", "Arabic", "Russian", "Hindi", "Vietnamese",
  "Tagalog", "Polish", "Ukrainian", "Romanian", "Dutch", "Greek", "Turkish", "Hebrew",
  "Thai", "Swahili", "Amharic", "Somali", "Nepali", "Bengali", "Urdu", "Persian (Farsi)",
];

export const TRANSLATION_DOC_TYPES = [
  "Birth Certificate", "Marriage Certificate", "Death Certificate", "Divorce Decree",
  "Diploma / Degree", "Transcript", "Driver's License", "Passport", "Court Document",
  "Medical Record", "Immigration Document", "Contract / Agreement", "Power of Attorney",
  "Business Document", "Other",
];

export const HAGUE_COUNTRIES = [
  "Albania","Andorra","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Barbados","Belarus","Belgium","Belize","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burundi","Canada","Cape Verde","Chile","China (Hong Kong)","China (Macao)","Colombia","Cook Islands","Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Dominica","Dominican Republic","Ecuador","El Salvador","Estonia","Eswatini","Fiji","Finland","France","Georgia","Germany","Greece","Grenada","Guatemala","Guyana","Honduras","Hungary","Iceland","India","Indonesia","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kosovo","Kyrgyzstan","Latvia","Lesotho","Liberia","Liechtenstein","Lithuania","Luxembourg","Malawi","Malta","Marshall Islands","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Namibia","Netherlands","New Zealand","Nicaragua","Niue","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Republic of Korea","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Serbia","Seychelles","Singapore","Slovakia","Slovenia","South Africa","Spain","Suriname","Sweden","Switzerland","Tajikistan","Tonga","Trinidad and Tobago","Tunisia","Turkey","Ukraine","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela",
];

export const USCIS_FORMS = [
  { value: "I-130", label: "I-130 — Petition for Alien Relative" },
  { value: "I-485", label: "I-485 — Adjustment of Status (Green Card)" },
  { value: "I-765", label: "I-765 — Employment Authorization (EAD)" },
  { value: "N-400", label: "N-400 — Naturalization / Citizenship" },
  { value: "I-90", label: "I-90 — Renew Green Card" },
  { value: "I-131", label: "I-131 — Travel Document / Advance Parole" },
  { value: "I-864", label: "I-864 — Affidavit of Support" },
  { value: "I-20", label: "I-20 — Student Eligibility Certificate" },
  { value: "DS-160", label: "DS-160 — Nonimmigrant Visa Application" },
  { value: "Other", label: "Other USCIS Form" },
];

export const NOTARIZATION_CATEGORIES = ["notarization", "authentication"];

export const US_STATES = [
  { value: "OH", label: "Ohio" }, { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" }, { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" }, { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" }, { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" }, { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" }, { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "Washington D.C." },
];

export type BookingStep = 1 | 2 | 3 | 4;
export type NotarizationType = "in_person" | "ron";

export const isDigitalOnly = (svcName: string, serviceCategories: Record<string, string>) => {
  if (LOCATION_REQUIRED_SERVICES.has(svcName)) return false;
  const cat = serviceCategories[svcName];
  return (cat && DIGITAL_ONLY_CATEGORIES.has(cat)) || DIGITAL_ONLY_SERVICES.has(svcName);
};

export const requiresNotarizationType = (svcName: string, serviceCategories: Record<string, string>) => {
  const cat = serviceCategories[svcName];
  return !cat || NOTARIZATION_CATEGORIES.includes(cat);
};

export const formatTimeSlot = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

export const getStateAbbr = (state: string) => {
  const map: Record<string, string> = { "Ohio": "OH", "Indiana": "IN", "Kentucky": "KY", "West Virginia": "WV", "Pennsylvania": "PA", "Michigan": "MI" };
  return map[state] || state.substring(0, 2).toUpperCase();
};
