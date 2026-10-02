import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import {
  createDepartment,
  deleteDepartmentSafely,
  hasDepartmentStudents,
} from "@/features/department/department-management.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { DepartmentInput } from "@/lib/validation/department.schema";

describe("Department deletion dependency checks", () => {
  it("blocks deletion while students are assigned", () => {
    expect(hasDepartmentStudents(1)).toBe(true);
  });

  it("allows deletion when no students are assigned", () => {
    expect(hasDepartmentStudents(0)).toBe(false);
  });
});

describe("Department management service", () => {
  const departmentInput: DepartmentInput = {
    faculty_id: "11111111-1111-4111-8111-111111111111",
    name: "Computer Science",
    code: "CS",
  };

  it("creates a department through the departments table", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await expect(createDepartment(supabase, departmentInput)).resolves.toEqual({
      status: "success",
    });
    expect(supabase.from).toHaveBeenCalledWith("departments");
    expect(insert).toHaveBeenCalledWith(departmentInput);
  });

  it("maps a missing faculty foreign key to invalid-faculty", async () => {
    const insert = vi.fn().mockResolvedValue({
      error: { code: "23503", message: "foreign key violation" },
    });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await expect(createDepartment(supabase, departmentInput)).resolves.toEqual({
      status: "invalid-faculty",
    });
  });

  it("blocks department deletion while student records reference it", async () => {
    const studentQuery = {
      count: 3,
      error: null,
      eq: () => studentQuery,
    };
    const from = vi.fn(() => ({
      select: () => studentQuery,
      delete: vi.fn(),
    }));
    const supabase = { from } as unknown as SupabaseClient<Database>;

    await expect(
      deleteDepartmentSafely(supabase, "22222222-2222-4222-8222-222222222222")
    ).resolves.toEqual({ status: "has-students" });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("students");
  });
});
