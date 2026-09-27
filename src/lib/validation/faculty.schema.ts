import { z } from "zod";

export const facultySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Faculty name is required")
    .min(2, "Faculty name must be at least 2 characters")
    .max(150, "Faculty name must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Faculty code is required")
    .min(2, "Faculty code must be at least 2 characters")
    .max(20, "Faculty code must be at most 20 characters")
    .toUpperCase(),
});

export const facultyInsertSchema = facultySchema;

export const facultyUpdateSchema = facultySchema.partial();

export type FacultyInput = z.infer<typeof facultySchema>;
