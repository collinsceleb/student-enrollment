import { z } from "zod";

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z
      .string()
      .min(12, "New password must be at least 12 characters long")
      .max(128, "New password must be at most 128 characters long"),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current password.",
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
