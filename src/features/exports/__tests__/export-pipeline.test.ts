import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

import { buildExportDataset } from "@/features/exports/export-pipeline";
import type { Database } from "@/types/database.types";

interface MockQuery {
  data: unknown;
  error: null;
  select: () => MockQuery;
  eq: (column: string, value: string) => MockQuery;
  order: () => MockQuery;
  range: () => MockQuery;
  maybeSingle: () => Promise<{ data: unknown; error: null }>;
}

const FACULTY_ONE_ID = "11111111-1111-4111-8111-111111111111";
const FACULTY_TWO_ID = "22222222-2222-4222-8222-222222222222";
const FOREIGN_DEPARTMENT_ID = "33333333-3333-4333-8333-333333333333";

function createSupabaseFixture(departmentFacultyId = FACULTY_TWO_ID) {
  const tables: string[] = [];
  const filters: Array<{ table: string; column: string; value: string }> = [];

  const client = {
    from(table: string) {
      tables.push(table);
      const query: MockQuery = {
        data: [],
        error: null,
        select: () => query,
        eq: (column, value) => {
          filters.push({ table, column, value });
          return query;
        },
        order: () => query,
        range: () => query,
        maybeSingle: async () => ({
          data:
            table === "faculties"
              ? { id: FACULTY_ONE_ID, name: "Faculty One" }
              : {
                  id: FOREIGN_DEPARTMENT_ID,
                  name: "Foreign Department",
                  faculty_id: departmentFacultyId,
                  faculty: { name: "Faculty Two" },
                },
          error: null,
        }),
      };
      return query;
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    filters,
    tables,
  };
}

const facultyAdminProfile = {
  role: "FACULTY_ADMIN" as const,
  faculty_id: FACULTY_ONE_ID,
  has_changed_password: true,
  session_is_current: true,
};

describe("export pipeline authorization", () => {
  it("uses the authenticated faculty instead of a tampered request faculty ID", async () => {
    const fixture = createSupabaseFixture();
    const dataset = await buildExportDataset(
      fixture.client,
      facultyAdminProfile,
      {
        format: "xlsx",
        scope: "faculty",
        faculty_id: FACULTY_TWO_ID,
      }
    );

    expect(dataset.scope).toEqual({
      kind: "faculty",
      facultyId: FACULTY_ONE_ID,
    });
    expect(fixture.filters).toContainEqual({
      table: "faculties",
      column: "id",
      value: FACULTY_ONE_ID,
    });
    expect(fixture.filters).toContainEqual({
      table: "students",
      column: "faculty_id",
      value: FACULTY_ONE_ID,
    });
    expect(fixture.filters).not.toContainEqual({
      table: "students",
      column: "faculty_id",
      value: FACULTY_TWO_ID,
    });
  });

  it("rejects a department belonging to another faculty before querying students", async () => {
    const fixture = createSupabaseFixture("faculty-2");

    await expect(
      buildExportDataset(fixture.client, facultyAdminProfile, {
        format: "xlsx",
        scope: "department",
        department_id: FOREIGN_DEPARTMENT_ID,
      })
    ).rejects.toMatchObject({
      name: "ExportPipelineError",
      status: 403,
    });

    expect(fixture.tables).toEqual(["departments"]);
    expect(fixture.filters).toContainEqual({
      table: "departments",
      column: "id",
      value: FOREIGN_DEPARTMENT_ID,
    });
  });

  it("rejects a faculty-admin all-data request before any database query", async () => {
    const fixture = createSupabaseFixture();

    await expect(
      buildExportDataset(fixture.client, facultyAdminProfile, {
        format: "xlsx",
        scope: "all",
      })
    ).rejects.toMatchObject({ status: 403 });

    expect(fixture.tables).toEqual([]);
  });
});
