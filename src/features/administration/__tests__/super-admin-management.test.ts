import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getSuperAdminRemovalBlocker } from "@/features/administration/super-admin-management.service";
import {
  superAdminCreateSchema,
  superAdminUpdateSchema,
} from "@/lib/validation/super-admin.schema";

describe("Super administrator management", () => {
  it("normalizes email when creating an account", () => {
    const result = superAdminCreateSchema.safeParse({
      email: "  ROOT.ADMIN@EXAMPLE.COM ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("root.admin@example.com");
    }
  });

  it("validates email-only account updates", () => {
    const result = superAdminUpdateSchema.safeParse({
      email: "root.admin@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects oversized emails and unexpected fields", () => {
    expect(
      superAdminCreateSchema.safeParse({
        email: `${"a".repeat(322)}@example.com`,
      }).success
    ).toBe(false);
    expect(
      superAdminUpdateSchema.safeParse({
        email: "root.admin@example.com",
        role: "FACULTY_ADMIN",
      }).success
    ).toBe(false);
  });

  it("blocks removal of the current account or the final super admin", () => {
    expect(getSuperAdminRemovalBlocker(2, true)).toBe("self-removal");
    expect(getSuperAdminRemovalBlocker(1, false)).toBe("last-super-admin");
  });

  it("allows removal when another administrator remains", () => {
    expect(getSuperAdminRemovalBlocker(2, false)).toBeNull();
  });
});
