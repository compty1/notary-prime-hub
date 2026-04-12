/**
 * Ohio-specific form validation helpers.
 * Ensures data meets ORC requirements before submission.
 */

/** Validate Ohio zip code (5 or 5+4 format, Ohio range 430xx-459xx) */
export function isOhioZipCode(zip: string): boolean {
  const clean = zip.replace(/\s/g, "");
  const match = clean.match(/^(\d{5})(-\d{4})?$/);
  if (!match) return false;
  const prefix = parseInt(match[1].slice(0, 3));
  return prefix >= 430 && prefix <= 459;
}

/** Validate Ohio driver's license format (2 letters + 6 digits) */
export function isValidOhioDL(dl: string): boolean {
  return /^[A-Za-z]{2}\d{6}$/.test(dl.trim());
}

/** Validate notary commission number format */
export function isValidCommissionNumber(num: string): boolean {
  return /^\d{4,8}$/.test(num.trim());
}

/** Validate EIN format (XX-XXXXXXX) */
export function isValidEIN(ein: string): boolean {
  return /^\d{2}-?\d{7}$/.test(ein.trim());
}

/** Validate SSN format (XXX-XX-XXXX) — for display masking only */
export function maskSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, "");
  if (digits.length !== 9) return "Invalid";
  return `***-**-${digits.slice(-4)}`;
}

/** Validate phone number (US format) */
export function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits[0] === "1");
}

/** Format phone for display */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const d = digits.length === 11 ? digits.slice(1) : digits;
  if (d.length !== 10) return phone;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Ohio county list for dropdown validation */
export const OHIO_COUNTIES = [
  "Adams", "Allen", "Ashland", "Ashtabula", "Athens", "Auglaize", "Belmont", "Brown",
  "Butler", "Carroll", "Champaign", "Clark", "Clermont", "Clinton", "Columbiana",
  "Coshocton", "Crawford", "Cuyahoga", "Darke", "Defiance", "Delaware", "Erie",
  "Fairfield", "Fayette", "Franklin", "Fulton", "Gallia", "Geauga", "Greene", "Guernsey",
  "Hamilton", "Hancock", "Hardin", "Harrison", "Henry", "Highland", "Hocking", "Holmes",
  "Huron", "Jackson", "Jefferson", "Knox", "Lake", "Lawrence", "Licking", "Logan",
  "Lorain", "Lucas", "Madison", "Mahoning", "Marion", "Medina", "Meigs", "Mercer",
  "Miami", "Monroe", "Montgomery", "Morgan", "Morrow", "Muskingum", "Noble", "Ottawa",
  "Paulding", "Perry", "Pickaway", "Pike", "Portage", "Preble", "Putnam", "Richland",
  "Ross", "Sandusky", "Scioto", "Seneca", "Shelby", "Stark", "Summit", "Trumbull",
  "Tuscarawas", "Union", "Van Wert", "Vinton", "Warren", "Washington", "Wayne",
  "Williams", "Wood", "Wyandot",
];

/** Validate document type is eligible for notarization in Ohio */
export function isNotarizableDocType(docType: string): boolean {
  const prohibited = [
    "birth certificate", "death certificate", "court order",
    "vital statistics", "marriage license",
  ];
  return !prohibited.some(p => docType.toLowerCase().includes(p));
}
