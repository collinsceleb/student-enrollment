import { describe, expect, it } from "vitest";

import { passwordChangeSchema } from "@/lib/validation/password-change.schema";

describe("Password change validation", () => {
  it("accepts matching replacement passwords at the minimum length", () => {
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "temporary-password",
        newPassword: "NewSecurePassword123",
        confirmPassword: "NewSecurePassword123",
      }).success
    ).toBe(true);
  });

  it("rejects mismatched or short replacement passwords", () => {
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "temporary-password",
        newPassword: "NewSecurePassword123",
        confirmPassword: "DifferentSecurePassword123",
      }).success
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "temporary-password",
        newPassword: "temporary-password",
        confirmPassword: "temporary-password",
      }).success
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "temporary-password",
        newPassword: "short",
        confirmPassword: "short",
      }).success
    ).toBe(false);
  });
});
