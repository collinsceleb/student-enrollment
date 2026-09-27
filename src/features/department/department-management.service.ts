import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import type { DepartmentInput } from "@/lib/validation/department.schema";

export function hasDepartmentStudents(studentCount: number): boolean {
  return studentCount > 0;
}

export type DepartmentMutationResult =
  | { status: "success" }
  | {
      status:
        | "duplicate"
        | "invalid-faculty"
        | "not-found"
        | "has-students"
        | "failed";
    };

export async function createDepartment(
  supabase: SupabaseClient<Database>,
  input: DepartmentInput
): Promise<DepartmentMutationResult> {
  const { error } = await supabase.from("departments").insert(input);

  if (!error) return { status: "success" };
  if (error.code === "23505") return { status: "duplicate" };
  if (error.code === "23503") return { status: "invalid-faculty" };
  return { status: "failed" };
}

export async function updateDepartment(
  supabase: SupabaseClient<Database>,
  id: string,
  input: DepartmentInput
): Promise<DepartmentMutationResult> {
  const { data, error } = await supabase
    .from("departments")
    .update(input)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return { status: "duplicate" };
    if (error.code === "23503") return { status: "invalid-faculty" };
    return { status: "failed" };
  }
  return data ? { status: "success" } : { status: "not-found" };
}

export async function deleteDepartmentSafely(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<DepartmentMutationResult> {
  const { count, error: countError } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);

  if (countError) return { status: "failed" };
  if (hasDepartmentStudents(count ?? 0)) return { status: "has-students" };

  const { data, error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: error.code === "23503" ? "has-students" : "failed",
    };
  }
  return data ? { status: "success" } : { status: "not-found" };
}
