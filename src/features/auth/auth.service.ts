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

export function isSessionCurrentAfterTemporaryPassword(
  temporaryPasswordIssuedAt: string | null,
  authTime: number
): boolean {
  if (!temporaryPasswordIssuedAt) return true;

  const issuanceSecond = Math.floor(
    Date.parse(temporaryPasswordIssuedAt) / 1000
  );
  return Number.isFinite(authTime) && authTime >= issuanceSecond;
}

export function getAuthTimeFromClaims(data: unknown): number {
  if (typeof data !== "object" || data === null || !("claims" in data)) {
    return 0;
  }

  const claims = data.claims;
  if (
    typeof claims !== "object" ||
    claims === null ||
    !("auth_time" in claims)
  ) {
    return 0;
  }

  return Number(claims.auth_time ?? 0);
}

export async function getCurrentAdminProfile(
  supabase: SupabaseClient<Database>
): Promise<{
  data: {
    role: AdminRole;
    faculty_id: string | null;
    has_changed_password: boolean;
    session_is_current: boolean;
    temporary_password_issued_at: string | null;
  } | null;
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
    .select(
      "role, faculty_id, has_changed_password, temporary_password_issued_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const { data: claims } = await supabase.auth.getClaims();
  const authTime = getAuthTimeFromClaims(claims);
  return {
    data: {
      role: normalizeAdminRole(data.role) ?? "FACULTY_ADMIN",
      faculty_id: data.faculty_id,
      has_changed_password: data.has_changed_password,
      session_is_current: isSessionCurrentAfterTemporaryPassword(
        data.temporary_password_issued_at,
        authTime
      ),
      temporary_password_issued_at: data.temporary_password_issued_at,
    },
    error: null,
  };
}
