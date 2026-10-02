import { z } from "zod";

export const facultyAdminCreateSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(320).pipe(z.email()),
    faculty_id: z.uuid("Select a valid faculty"),
  })
  .strict();

export const facultyAdminAssignmentSchema = z
  .object({
    faculty_id: z.uuid("Select a valid faculty"),
  })
  .strict();

export type FacultyAdminCreateInput = z.infer<typeof facultyAdminCreateSchema>;
export type FacultyAdminAssignmentInput = z.infer<
  typeof facultyAdminAssignmentSchema
>;
