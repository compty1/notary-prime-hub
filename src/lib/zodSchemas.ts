import { z } from "zod";

/** Zod schema for booking form validation — REM-034 */
export const bookingSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long"),
  serviceType: z.string().min(1, "Please select a service"),
  notarizationType: z.enum(["in_person", "ron", "mobile"]).optional(),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTime: z.string().min(1, "Please select a time"),
  notes: z.string().max(2000, "Notes must be under 2000 characters").optional(),
  signerCount: z.number().int().min(1, "At least 1 signer required").max(20, "Maximum 20 signers").optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

/** Zod schema for signup form validation — REM-035 */
export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupFormData = z.infer<typeof signupSchema>;

/** Zod schema for service request form */
export const serviceRequestSchema = z.object({
  serviceName: z.string().min(1, "Please select a service"),
  description: z.string().trim().min(10, "Please provide more detail").max(5000),
  urgency: z.enum(["standard", "rush", "urgent"]).optional(),
  contactEmail: z.string().trim().email("Invalid email").optional(),
  contactPhone: z.string().max(20).optional(),
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;
