import { describe, expect, it } from "vitest";
import { normalizeAdminRole, getAdminAccessContext } from "../auth.service";


describe("Admin auth role resolution", () => {
  it("accepts the required role values", () => {
    expect(normalizeAdminRole("SUPER_ADMIN")).toBe("SUPER_ADMIN");
    expect(normalizeAdminRole("FACULTY_ADMIN")).toBe("FACULTY_ADMIN");
    expect(normalizeAdminRole("OTHER_ROLE")).toBeNull();
  });

  it("marks super admins as globally authorized and faculty admins as faculty-scoped", () => {
    const superAdmin = getAdminAccessContext("SUPER_ADMIN", null);
    const facultyAdmin = getAdminAccessContext("FACULTY_ADMIN", "faculty-123");

    expect(superAdmin.isSuperAdmin).toBe(true);
    expect(superAdmin.isFacultyAdmin).toBe(false);
    expect(superAdmin.facultyId).toBeNull();

    expect(facultyAdmin.isFacultyAdmin).toBe(true);
    expect(facultyAdmin.isSuperAdmin).toBe(false);
    expect(facultyAdmin.facultyId).toBe("faculty-123");
  });
});
