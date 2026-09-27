import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Faculty, FacultyWithDepartments } from "@/types/faculty";

export async function getFaculties(
  supabase: SupabaseClient<Database>
): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch faculties: ${error.message}`);
  }

  return data ?? [];
}

export async function getFacultyById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Faculty | null> {
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch faculty by id: ${error.message}`);
  }

  return data;
}

export async function getFacultyWithDepartments(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<FacultyWithDepartments | null> {
  const { data, error } = await supabase
    .from("faculties")
    .select(
      `
      *,
      departments (
        id,
        name,
        code
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(
      `Failed to fetch faculty with departments: ${error.message}`
    );
  }

  return data as unknown as FacultyWithDepartments;
}
