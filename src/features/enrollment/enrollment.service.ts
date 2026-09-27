import { createClient } from "@/lib/supabase/server";
import type { Department } from "@/types/department";
import type { Faculty } from "@/types/faculty";

export async function getPublicFacultyOptions(): Promise<Faculty[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    return [];
  }

  const supabaseClient = await createClient();
  const { data, error } = await supabaseClient
    .from("faculties")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch faculties: ${error.message}`);
  }

  return data ?? [];
}

export async function getPublicDepartmentOptions(): Promise<Department[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    return [];
  }

  const supabaseClient = await createClient();
  const { data, error } = await supabaseClient
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch departments: ${error.message}`);
  }

  return data ?? [];
}
