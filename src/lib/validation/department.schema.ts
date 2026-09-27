import { z } from "zod";

export const departmentSchema = z.object({
  faculty_id: z
    .string()
    .min(1, "Faculty ID is required")
    .uuid("Invalid faculty ID format"),
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .min(2, "Department name must be at least 2 characters")
    .max(150, "Department name must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Department code is required")
    .min(2, "Department code must be at least 2 characters")
    .max(20, "Department code must be at most 20 characters")
    .toUpperCase(),
});

export const departmentInsertSchema = departmentSchema;

export const departmentUpdateSchema = departmentSchema
  .omit({ faculty_id: true })
  .partial();

export type DepartmentInput = z.infer<typeof departmentSchema>;
