import type { createAdminClient } from "@/lib/supabase/admin";
import type {
  FacultyAdminAssignmentInput,
  FacultyAdminCreateInput,
} from "@/lib/validation/faculty-admin.schema";
import { getTemporaryPasswordIssuedAt } from "@/features/auth/temporary-password";

type AdminClient = ReturnType<typeof createAdminClient>;

export type FacultyAdministrator = {
  id: string;
  user_id: string;
  faculty_id: string | null;
  email: string | null;
  has_changed_password: boolean;
};

export type FacultyAdminMutationResult =
  | { status: "success" }
  | {
      status: "duplicate-email" | "invalid-faculty" | "not-found" | "failed";
    };

export async function getFacultyAdministrators(
  supabase: AdminClient
): Promise<FacultyAdministrator[]> {
  const { data: profiles, error } = await supabase
    .from("admin_profiles")
    .select("id, user_id, faculty_id, has_changed_password")
    .eq("role", "FACULTY_ADMIN")
    .order("faculty_id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch faculty administrators: ${error.message}`);
  }

  return Promise.all(
    profiles.map(async (profile) => {
      const { data, error: userError } = await supabase.auth.admin.getUserById(
        profile.user_id
      );

      if (userError) {
        throw new Error(
          `Failed to fetch faculty administrator email: ${userError.message}`
        );
      }

      return { ...profile, email: data.user?.email ?? null };
    })
  );
}

export async function createFacultyAdministrator(
  supabase: AdminClient,
  input: FacultyAdminCreateInput,
  temporaryPassword: string,
  temporaryPasswordResetId: string
): Promise<FacultyAdminMutationResult> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (error || !data.user) {
    const errorMessage = error?.message.toLowerCase() ?? "";
    return {
      status:
        error?.code === "email_exists" ||
        errorMessage.includes("already registered")
          ? "duplicate-email"
          : "failed",
    };
  }

  const { error: profileError } = await supabase.from("admin_profiles").insert({
    user_id: data.user.id,
    role: "FACULTY_ADMIN",
    faculty_id: input.faculty_id,
    has_changed_password: false,
    temporary_password_issued_at: getTemporaryPasswordIssuedAt(),
    temporary_password_reset_id: temporaryPasswordResetId,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    return {
      status: profileError.code === "23503" ? "invalid-faculty" : "failed",
    };
  }

  return { status: "success" };
}

export async function updateFacultyAdministratorAssignment(
  supabase: AdminClient,
  userId: string,
  input: FacultyAdminAssignmentInput
): Promise<FacultyAdminMutationResult> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .update({ faculty_id: input.faculty_id })
    .eq("user_id", userId)
    .eq("role", "FACULTY_ADMIN")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: error.code === "23503" ? "invalid-faculty" : "failed",
    };
  }

  return data ? { status: "success" } : { status: "not-found" };
}

export async function removeFacultyAdministrator(
  supabase: AdminClient,
  userId: string
): Promise<FacultyAdminMutationResult> {
  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return {
      status: error.code === "user_not_found" ? "not-found" : "failed",
    };
  }

  return data.user ? { status: "success" } : { status: "not-found" };
}
