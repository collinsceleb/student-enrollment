import { describe, expect, it } from "vitest";

import {
  authorizeExportScope,
  createCustomExportFieldRequest,
  databaseExportFields,
  getExportOrientation,
  normalizeExportDataset,
  resolveExportFields,
} from "@/features/exports/export-fields";
import { exportRequestSchema } from "@/features/exports/export.schema";
import type { StudentWithRelations } from "@/types/student";

const student: StudentWithRelations = {
  id: "student-id",
  first_name: "Ama",
  last_name: "Mensah",
  other_name: null,
  phone_number: "08000000000",
  registration_number: "REG-001",
  faculty_id: "faculty-1",
  department_id: "department-1",
  admission_type: "JAMBITE",
  created_at: "2026-09-27T00:00:00.000Z",
  updated_at: "2026-09-27T00:00:00.000Z",
  faculty: {
    id: "faculty-1",
    name: "Faculty of Science",
    code: "SCI",
    created_at: "2026-09-27T00:00:00.000Z",
    updated_at: "2026-09-27T00:00:00.000Z",
  },
  department: {
    id: "department-1",
    faculty_id: "faculty-1",
    name: "Biology",
    code: "BIO",
    created_at: "2026-09-27T00:00:00.000Z",
    updated_at: "2026-09-27T00:00:00.000Z",
  },
};

describe("export fields and scopes", () => {
  it("resolves only the server allowlist for database-backed fields", () => {
    expect(
      resolveExportFields([{ source: "database", id: "registrationNumber" }])
    ).toEqual([
      {
        id: "registrationNumber",
        source: "database",
        label: "Registration Number",
      },
    ]);
    expect("password" in databaseExportFields).toBe(false);
  });

  it("preserves export-only columns as empty values in the normalized dataset", () => {
    const dataset = normalizeExportDataset(
      [student],
      [
        { source: "database", id: "lastName" },
        { source: "export-only", id: "custom_remarks", label: "Remarks" },
      ],
      { kind: "faculty", facultyId: "faculty-1" },
      "xlsx",
      {
        title: "Faculty export",
        subtitle: "1 student record",
        orientation: "portrait",
        createdAt: "2026-09-27T00:00:00.000Z",
      }
    );

    expect(dataset.fields.map((field) => field.label)).toEqual([
      "Surname",
      "Remarks",
    ]);
    expect(dataset.rows).toEqual([["MENSAH", ""]]);
  });

  it("preserves ordered custom export fields with user labels", () => {
    const fields: import("@/features/exports/export.types").ExportFieldRequest[] =
      [
        { source: "database", id: "lastName" },
        createCustomExportFieldRequest("Documentation Status"),
        { source: "database", id: "registrationNumber" },
      ];

    expect(resolveExportFields(fields)).toEqual([
      { id: "lastName", source: "database", label: "Surname" },
      {
        id: "custom_documentation_status",
        source: "export-only",
        label: "Documentation Status",
      },
      {
        id: "registrationNumber",
        source: "database",
        label: "Registration Number",
      },
    ]);
  });

  it("does not allow faculty admins to request another faculty or all-data scope", () => {
    const profile = { role: "FACULTY_ADMIN" as const, faculty_id: "faculty-1" };
    expect(
      authorizeExportScope(profile, {
        scope: "faculty",
        faculty_id: "faculty-2",
      })
    ).toEqual({ kind: "faculty", facultyId: "faculty-1" });
    expect(authorizeExportScope(profile, { scope: "all" })).toBeNull();
    expect(
      authorizeExportScope(profile, {
        scope: "department",
        department_id: "department-1",
      })
    ).toEqual({
      kind: "department",
      departmentId: "department-1",
      facultyId: "faculty-1",
    });
  });

  it("resolves the real phase-24 scope from selected faculty and department filters", () => {
    expect(
      authorizeExportScope(
        { role: "FACULTY_ADMIN", faculty_id: "faculty-1" },
        { scope: "faculty" }
      )
    ).toEqual({ kind: "faculty", facultyId: "faculty-1" });
    expect(
      authorizeExportScope(
        { role: "FACULTY_ADMIN", faculty_id: "faculty-1" },
        { scope: "department", department_id: "department-2" }
      )
    ).toEqual({
      kind: "department",
      departmentId: "department-2",
      facultyId: "faculty-1",
    });
    expect(
      authorizeExportScope(
        { role: "FACULTY_ADMIN", faculty_id: "faculty-1" },
        {
          scope: "department",
          department_id: "department-2",
          faculty_id: "faculty-2",
        }
      )
    ).toBeNull();

    expect(
      authorizeExportScope(
        { role: "SUPER_ADMIN", faculty_id: null },
        { scope: "all" }
      )
    ).toEqual({ kind: "all" });
    expect(
      authorizeExportScope(
        { role: "SUPER_ADMIN", faculty_id: null },
        { scope: "faculty", faculty_id: "faculty-1" }
      )
    ).toEqual({ kind: "faculty", facultyId: "faculty-1" });
    expect(
      authorizeExportScope(
        { role: "SUPER_ADMIN", faculty_id: null },
        {
          scope: "department",
          department_id: "department-1",
          faculty_id: "faculty-1",
        }
      )
    ).toEqual({
      kind: "department",
      departmentId: "department-1",
      facultyId: "faculty-1",
    });
    expect(
      authorizeExportScope(
        { role: "SUPER_ADMIN", faculty_id: null },
        { scope: "department", department_id: "department-1" }
      )
    ).toBeNull();
  });

  it("counts export-only fields when selecting orientation", () => {
    expect(getExportOrientation(5)).toBe("portrait");
    expect(getExportOrientation(6)).toBe("portrait");
    expect(getExportOrientation(7)).toBe("landscape");
    expect(getExportOrientation(12)).toBe("landscape");
  });

  it("accepts custom title and subtitle metadata for exports", () => {
    expect(
      exportRequestSchema.safeParse({
        format: "docx",
        scope: "faculty",
        faculty_id: "11111111-1111-4111-8111-111111111111",
        title: "Faculty of Computing",
        subtitle: "2026 Admission Documentation",
        fields: [{ source: "database", id: "lastName" }],
      }).success
    ).toBe(true);
  });

  it("rejects unknown field identifiers and invalid scope shapes", () => {
    expect(
      exportRequestSchema.safeParse({
        format: "xlsx",
        scope: "faculty",
        faculty_id: "faculty-1",
        fields: [{ source: "database", id: "admin_password" }],
      }).success
    ).toBe(false);
    expect(
      exportRequestSchema.safeParse({ format: "xlsx", scope: "faculty" })
        .success
    ).toBe(true);
    expect(
      exportRequestSchema.safeParse({
        format: "xlsx",
        scope: "all",
        faculty_id: "faculty-1",
      }).success
    ).toBe(false);
  });
});
