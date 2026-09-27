import { z } from "zod";

export const facultyAdminCreateSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),
  faculty_id: z.uuid("Select a valid faculty"),
});

export const facultyAdminAssignmentSchema = z.object({
  faculty_id: z.uuid("Select a valid faculty"),
});

export type FacultyAdminCreateInput = z.infer<typeof facultyAdminCreateSchema>;
export type FacultyAdminAssignmentInput = z.infer<
  typeof facultyAdminAssignmentSchema
>;
