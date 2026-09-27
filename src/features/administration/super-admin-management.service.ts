import type { createAdminClient } from "@/lib/supabase/admin";
import type {
  SuperAdminCreateInput,
  SuperAdminUpdateInput,
} from "@/lib/validation/super-admin.schema";

type AdminClient = ReturnType<typeof createAdminClient>;

export type SuperAdministrator = {
  id: string;
  user_id: string;
  email: string | null;
};

export type SuperAdminMutationResult =
  | { status: "success" }
  | {
      status:
        | "duplicate-email"
        | "last-super-admin"
        | "self-removal"
        | "not-found"
        | "failed";
    };

export function getSuperAdminRemovalBlocker(
  adminCount: number,
  isCurrentUser: boolean
): "self-removal" | "last-super-admin" | null {
  if (isCurrentUser) return "self-removal";
  if (adminCount <= 1) return "last-super-admin";
  return null;
}

function isDuplicateEmailError(error: { code?: string; message: string }) {
  const message = error.message.toLowerCase();
  return (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

export async function getSuperAdministrators(
  supabase: AdminClient
): Promise<SuperAdministrator[]> {
  const { data: profiles, error } = await supabase
    .from("admin_profiles")
    .select("id, user_id")
    .eq("role", "SUPER_ADMIN")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch super administrators: ${error.message}`);
  }

  return Promise.all(
    profiles.map(async (profile) => {
      const { data, error: userError } = await supabase.auth.admin.getUserById(
        profile.user_id
      );

      if (userError) {
        throw new Error(
          `Failed to fetch super administrator email: ${userError.message}`
        );
      }

      return { ...profile, email: data.user?.email ?? null };
    })
  );
}

export async function createSuperAdministrator(
  supabase: AdminClient,
  input: SuperAdminCreateInput
): Promise<SuperAdminMutationResult> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return {
      status:
        error && isDuplicateEmailError(error) ? "duplicate-email" : "failed",
    };
  }

  const { error: profileError } = await supabase.from("admin_profiles").insert({
    user_id: data.user.id,
    role: "SUPER_ADMIN",
    faculty_id: null,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    return { status: "failed" };
  }

  return { status: "success" };
}

export async function updateSuperAdministrator(
  supabase: AdminClient,
  userId: string,
  input: SuperAdminUpdateInput
): Promise<SuperAdminMutationResult> {
  const attributes: {
    email: string;
    email_confirm: boolean;
    password?: string;
  } = {
    email: input.email,
    email_confirm: true,
  };
  if (input.password) attributes.password = input.password;

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    attributes
  );

  if (error) {
    return {
      status: isDuplicateEmailError(error) ? "duplicate-email" : "failed",
    };
  }
  return data.user ? { status: "success" } : { status: "not-found" };
}

export async function removeSuperAdministrator(
  supabase: AdminClient,
  userId: string,
  currentUserId: string
): Promise<SuperAdminMutationResult> {
  const { data: target, error: targetError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "SUPER_ADMIN")
    .maybeSingle();

  if (targetError) return { status: "failed" };
  if (!target) return { status: "not-found" };

  const { count, error: countError } = await supabase
    .from("admin_profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "SUPER_ADMIN");

  if (countError) return { status: "failed" };

  const blocker = getSuperAdminRemovalBlocker(
    count ?? 0,
    userId === currentUserId
  );
  if (blocker) return { status: blocker };

  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    const message = error.message.toLowerCase();
    if (error.code === "user_not_found") return { status: "not-found" };
    if (error.code === "23514" || message.includes("last super admin")) {
      return { status: "last-super-admin" };
    }
    return { status: "failed" };
  }

  return data.user ? { status: "success" } : { status: "not-found" };
}
