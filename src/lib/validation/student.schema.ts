import { z } from "zod";

export const admissionTypeEnum = z.enum(["JAMBITE", "DIRECT_ENTRY"]);

export const studentSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name (surname) is required")
    .max(100, "Last name must be at most 100 characters"),
  other_name: z
    .string()
    .trim()
    .max(100, "Other name must be at most 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  phone_number: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number must be at most 20 characters")
    .regex(/^[+0-9\s\-()]+$/, "Invalid phone number format"),
  registration_number: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .min(3, "Registration number must be at least 3 characters")
    .max(50, "Registration number must be at most 50 characters")
    .toUpperCase(),
  faculty_id: z
    .string()
    .min(1, "Faculty is required")
    .pipe(z.uuid({ error: "Invalid faculty selection" })),
  department_id: z
    .string()
    .min(1, "Department is required")
    .pipe(z.uuid({ error: "Invalid department selection" })),
  admission_type: z.preprocess((val) => {
    if (typeof val === "string") {
      const normalized = val.trim().toUpperCase().replace(/\s+/g, "_");
      if (normalized === "JAMBITE" || normalized === "DIRECT_ENTRY") {
        return normalized;
      }
    }
    return val;
  }, admissionTypeEnum),
});

export const studentInsertSchema = studentSchema;

export const studentUpdateSchema = studentSchema.partial();

export type StudentInput = z.infer<typeof studentSchema>;
