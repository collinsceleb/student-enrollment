import { describe, expect, it } from "vitest";

import { hasDepartmentStudents } from "@/features/department/department-management.service";

describe("Department deletion dependency checks", () => {
  it("blocks deletion while students are assigned", () => {
    expect(hasDepartmentStudents(1)).toBe(true);
  });

  it("allows deletion when no students are assigned", () => {
    expect(hasDepartmentStudents(0)).toBe(false);
  });
});
