/**
 * FRM-001 to FRM-006: Standardized Zod validation schemas per service type
 * Extends base booking schema with service-specific fields.
 */
import { z } from "zod";

/** Base fields shared across all booking types */
const baseBookingFields = {
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTime: z.string().min(1, "Please select a time"),
  notes: z.string().max(2000).optional(),
};

/** RON-specific booking schema (SVC-409) */
export const ronBookingSchema = z.object({
  ...baseBookingFields,
  serviceType: z.literal("Remote Online Notarization").or(z.string().min(1)),
  notarizationType: z.literal("ron"),
  documentType: z.string().min(1, "Please specify document type"),
  signerCount: z.number().int().min(1).max(20, "Maximum 20 signers"),
  signerState: z.string().min(2, "State is required for RON"),
  signerTimezone: z.string().optional(),
  techCheckConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm tech requirements" }),
  }),
  consentToRecording: z.literal(true, {
    errorMap: () => ({ message: "Recording consent required per ORC §147.63" }),
  }),
});

/** Mobile notarization schema */
export const mobileBookingSchema = z.object({
  ...baseBookingFields,
  serviceType: z.string().min(1, "Please select a service"),
  notarizationType: z.literal("mobile").or(z.literal("in_person")),
  documentType: z.string().min(1, "Document type required"),
  signerCount: z.number().int().min(1).max(20).optional(),
  clientAddress: z.string().min(5, "Full address is required for mobile service"),
  parkingNotes: z.string().max(500).optional(),
  accessInstructions: z.string().max(500).optional(),
  facilityName: z.string().max(200).optional(),
  facilityContact: z.string().max(100).optional(),
});

/** Loan signing schema */
export const loanSigningSchema = z.object({
  ...baseBookingFields,
  serviceType: z.literal("Loan Signing").or(z.string().min(1)),
  lenderName: z.string().min(1, "Lender name is required"),
  loanType: z.enum(["purchase", "refinance", "heloc", "reverse_mortgage", "other"], {
    errorMap: () => ({ message: "Please select loan type" }),
  }),
  pageCount: z.number().int().min(1, "Page count is required").max(500),
  signerCount: z.number().int().min(1).max(10).optional(),
  closingLocation: z.string().min(1, "Closing location required"),
});

/** I-9 verification schema */
export const i9VerificationSchema = z.object({
  ...baseBookingFields,
  serviceType: z.literal("I-9 Employment Verification").or(z.string().min(1)),
  employerName: z.string().min(1, "Employer name is required"),
  employeeCount: z.number().int().min(1, "At least 1 employee").max(100).optional(),
  verificationDeadline: z.string().optional(),
});

/** Generic service request schema */
export const serviceRequestBookingSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20).optional(),
  serviceName: z.string().min(1, "Service is required"),
  description: z.string().trim().min(10, "Please provide details").max(5000),
  urgency: z.enum(["standard", "rush", "urgent"]).optional(),
  county: z.string().max(100).optional(),
  documentDescription: z.string().max(2000).optional(),
});

/** Court form package schema */
export const courtFormBookingSchema = z.object({
  ...baseBookingFields,
  serviceType: z.string().min(1),
  county: z.string().min(1, "Ohio county is required"),
  caseNumber: z.string().max(50).optional(),
  courtName: z.string().max(200).optional(),
  filingType: z.string().min(1, "Filing type is required"),
  uplaDisclaimer: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge this is document preparation, not legal advice" }),
  }),
});

/** Estate planning bundle schema */
export const estatePlanBookingSchema = z.object({
  ...baseBookingFields,
  serviceType: z.literal("Estate Plan Bundle").or(z.string().min(1)),
  notarizationType: z.enum(["ron", "in_person"]),
  signerCount: z.number().int().min(1).max(4).optional(),
  documentsRequested: z.array(z.string()).min(1, "Select at least one document"),
  hasExistingDocuments: z.boolean().optional(),
});

export type RonBookingData = z.infer<typeof ronBookingSchema>;
export type MobileBookingData = z.infer<typeof mobileBookingSchema>;
export type LoanSigningData = z.infer<typeof loanSigningSchema>;
export type I9VerificationData = z.infer<typeof i9VerificationSchema>;
export type CourtFormBookingData = z.infer<typeof courtFormBookingSchema>;
export type EstatePlanBookingData = z.infer<typeof estatePlanBookingSchema>;

/** Get the appropriate schema based on service type */
export function getBookingSchemaForService(serviceType: string) {
  const lower = serviceType.toLowerCase();
  if (lower.includes("remote online") || lower.includes("ron")) return ronBookingSchema;
  if (lower.includes("mobile")) return mobileBookingSchema;
  if (lower.includes("loan signing")) return loanSigningSchema;
  if (lower.includes("i-9") || lower.includes("i9")) return i9VerificationSchema;
  if (lower.includes("estate plan")) return estatePlanBookingSchema;
  if (lower.includes("filing") || lower.includes("court form")) return courtFormBookingSchema;
  return serviceRequestBookingSchema;
}
