import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeExportDataset,
  authorizeExportScope,
  ExportPipelineError,
  getExportOrientation,
} from "@/features/exports/export-fields";
import { exportRequestSchema } from "@/features/exports/export.schema";
import type {
  AuthorizedExportScope,
  ExportProfile,
  ExportRequest,
  NormalizedExportDataset,
} from "@/features/exports/export.types";
import type { Database } from "@/types/database.types";
import type { StudentWithRelations } from "@/types/student";

type ExportSupabaseClient = SupabaseClient<Database>;

async function resolveScope(
  supabase: ExportSupabaseClient,
  profile: ExportProfile,
  request: ExportRequest
): Promise<{ scope: AuthorizedExportScope; title: string }> {
  const requestedScope = authorizeExportScope(profile, request);
  if (!requestedScope) {
    throw new ExportPipelineError(
      "You are not authorized for this export scope.",
      403
    );
  }

  if (requestedScope.kind === "all") {
    return {
      scope: requestedScope,
      title: "All Student Enrollment Records",
    };
  }

  if (requestedScope.kind === "faculty") {
    const { data: faculty, error } = await supabase
      .from("faculties")
      .select("id, name")
      .eq("id", requestedScope.facultyId)
      .maybeSingle();

    if (error)
      throw new ExportPipelineError("Could not validate export faculty.", 500);
    if (!faculty) throw new ExportPipelineError("Faculty not found.", 404);

    return {
      scope: requestedScope,
      title: `${faculty.name} Student Enrollment Records`,
    };
  }

  const { data: department, error } = await supabase
    .from("departments")
    .select(
      "id, name, faculty_id, faculty:faculties!departments_faculty_id_fkey(name)"
    )
    .eq("id", requestedScope.departmentId)
    .maybeSingle();

  if (error) {
    throw new ExportPipelineError("Could not validate export department.", 500);
  }
  if (!department) throw new ExportPipelineError("Department not found.", 404);
  if (
    requestedScope.facultyId &&
    requestedScope.facultyId !== department.faculty_id
  ) {
    throw new ExportPipelineError(
      "Department is outside the authorized faculty.",
      403
    );
  }

  return {
    scope: {
      kind: "department",
      departmentId: department.id,
      facultyId: department.faculty_id,
    },
    title: `${department.faculty.name} - ${department.name} Student Records`,
  };
}

async function resolveSelectedRecords(
  supabase: ExportSupabaseClient,
  scope: AuthorizedExportScope
): Promise<StudentWithRelations[]> {
  const pageSize = 500;
  const students: StudentWithRelations[] = [];

  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from("students")
      .select(
        `
          id,
          first_name,
          last_name,
          other_name,
          phone_number,
          registration_number,
          faculty_id,
          department_id,
          admission_type,
          faculty:faculties!students_faculty_id_fkey (id, name, code),
          department:departments!students_department_id_fkey (id, faculty_id, name, code)
        `
      )
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (scope.kind === "faculty") {
      query = query.eq("faculty_id", scope.facultyId);
    }
    if (scope.kind === "department") {
      if (!scope.facultyId) {
        throw new ExportPipelineError(
          "Department faculty was not resolved.",
          500
        );
      }
      query = query.eq("faculty_id", scope.facultyId);
      query = query.eq("department_id", scope.departmentId);
    }

    const { data, error } = await query;
    if (error) {
      throw new ExportPipelineError("Could not resolve export records.", 500);
    }

    const page = (data ?? []) as unknown as StudentWithRelations[];
    students.push(...page);
    if (page.length < pageSize) return students;
  }
}

export async function buildExportDataset(
  supabase: ExportSupabaseClient,
  profile: ExportProfile,
  rawRequest: unknown,
  now = new Date()
): Promise<NormalizedExportDataset> {
  const parsed = exportRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    throw new ExportPipelineError("Invalid export request.", 400);
  }

  if (!profile.has_changed_password || !profile.session_is_current) {
    throw new ExportPipelineError(
      "Please sign in with your current password.",
      401
    );
  }

  const request = parsed.data;
  const { scope, title: resolvedTitle } = await resolveScope(
    supabase,
    profile,
    request
  );
  const records = await resolveSelectedRecords(supabase, scope);
  const createdAt = now.toISOString();

  const title = request.title?.trim() || resolvedTitle;
  const subtitle =
    request.subtitle?.trim() || `${records.length} student records`;
  const totalSelectedFields = request.fields?.length ?? 8;

  return normalizeExportDataset(
    records,
    request.fields,
    scope,
    request.format,
    {
      title,
      subtitle,
      orientation: getExportOrientation(totalSelectedFields),
      createdAt,
    }
  );
}
