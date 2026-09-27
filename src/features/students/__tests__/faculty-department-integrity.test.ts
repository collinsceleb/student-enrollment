import { describe, it, expect, vi } from "vitest";
import {
  verifyFacultyDepartmentMatch,
  createStudent,
  updateStudent,
  FacultyDepartmentMismatchError,
  DepartmentNotFoundError,
} from "@/features/students/student.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

describe("Database & Server Integrity (Faculty / Department Association)", () => {
  // Setup mock data based on the specification's exact example:
  // Faculty A -> Department A1, Department A2
  // Faculty B -> Department B1, Department B2
  const FACULTY_A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const FACULTY_B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

  const DEPT_A1 = "11111111-1111-4111-1111-111111111111";
  const DEPT_B1 = "22222222-2222-4222-2222-222222222222";

  const departmentsDb: Record<string, { id: string; faculty_id: string }> = {
    [DEPT_A1]: { id: DEPT_A1, faculty_id: FACULTY_A },
    [DEPT_B1]: { id: DEPT_B1, faculty_id: FACULTY_B },
  };

  function createMockSupabase(insertedRows: any[] = []) {
    return {
      from: vi.fn((table: string) => {
        if (table === "departments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((col: string, val: string) => ({
                maybeSingle: vi.fn(async () => {
                  const dept = departmentsDb[val];
                  return { data: dept ?? null, error: null };
                }),
              })),
            })),
          };
        }

        if (table === "students") {
          return {
            insert: vi.fn((row: any) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  insertedRows.push(row);
                  return {
                    data: { id: "new-student-id", ...row },
                    error: null,
                  };
                }),
              })),
            })),
            select: vi.fn(() => ({
              eq: vi.fn((col: string, id: string) => ({
                single: vi.fn(async () => {
                  const student = insertedRows.find((s) => s.id === id);
                  return {
                    data: student ?? {
                      faculty_id: FACULTY_A,
                      department_id: DEPT_A1,
                    },
                    error: null,
                  };
                }),
              })),
            })),
            update: vi.fn((updates: any) => ({
              eq: vi.fn((col: string, id: string) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    return { data: { id, ...updates }, error: null };
                  }),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;
  }

  describe("verifyFacultyDepartmentMatch()", () => {
    it("should succeed when department belongs to submitted faculty (Faculty A + Department A1)", async () => {
      const mockSupabase = createMockSupabase();
      const result = await verifyFacultyDepartmentMatch(
        mockSupabase,
        FACULTY_A,
        DEPT_A1
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject manipulated request where department belongs to a different faculty (Faculty A + Department B1)", async () => {
      const mockSupabase = createMockSupabase();
      const result = await verifyFacultyDepartmentMatch(
        mockSupabase,
        FACULTY_A,
        DEPT_B1
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        `Department "${DEPT_B1}" belongs to faculty "${FACULTY_B}", not submitted faculty "${FACULTY_A}".`
      );
    });

    it("should throw DepartmentNotFoundError if the department does not exist", async () => {
      const mockSupabase = createMockSupabase();
      const nonExistentDept = "99999999-9999-4999-9999-999999999999";

      await expect(
        verifyFacultyDepartmentMatch(mockSupabase, FACULTY_A, nonExistentDept)
      ).rejects.toThrow(DepartmentNotFoundError);
    });
  });

  describe("createStudent() server integrity enforcement", () => {
    it("should reject and abort insert when a manipulated request sends Faculty A with Department B1", async () => {
      const insertedRows: any[] = [];
      const mockSupabase = createMockSupabase(insertedRows);

      const manipulatedEnrollment = {
        first_name: "Attacker",
        last_name: "Test",
        phone_number: "08012345678",
        registration_number: "HACK/2026/001",
        faculty_id: FACULTY_A,
        department_id: DEPT_B1, // Mismatched! Belongs to Faculty B
        admission_type: "JAMBITE" as const,
      };

      await expect(
        createStudent(mockSupabase, manipulatedEnrollment)
      ).rejects.toThrow(FacultyDepartmentMismatchError);

      // Verify that no student was inserted into the database
      expect(insertedRows.length).toBe(0);
    });

    it("should successfully insert when Faculty A with Department A1 is submitted", async () => {
      const insertedRows: any[] = [];
      const mockSupabase = createMockSupabase(insertedRows);

      const legitimateEnrollment = {
        first_name: "Sarah",
        last_name: "Connor",
        phone_number: "08099998888",
        registration_number: "SCI/2026/042",
        faculty_id: FACULTY_A,
        department_id: DEPT_A1, // Valid!
        admission_type: "DIRECT_ENTRY" as const,
      };

      const created = await createStudent(mockSupabase, legitimateEnrollment);
      expect(created).toBeDefined();
      expect(created.registration_number).toBe("SCI/2026/042");
      expect(insertedRows.length).toBe(1);
    });
  });

  describe("updateStudent() server integrity enforcement", () => {
    it("should reject updating student to a mismatched faculty/department combination", async () => {
      const mockSupabase = createMockSupabase();

      await expect(
        updateStudent(mockSupabase, "existing-id", {
          faculty_id: FACULTY_A,
          department_id: DEPT_B1, // Mismatched!
        })
      ).rejects.toThrow(FacultyDepartmentMismatchError);
    });
  });
});
