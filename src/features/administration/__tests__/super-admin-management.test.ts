import { describe, expect, it } from "vitest";

import { getSuperAdminRemovalBlocker } from "@/features/administration/super-admin-management.service";
import {
  superAdminCreateSchema,
  superAdminUpdateSchema,
} from "@/lib/validation/super-admin.schema";

describe("Super administrator management", () => {
  it("normalizes email when creating an account", () => {
    const result = superAdminCreateSchema.safeParse({
      email: "  ROOT.ADMIN@EXAMPLE.COM ",
      password: "StrongPassword123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("root.admin@example.com");
    }
  });

  it("permits an omitted replacement password when updating email", () => {
    const result = superAdminUpdateSchema.safeParse({
      email: "root.admin@example.com",
      password: "",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBeUndefined();
  });

  it("blocks removal of the current account or the final super admin", () => {
    expect(getSuperAdminRemovalBlocker(2, true)).toBe("self-removal");
    expect(getSuperAdminRemovalBlocker(1, false)).toBe("last-super-admin");
  });

  it("allows removal when another administrator remains", () => {
    expect(getSuperAdminRemovalBlocker(2, false)).toBeNull();
  });
});
