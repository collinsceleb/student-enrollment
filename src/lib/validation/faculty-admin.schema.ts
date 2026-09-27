import { z } from "zod";

export const facultyAdminCreateSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  faculty_id: z.uuid("Select a valid faculty"),
});

export const facultyAdminAssignmentSchema = z.object({
  faculty_id: z.uuid("Select a valid faculty"),
});

export type FacultyAdminCreateInput = z.infer<typeof facultyAdminCreateSchema>;
export type FacultyAdminAssignmentInput = z.infer<
  typeof facultyAdminAssignmentSchema
>;
