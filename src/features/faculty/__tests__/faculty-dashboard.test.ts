import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildFacultyDashboardSummary,
  filterStudentsForFacultyDashboard,
  getFacultyDashboardSummary,
} from "@/features/faculty/faculty.service";
import type { Database } from "@/types/database.types";
import type { StudentWithRelations } from "@/types/student";

describe("Faculty dashboard summary", () => {
  it("aggregates student counts and department totals correctly", () => {
    const students: StudentWithRelations[] = [
      {
        id: "1",
        first_name: "Ada",
        last_name: "Lovelace",
        other_name: "Byron",
        phone_number: "08011111111",
        registration_number: "REG-001",
        faculty_id: "faculty-1",
        department_id: "dept-1",
        admission_type: "JAMBITE",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        faculty: {
          id: "faculty-1",
          name: "Engineering",
          code: "ENG",
          created_at: "",
          updated_at: "",
        },
        department: {
          id: "dept-1",
          faculty_id: "faculty-1",
          name: "Computer Science",
          code: "CS",
          created_at: "",
          updated_at: "",
        },
      },
      {
        id: "2",
        first_name: "Grace",
        last_name: "Hopper",
        other_name: null,
        phone_number: "08022222222",
        registration_number: "REG-002",
        faculty_id: "faculty-1",
        department_id: "dept-2",
        admission_type: "DIRECT_ENTRY",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        faculty: {
          id: "faculty-1",
          name: "Engineering",
          code: "ENG",
          created_at: "",
          updated_at: "",
        },
        department: {
          id: "dept-2",
          faculty_id: "faculty-1",
          name: "Electrical",
          code: "EE",
          created_at: "",
          updated_at: "",
        },
      },
      {
        id: "3",
        first_name: "Linus",
        last_name: "Torvalds",
        other_name: "Benedict",
        phone_number: "08033333333",
        registration_number: "REG-003",
        faculty_id: "faculty-1",
        department_id: "dept-1",
        admission_type: "JAMBITE",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        faculty: {
          id: "faculty-1",
          name: "Engineering",
          code: "ENG",
          created_at: "",
          updated_at: "",
        },
        department: {
          id: "dept-1",
          faculty_id: "faculty-1",
          name: "Computer Science",
          code: "CS",
          created_at: "",
          updated_at: "",
        },
      },
    ];
    const summary = buildFacultyDashboardSummary(students);

    expect(summary.totalStudents).toBe(3);
    expect(summary.jambiteCount).toBe(2);
    expect(summary.directEntryCount).toBe(1);
    expect(summary.departmentBreakdown).toEqual([
      { departmentName: "Computer Science", total: 2 },
      { departmentName: "Electrical", total: 1 },
    ]);

    expect(
      filterStudentsForFacultyDashboard(students, {
        search: "ada lovelace",
        departmentId: "dept-1",
        admissionType: "JAMBITE",
      }).map((student) => student.id)
    ).toEqual(["1"]);
  });

  it("uses exact database counts for the full faculty summary", async () => {
    const from = vi.fn(() => ({
      select: vi.fn(() => {
        const filters = new Map<string, string>();
        const query = {
          eq: vi.fn((column: string, value: string) => {
            filters.set(column, value);
            return query;
          }),
          then: (
            resolve: (result: { count: number; error: null }) => unknown
          ) => {
            const departmentId = filters.get("department_id");
            const count = departmentId
              ? departmentId === "dept-1"
                ? 24
                : departmentId === "dept-2"
                  ? 12
                  : 0
              : filters.get("admission_type") === "JAMBITE"
                ? 26
                : filters.get("admission_type") === "DIRECT_ENTRY"
                  ? 10
                  : 36;

            return Promise.resolve({ count, error: null }).then(resolve);
          },
        };
        return query;
      }),
    }));
    const supabase = { from } as unknown as SupabaseClient<Database>;

    await expect(
      getFacultyDashboardSummary(supabase, "faculty-1", [
        { id: "dept-1", name: "Computer Science" },
        { id: "dept-2", name: "Electrical" },
        { id: "dept-3", name: "Mathematics" },
      ])
    ).resolves.toEqual({
      totalStudents: 36,
      jambiteCount: 26,
      directEntryCount: 10,
      departmentBreakdown: [
        { departmentName: "Computer Science", total: 24 },
        { departmentName: "Electrical", total: 12 },
      ],
    });

    expect(from).toHaveBeenCalledTimes(6);
  });
});
