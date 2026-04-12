/** Single source of truth for business hours across the platform */
export const BUSINESS_HOURS = {
  display: "Mon–Fri 9 AM – 7 PM ET  |  Sat 10 AM – 4 PM ET  |  Sun by appointment",
  short: "Mon–Fri 9–7, Sat 10–4",
  weekday: "Monday – Friday: 9:00 AM – 7:00 PM ET",
  saturday: "Saturday: 10:00 AM – 4:00 PM ET",
  sunday: "Sunday: By appointment only",
  afterHours: "After-hours available with surcharge",
  jsonLd: [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "19:00" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday"], "opens": "10:00", "closes": "16:00" },
  ],
} as const;
