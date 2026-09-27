import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import type { FacultyInput } from "@/lib/validation/faculty.schema";

export type FacultyDeleteBlocker =
  "departments" | "students" | "faculty-admins" | null;

export function getFacultyDeleteBlocker(counts: {
  departments: number;
  students: number;
  facultyAdmins: number;
}): FacultyDeleteBlocker {
  if (counts.departments > 0) return "departments";
  if (counts.students > 0) return "students";
  if (counts.facultyAdmins > 0) return "faculty-admins";
  return null;
}

export type FacultyMutationResult =
  | { status: "success" }
  | { status: "duplicate" | "not-found" | "has-dependencies" | "failed" };

export async function createFaculty(
  supabase: SupabaseClient<Database>,
  input: FacultyInput
): Promise<FacultyMutationResult> {
  const { error } = await supabase.from("faculties").insert(input);

  if (!error) return { status: "success" };
  return { status: error.code === "23505" ? "duplicate" : "failed" };
}

export async function updateFaculty(
  supabase: SupabaseClient<Database>,
  id: string,
  input: FacultyInput
): Promise<FacultyMutationResult> {
  const { data, error } = await supabase
    .from("faculties")
    .update(input)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: error.code === "23505" ? "duplicate" : "failed" };
  }
  return data ? { status: "success" } : { status: "not-found" };
}

export async function deleteFacultySafely(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<FacultyMutationResult> {
  const [departments, students, facultyAdmins] = await Promise.all([
    supabase
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("faculty_id", id),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("faculty_id", id),
    supabase
      .from("admin_profiles")
      .select("id", { count: "exact", head: true })
      .eq("faculty_id", id)
      .eq("role", "FACULTY_ADMIN"),
  ]);

  if (departments.error || students.error || facultyAdmins.error) {
    return { status: "failed" };
  }

  const blocker = getFacultyDeleteBlocker({
    departments: departments.count ?? 0,
    students: students.count ?? 0,
    facultyAdmins: facultyAdmins.count ?? 0,
  });

  if (blocker) return { status: "has-dependencies" };

  const { data, error } = await supabase
    .from("faculties")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: error.code === "23503" ? "has-dependencies" : "failed",
    };
  }
  return data ? { status: "success" } : { status: "not-found" };
}
