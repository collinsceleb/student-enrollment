import type { createAdminClient } from "@/lib/supabase/admin";
import { getTemporaryPasswordIssuedAt } from "@/features/auth/temporary-password";

type AdminClient = ReturnType<typeof createAdminClient>;

export type TemporaryPasswordIssueResult =
  | { status: "success"; email: string }
  | {
      status: "not-found" | "invalid-role" | "already-issued" | "failed";
    };

export async function issueTemporaryPassword(
  supabase: AdminClient,
  userId: string,
  temporaryPassword: string,
  resetId: string
): Promise<TemporaryPasswordIssueResult> {
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select(
      "role, has_changed_password, temporary_password_issued_at, temporary_password_reset_id"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) return { status: "failed" };
  if (!profile) return { status: "not-found" };
  if (profile.role !== "FACULTY_ADMIN" && profile.role !== "SUPER_ADMIN") {
    return { status: "invalid-role" };
  }
  const previousIssueTime = profile.temporary_password_issued_at
    ? Date.parse(profile.temporary_password_issued_at)
    : Number.NaN;
  if (
    !profile.has_changed_password &&
    Number.isFinite(previousIssueTime) &&
    Date.now() - previousIssueTime < 30_000
  ) {
    return { status: "already-issued" };
  }

  const issuedAt = getTemporaryPasswordIssuedAt();
  let updateQuery = supabase
    .from("admin_profiles")
    .update({
      has_changed_password: false,
      temporary_password_issued_at: issuedAt,
      temporary_password_reset_id: resetId,
    })
    .eq("user_id", userId)
    .eq("role", profile.role)
    .eq("has_changed_password", profile.has_changed_password);
  updateQuery = profile.temporary_password_issued_at
    ? updateQuery.eq(
        "temporary_password_issued_at",
        profile.temporary_password_issued_at
      )
    : updateQuery.is("temporary_password_issued_at", null);
  updateQuery = profile.temporary_password_reset_id
    ? updateQuery.eq(
        "temporary_password_reset_id",
        profile.temporary_password_reset_id
      )
    : updateQuery.is("temporary_password_reset_id", null);
  const { data: updatedProfile, error: profileUpdateError } = await updateQuery
    .select("user_id")
    .maybeSingle();

  if (profileUpdateError || !updatedProfile) {
    return { status: profileUpdateError ? "failed" : "already-issued" };
  }

  const { data: updatedUser, error: authError } =
    await supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    });

  if (authError) {
    await supabase
      .from("admin_profiles")
      .update({
        has_changed_password: profile.has_changed_password,
        temporary_password_issued_at: profile.temporary_password_issued_at,
        temporary_password_reset_id: profile.temporary_password_reset_id,
      })
      .eq("user_id", userId)
      .eq("role", profile.role)
      .eq("temporary_password_reset_id", resetId);

    return {
      status: authError.code === "user_not_found" ? "not-found" : "failed",
    };
  }

  return {
    status: "success",
    email: updatedUser.user.email ?? "",
  };
}
