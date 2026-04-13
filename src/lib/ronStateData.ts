/**
 * RON Legality & Acceptance Advisor — Legal Data Layer
 * 
 * Curated 50-state profiles with statutory citations,
 * Ohio RON rules table, and document legality matrix.
 * 
 * Sources: ORC §147.60-.66, RULONA, state-specific RON statutes
 * Last updated: April 2026
 */

export type AcceptanceRating = "high" | "medium" | "low" | "not_accepted";
export type RonMaturity = "mature" | "established" | "recent" | "pending" | "none";

export interface StateProfile {
  name: string;
  abbreviation: string;
  ron_authorized: boolean;
  ron_maturity: RonMaturity;
  acceptance: {
    real_estate: AcceptanceRating;
    estate_planning: AcceptanceRating;
    affidavits: AcceptanceRating;
    financial: AcceptanceRating;
    business: AcceptanceRating;
    government: AcceptanceRating;
  };
  statutory_citation: string | null;
  practice_notes: string[];
  full_faith_credit_risk: "low" | "medium" | "high";
}

export interface OhioDocRule {
  category: string;
  subtype: string;
  notarial_act: string;
  status: "allowed" | "conditional" | "not_allowed";
  notes: string;
  risk_modifier: number;
  orc_citation: string;
}

export const US_STATES: StateProfile[] = [
  { name: "Alabama", abbreviation: "AL", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Ala. Code §36-20-73.1", practice_notes: ["RON law enacted 2022", "County recorders increasingly accept RON"], full_faith_credit_risk: "low" },
  { name: "Alaska", abbreviation: "AK", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "AS §44.50.060", practice_notes: ["Remote location makes RON popular", "Strong acceptance for real estate"], full_faith_credit_risk: "low" },
  { name: "Arizona", abbreviation: "AZ", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "A.R.S. §41-371 et seq.", practice_notes: ["Mature RON market", "County recorders widely accept"], full_faith_credit_risk: "low" },
  { name: "Arkansas", abbreviation: "AR", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Ark. Code Ann. §21-14-201", practice_notes: ["RON law enacted 2021"], full_faith_credit_risk: "low" },
  { name: "California", abbreviation: "CA", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "low", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: null, practice_notes: ["No RON law enacted as of 2026", "Some entities accept Ohio RON under Full Faith & Credit", "County recorders may refuse electronic notarizations from other states"], full_faith_credit_risk: "high" },
  { name: "Colorado", abbreviation: "CO", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "C.R.S. §24-21-501 et seq.", practice_notes: ["Early adopter state", "Excellent acceptance across all categories"], full_faith_credit_risk: "low" },
  { name: "Connecticut", abbreviation: "CT", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Conn. Gen. Stat. §1-300a", practice_notes: ["RON authorization from COVID emergency orders made permanent"], full_faith_credit_risk: "low" },
  { name: "Delaware", abbreviation: "DE", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "medium", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: null, practice_notes: ["No standalone RON law", "Business-friendly state may accept under Full Faith & Credit"], full_faith_credit_risk: "medium" },
  { name: "Florida", abbreviation: "FL", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Fla. Stat. §117.265", practice_notes: ["One of the first RON states (2020)", "Excellent acceptance statewide", "Major title companies fully support"], full_faith_credit_risk: "low" },
  { name: "Georgia", abbreviation: "GA", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "O.C.G.A. §45-17-8.3", practice_notes: ["RON law enacted recently", "Growing acceptance"], full_faith_credit_risk: "low" },
  { name: "Hawaii", abbreviation: "HI", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "HRS §456-19.5", practice_notes: ["Remote location drives RON adoption", "Good real estate acceptance"], full_faith_credit_risk: "low" },
  { name: "Idaho", abbreviation: "ID", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Idaho Code §51-101 et seq.", practice_notes: ["Strong acceptance across categories"], full_faith_credit_risk: "low" },
  { name: "Illinois", abbreviation: "IL", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "5 ILCS 312/6-109", practice_notes: ["Cook County recorders now accepting RON", "Growing adoption"], full_faith_credit_risk: "low" },
  { name: "Indiana", abbreviation: "IN", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "IC §33-42-17", practice_notes: ["Early adopter", "Excellent statewide acceptance"], full_faith_credit_risk: "low" },
  { name: "Iowa", abbreviation: "IA", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Iowa Code §9B.21", practice_notes: ["Good acceptance for real estate and business"], full_faith_credit_risk: "low" },
  { name: "Kansas", abbreviation: "KS", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "K.S.A. §53-601 et seq.", practice_notes: ["RON law enacted recently"], full_faith_credit_risk: "low" },
  { name: "Kentucky", abbreviation: "KY", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "KRS §423.445", practice_notes: ["Good acceptance, especially for real estate"], full_faith_credit_risk: "low" },
  { name: "Louisiana", abbreviation: "LA", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: "La. R.S. 35:625", practice_notes: ["Civil law state with unique notary requirements", "RON acceptance growing but slower than common law states"], full_faith_credit_risk: "medium" },
  { name: "Maine", abbreviation: "ME", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "4 M.R.S. §1013-A", practice_notes: ["COVID emergency extended to permanent RON"], full_faith_credit_risk: "low" },
  { name: "Maryland", abbreviation: "MD", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Md. Code, State Gov't §18-219", practice_notes: ["Good acceptance in DC metro area"], full_faith_credit_risk: "low" },
  { name: "Massachusetts", abbreviation: "MA", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "low", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: null, practice_notes: ["No permanent RON law", "COVID emergency orders expired", "Full Faith & Credit applies but practical acceptance varies"], full_faith_credit_risk: "high" },
  { name: "Michigan", abbreviation: "MI", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "MCL §55.286a", practice_notes: ["Mature RON market", "Strong acceptance statewide"], full_faith_credit_risk: "low" },
  { name: "Minnesota", abbreviation: "MN", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Minn. Stat. §358.645", practice_notes: ["Very well-adopted RON state"], full_faith_credit_risk: "low" },
  { name: "Mississippi", abbreviation: "MS", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "low", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: null, practice_notes: ["No RON law enacted", "Limited acceptance"], full_faith_credit_risk: "high" },
  { name: "Missouri", abbreviation: "MO", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Mo. Rev. Stat. §486.1100", practice_notes: ["Growing acceptance"], full_faith_credit_risk: "low" },
  { name: "Montana", abbreviation: "MT", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "MCA §1-5-631", practice_notes: ["Remote location makes RON popular"], full_faith_credit_risk: "low" },
  { name: "Nebraska", abbreviation: "NE", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Neb. Rev. Stat. §64-402", practice_notes: ["Good acceptance for real estate"], full_faith_credit_risk: "low" },
  { name: "Nevada", abbreviation: "NV", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "NRS §240.200 et seq.", practice_notes: ["Pioneer RON state", "Excellent acceptance"], full_faith_credit_risk: "low" },
  { name: "New Hampshire", abbreviation: "NH", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "RSA 456-B:13-a", practice_notes: ["RON recently enacted"], full_faith_credit_risk: "low" },
  { name: "New Jersey", abbreviation: "NJ", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "low", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: null, practice_notes: ["No permanent RON law", "County clerks often unfamiliar with RON", "Full Faith & Credit should apply"], full_faith_credit_risk: "high" },
  { name: "New Mexico", abbreviation: "NM", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "N.M. Stat. Ann. §14-14A-1", practice_notes: ["Recent RON adoption"], full_faith_credit_risk: "low" },
  { name: "New York", abbreviation: "NY", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "N.Y. Exec. Law §135-c", practice_notes: ["RON enacted but city/county recorders may have varying practices", "NYC agencies may require confirmation"], full_faith_credit_risk: "low" },
  { name: "North Carolina", abbreviation: "NC", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "N.C.G.S. §10B-200 et seq.", practice_notes: ["Growing acceptance"], full_faith_credit_risk: "low" },
  { name: "North Dakota", abbreviation: "ND", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "N.D.C.C. §44-06.1-13.1", practice_notes: ["Good statewide acceptance"], full_faith_credit_risk: "low" },
  { name: "Ohio", abbreviation: "OH", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "ORC §147.60-147.66", practice_notes: ["Home state — full RON authority", "All county recorders accept", "10-year recording retention per ORC §147.66"], full_faith_credit_risk: "low" },
  { name: "Oklahoma", abbreviation: "OK", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "49 O.S. §119", practice_notes: ["Good acceptance statewide"], full_faith_credit_risk: "low" },
  { name: "Oregon", abbreviation: "OR", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "ORS §194.500 et seq.", practice_notes: ["RON recently adopted"], full_faith_credit_risk: "low" },
  { name: "Pennsylvania", abbreviation: "PA", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "57 Pa.C.S. §329", practice_notes: ["Good acceptance for real estate", "Some county recorders prefer wet ink for certain documents"], full_faith_credit_risk: "low" },
  { name: "Rhode Island", abbreviation: "RI", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "low", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "low" },
    statutory_citation: null, practice_notes: ["No RON law", "Small state — practical acceptance varies"], full_faith_credit_risk: "high" },
  { name: "South Carolina", abbreviation: "SC", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "S.C. Code §26-1-10 et seq.", practice_notes: ["Recently enacted"], full_faith_credit_risk: "low" },
  { name: "South Dakota", abbreviation: "SD", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "SDCL §18-1-11.2", practice_notes: ["RON recently enacted"], full_faith_credit_risk: "low" },
  { name: "Tennessee", abbreviation: "TN", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Tenn. Code §66-22-126", practice_notes: ["Well-adopted RON state"], full_faith_credit_risk: "low" },
  { name: "Texas", abbreviation: "TX", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Tex. Gov't Code §406.101 et seq.", practice_notes: ["Pioneer RON state (2018)", "Excellent acceptance", "Large market with high RON volume"], full_faith_credit_risk: "low" },
  { name: "Utah", abbreviation: "UT", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Utah Code §46-1-2 et seq.", practice_notes: ["Good statewide acceptance"], full_faith_credit_risk: "low" },
  { name: "Vermont", abbreviation: "VT", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "26 V.S.A. §5379", practice_notes: ["Good acceptance"], full_faith_credit_risk: "low" },
  { name: "Virginia", abbreviation: "VA", ron_authorized: true, ron_maturity: "mature",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Va. Code §47.1-2 et seq.", practice_notes: ["First state to enact RON (2012)", "Gold standard for RON acceptance", "All major lenders accept"], full_faith_credit_risk: "low" },
  { name: "Washington", abbreviation: "WA", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "RCW §42.45.280", practice_notes: ["Recently enacted"], full_faith_credit_risk: "low" },
  { name: "West Virginia", abbreviation: "WV", ron_authorized: true, ron_maturity: "recent",
    acceptance: { real_estate: "medium", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "W. Va. Code §39-4-37", practice_notes: ["RON recently adopted"], full_faith_credit_risk: "low" },
  { name: "Wisconsin", abbreviation: "WI", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "medium", affidavits: "high", financial: "high", business: "high", government: "medium" },
    statutory_citation: "Wis. Stat. §140.145", practice_notes: ["Good acceptance"], full_faith_credit_risk: "low" },
  { name: "Wyoming", abbreviation: "WY", ron_authorized: true, ron_maturity: "established",
    acceptance: { real_estate: "high", estate_planning: "high", affidavits: "high", financial: "high", business: "high", government: "high" },
    statutory_citation: "Wyo. Stat. §34-26-301 et seq.", practice_notes: ["Good statewide acceptance"], full_faith_credit_risk: "low" },
  { name: "District of Columbia", abbreviation: "DC", ron_authorized: false, ron_maturity: "none",
    acceptance: { real_estate: "medium", estate_planning: "low", affidavits: "medium", financial: "medium", business: "medium", government: "medium" },
    statutory_citation: null, practice_notes: ["No RON law", "Federal agencies may accept under Full Faith & Credit", "Some title companies in DC metro accept Ohio RON"], full_faith_credit_risk: "medium" },
];

export const STATE_MAP = new Map(US_STATES.map(s => [s.name, s]));
export const STATE_ABBR_MAP = new Map(US_STATES.map(s => [s.abbreviation, s]));

// Document categories and subtypes
export const DOCUMENT_CATEGORIES = [
  { value: "real_estate", label: "Real Estate", subtypes: [
    { value: "deed", label: "Deed (Warranty, Quitclaim, etc.)" },
    { value: "mortgage", label: "Mortgage / Deed of Trust" },
    { value: "refinance", label: "Refinance Documents" },
    { value: "closing", label: "Closing / Settlement Documents" },
    { value: "title_transfer", label: "Title Transfer" },
    { value: "lien", label: "Lien / Release of Lien" },
    { value: "easement", label: "Easement Agreement" },
  ]},
  { value: "estate_planning", label: "Estate Planning", subtypes: [
    { value: "will", label: "Last Will and Testament" },
    { value: "trust", label: "Trust Agreement / Amendment" },
    { value: "poa_general", label: "General Power of Attorney" },
    { value: "poa_durable", label: "Durable Power of Attorney" },
    { value: "poa_healthcare", label: "Healthcare Power of Attorney" },
    { value: "living_will", label: "Living Will / Advance Directive" },
    { value: "beneficiary", label: "Beneficiary Designation" },
  ]},
  { value: "affidavits", label: "Affidavits & Sworn Statements", subtypes: [
    { value: "general_affidavit", label: "General Affidavit" },
    { value: "identity_affidavit", label: "Identity Affidavit" },
    { value: "heirship_affidavit", label: "Affidavit of Heirship" },
    { value: "small_estate_affidavit", label: "Small Estate Affidavit" },
    { value: "sworn_statement", label: "Sworn Statement / Declaration" },
  ]},
  { value: "financial", label: "Financial & Banking", subtypes: [
    { value: "loan_docs", label: "Loan Documents" },
    { value: "promissory_note", label: "Promissory Note" },
    { value: "financial_poa", label: "Financial Power of Attorney" },
    { value: "account_authorization", label: "Account Authorization Forms" },
    { value: "safe_deposit", label: "Safe Deposit Box Access" },
  ]},
  { value: "business", label: "Business & Corporate", subtypes: [
    { value: "articles", label: "Articles of Incorporation / Organization" },
    { value: "operating_agreement", label: "Operating Agreement" },
    { value: "corporate_resolution", label: "Corporate Resolution" },
    { value: "business_contract", label: "Business Contract" },
    { value: "nda", label: "Non-Disclosure Agreement" },
    { value: "partnership", label: "Partnership Agreement" },
  ]},
  { value: "government", label: "Government & Court", subtypes: [
    { value: "court_filing", label: "Court Filing / Pleading" },
    { value: "immigration", label: "Immigration Document" },
    { value: "i9_employment", label: "I-9 Employment Verification" },
    { value: "government_application", label: "Government Application" },
    { value: "vehicle_title", label: "Vehicle Title Transfer" },
    { value: "apostille_doc", label: "Document Requiring Apostille" },
  ]},
  { value: "personal", label: "Personal Documents", subtypes: [
    { value: "consent_form", label: "Consent / Permission Form" },
    { value: "medical_release", label: "Medical Records Release" },
    { value: "travel_consent", label: "Minor Travel Consent" },
    { value: "name_change", label: "Name Change Affidavit" },
    { value: "other", label: "Other Personal Document" },
  ]},
];

export const NOTARIAL_ACT_TYPES = [
  { value: "acknowledgment", label: "Acknowledgment" },
  { value: "jurat", label: "Jurat (Oath/Affirmation)" },
  { value: "copy_certification", label: "Copy Certification" },
  { value: "signature_witnessing", label: "Signature Witnessing" },
  { value: "oath_affirmation", label: "Oath or Affirmation (standalone)" },
  { value: "not_sure", label: "I'm not sure" },
];

export const RECIPIENT_TYPES = [
  { value: "county_recorder", label: "County Recorder / Register of Deeds" },
  { value: "bank_lender", label: "Bank, Lender, or Title Company" },
  { value: "court", label: "Court or Legal Filing Office" },
  { value: "government_state", label: "State Government Agency" },
  { value: "government_federal", label: "Federal Government Agency" },
  { value: "employer", label: "Employer / HR Department" },
  { value: "private_party", label: "Private Party / Individual" },
  { value: "insurance", label: "Insurance Company" },
  { value: "foreign_entity", label: "Foreign Government / International Entity" },
  { value: "attorney", label: "Attorney / Law Firm" },
  { value: "other", label: "Other / Not Sure" },
];

// Ohio-specific RON rules table
export const OHIO_DOC_RULES: OhioDocRule[] = [
  // Real estate — all allowed
  { category: "real_estate", subtype: "deed", notarial_act: "acknowledgment", status: "allowed", notes: "Standard RON for Ohio deeds per ORC §147.63", risk_modifier: 0, orc_citation: "ORC §147.63" },
  { category: "real_estate", subtype: "mortgage", notarial_act: "acknowledgment", status: "allowed", notes: "Fannie Mae, Freddie Mac, FHA all accept RON for mortgages", risk_modifier: 0, orc_citation: "ORC §147.63" },
  { category: "real_estate", subtype: "refinance", notarial_act: "acknowledgment", status: "allowed", notes: "Widely accepted for refinance closings", risk_modifier: 0, orc_citation: "ORC §147.63" },
  { category: "real_estate", subtype: "closing", notarial_act: "acknowledgment", status: "allowed", notes: "Full eClosing support", risk_modifier: 0, orc_citation: "ORC §147.63" },
  
  // Estate planning — conditional for wills (witness requirements)
  { category: "estate_planning", subtype: "will", notarial_act: "acknowledgment", status: "conditional", notes: "Ohio requires 2 disinterested witnesses for wills (ORC §2107.03). Witnesses can participate remotely in RON session.", risk_modifier: 1, orc_citation: "ORC §2107.03, §147.63" },
  { category: "estate_planning", subtype: "trust", notarial_act: "acknowledgment", status: "allowed", notes: "Trusts do not require witnesses in Ohio", risk_modifier: 0, orc_citation: "ORC §147.63" },
  { category: "estate_planning", subtype: "poa_general", notarial_act: "acknowledgment", status: "allowed", notes: "General POA fully eligible for RON", risk_modifier: 0, orc_citation: "ORC §147.63" },
  { category: "estate_planning", subtype: "poa_durable", notarial_act: "acknowledgment", status: "allowed", notes: "Durable POA fully eligible for RON", risk_modifier: 0, orc_citation: "ORC §147.63, §1337.09" },
  { category: "estate_planning", subtype: "poa_healthcare", notarial_act: "acknowledgment", status: "allowed", notes: "Healthcare POA eligible. Ohio does not require notarization but accepts it.", risk_modifier: 0, orc_citation: "ORC §1337.12" },
  { category: "estate_planning", subtype: "living_will", notarial_act: "acknowledgment", status: "conditional", notes: "Ohio living wills require 2 witnesses or notarization. RON satisfies notarization requirement.", risk_modifier: 0, orc_citation: "ORC §2133.02" },
  
  // Affidavits — all allowed (jurats)
  { category: "affidavits", subtype: "general_affidavit", notarial_act: "jurat", status: "allowed", notes: "Jurats fully supported via RON", risk_modifier: 0, orc_citation: "ORC §147.63" },
  { category: "affidavits", subtype: "identity_affidavit", notarial_act: "jurat", status: "allowed", notes: "Identity affidavits via RON with KBA verification", risk_modifier: 0, orc_citation: "ORC §147.63, §147.64" },
  
  // Government — I-9 not allowed, vehicle title conditional
  { category: "government", subtype: "i9_employment", notarial_act: "acknowledgment", status: "not_allowed", notes: "Federal I-9 verification requires physical document inspection per USCIS. RON cannot satisfy this requirement.", risk_modifier: 4, orc_citation: "8 CFR §274a.2(b)" },
  { category: "government", subtype: "vehicle_title", notarial_act: "acknowledgment", status: "conditional", notes: "Ohio BMV accepts RON for Ohio titles. Other states' DMVs vary — confirm with the specific state.", risk_modifier: 1, orc_citation: "ORC §147.63, ORC §4505" },
  { category: "government", subtype: "court_filing", notarial_act: "jurat", status: "conditional", notes: "Most courts accept RON, but individual court clerks may have specific requirements. Verify with the court.", risk_modifier: 1, orc_citation: "ORC §147.63" },
  { category: "government", subtype: "apostille_doc", notarial_act: "acknowledgment", status: "conditional", notes: "RON is valid for the notarization step. Apostille from Ohio Secretary of State may be needed for international use.", risk_modifier: 1, orc_citation: "ORC §147.63" },
  { category: "government", subtype: "immigration", notarial_act: "acknowledgment", status: "conditional", notes: "USCIS and foreign governments may have specific requirements beyond notarization.", risk_modifier: 2, orc_citation: "ORC §147.63" },
];

export function getOhioDocRule(category: string, subtype: string): OhioDocRule | null {
  return OHIO_DOC_RULES.find(r => r.category === category && r.subtype === subtype) || null;
}

export function getStateProfile(stateName: string): StateProfile | null {
  return STATE_MAP.get(stateName) || null;
}
