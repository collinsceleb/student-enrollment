import { describe, expect, it } from "vitest";

import {
  facultyAdminAssignmentSchema,
  facultyAdminCreateSchema,
} from "@/lib/validation/faculty-admin.schema";

describe("Faculty administrator validation", () => {
  it("normalizes email and validates account creation details", () => {
    const result = facultyAdminCreateSchema.safeParse({
      email: "  FACULTY.ADMIN@EXAMPLE.COM ",
      password: "StrongPassword123",
      faculty_id: "00000000-0000-4000-8000-000000000001",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("faculty.admin@example.com");
    }
  });

  it("rejects invalid email, short password, or malformed faculty assignment", () => {
    expect(
      facultyAdminCreateSchema.safeParse({
        email: "not-an-email",
        password: "short",
        faculty_id: "not-a-uuid",
      }).success
    ).toBe(false);
    expect(
      facultyAdminAssignmentSchema.safeParse({
        faculty_id: "not-a-uuid",
      }).success
    ).toBe(false);
  });
});
