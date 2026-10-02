import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import {
  createFaculty,
  getFacultyDeleteBlocker,
  updateFaculty,
} from "@/features/faculty/faculty-management.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { FacultyInput } from "@/lib/validation/faculty.schema";

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

describe("Faculty management service", () => {
  const facultyInput: FacultyInput = {
    name: "Faculty of Engineering",
    code: "ENG",
  };

  it("creates a faculty through the faculty table", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await expect(createFaculty(supabase, facultyInput)).resolves.toEqual({
      status: "success",
    });
    expect(supabase.from).toHaveBeenCalledWith("faculties");
    expect(insert).toHaveBeenCalledWith(facultyInput);
  });

  it("maps duplicate faculty codes to a user-facing duplicate result", async () => {
    const insert = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "duplicate key" },
    });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await expect(createFaculty(supabase, facultyInput)).resolves.toEqual({
      status: "duplicate",
    });
  });

  it("reports a missing faculty when an update matches no row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const query = {
      eq: () => query,
      select: () => query,
      maybeSingle,
    };
    const supabase = {
      from: vi.fn(() => ({ update: () => query })),
    } as unknown as SupabaseClient<Database>;

    await expect(
      updateFaculty(
        supabase,
        "11111111-1111-4111-8111-111111111111",
        facultyInput
      )
    ).resolves.toEqual({ status: "not-found" });
  });
});
