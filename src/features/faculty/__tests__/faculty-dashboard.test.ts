import { describe, expect, it } from "vitest";

import { buildFacultyDashboardSummary } from "@/features/faculty/faculty.service";

describe("Faculty dashboard summary", () => {
  it("aggregates student counts and department totals correctly", () => {
    const summary = buildFacultyDashboardSummary([
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
    ] as any);

    expect(summary.totalStudents).toBe(3);
    expect(summary.jambiteCount).toBe(2);
    expect(summary.directEntryCount).toBe(1);
    expect(summary.departmentBreakdown).toEqual([
      { departmentName: "Computer Science", total: 2 },
      { departmentName: "Electrical", total: 1 },
    ]);
  });
});
