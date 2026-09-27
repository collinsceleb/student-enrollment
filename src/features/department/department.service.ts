import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Department, DepartmentWithFaculty } from "@/types/department";

export async function getDepartmentsByFaculty(
  supabase: SupabaseClient<Database>,
  facultyId: string
): Promise<Department[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("faculty_id", facultyId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch departments: ${error.message}`);
  }

  return data ?? [];
}

export async function getDepartmentById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<DepartmentWithFaculty | null> {
  const { data, error } = await supabase
    .from("departments")
    .select(
      `
      *,
      faculty:faculties (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch department by id: ${error.message}`);
  }

  return data as unknown as DepartmentWithFaculty;
}
