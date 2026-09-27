import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

export const superAdminCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const superAdminUpdateSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .max(128, "Password must be at most 128 characters long")
    .optional()
    .transform((value) => value?.trim() || undefined)
    .refine(
      (value) => value === undefined || value.length >= 8,
      "Password must be at least 8 characters long"
    ),
});

export type SuperAdminCreateInput = z.infer<typeof superAdminCreateSchema>;
export type SuperAdminUpdateInput = z.infer<typeof superAdminUpdateSchema>;
