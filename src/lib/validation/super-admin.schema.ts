import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().max(320).pipe(z.email());

export const superAdminCreateSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const superAdminUpdateSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type SuperAdminCreateInput = z.infer<typeof superAdminCreateSchema>;
export type SuperAdminUpdateInput = z.infer<typeof superAdminUpdateSchema>;
