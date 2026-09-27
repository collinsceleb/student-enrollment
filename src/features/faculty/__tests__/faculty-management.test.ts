import { describe, expect, it } from "vitest";

import { getFacultyDeleteBlocker } from "@/features/faculty/faculty-management.service";

describe("Faculty deletion dependency checks", () => {
  it("blocks deletion when departments are assigned", () => {
    expect(
      getFacultyDeleteBlocker({ departments: 1, students: 0, facultyAdmins: 0 })
    ).toBe("departments");
  });

  it("blocks deletion when students are assigned", () => {
    expect(
      getFacultyDeleteBlocker({ departments: 0, students: 1, facultyAdmins: 0 })
    ).toBe("students");
  });

  it("blocks deletion when faculty administrators are assigned", () => {
    expect(
      getFacultyDeleteBlocker({ departments: 0, students: 0, facultyAdmins: 1 })
    ).toBe("faculty-admins");
  });

  it("allows deletion only when no dependents remain", () => {
    expect(
      getFacultyDeleteBlocker({ departments: 0, students: 0, facultyAdmins: 0 })
    ).toBeNull();
  });
});
