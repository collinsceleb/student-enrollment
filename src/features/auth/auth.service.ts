import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type AdminRole = Database["public"]["Enums"]["admin_role"];

export interface AdminAccessContext {
  role: AdminRole | null;
  facultyId: string | null;
  isSuperAdmin: boolean;
  isFacultyAdmin: boolean;
}

export function normalizeAdminRole(
  value: string | null | undefined
): AdminRole | null {
  if (value === "SUPER_ADMIN" || value === "FACULTY_ADMIN") {
    return value;
  }

  return null;
}

export function getAdminAccessContext(
  role: string | null | undefined,
  facultyId: string | null | undefined
): AdminAccessContext {
  const normalizedRole = normalizeAdminRole(role);

  if (normalizedRole === "SUPER_ADMIN") {
    return {
      role: normalizedRole,
      facultyId: null,
      isSuperAdmin: true,
      isFacultyAdmin: false,
    };
  }

  if (normalizedRole === "FACULTY_ADMIN") {
    return {
      role: normalizedRole,
      facultyId: facultyId ?? null,
      isSuperAdmin: false,
      isFacultyAdmin: true,
    };
  }

  return {
    role: null,
    facultyId: null,
    isSuperAdmin: false,
    isFacultyAdmin: false,
  };
}

export async function getCurrentAdminProfile(
  supabase: SupabaseClient<Database>
): Promise<{
  data: { role: AdminRole; faculty_id: string | null } | null;
  error: Error | null;
}> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError ?? new Error("User not authenticated."),
    };
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("role, faculty_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return {
    data: {
      role: normalizeAdminRole(data.role) ?? "FACULTY_ADMIN",
      faculty_id: data.faculty_id,
    },
    error: null,
  };
}
