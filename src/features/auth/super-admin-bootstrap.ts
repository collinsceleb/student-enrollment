export interface SuperAdminBootstrapConfig {
  email: string;
  password: string;
}

export type BootstrapEnvironment = Record<string, string | undefined>;

export function getSuperAdminBootstrapConfig(
  env: BootstrapEnvironment = process.env as BootstrapEnvironment
): SuperAdminBootstrapConfig | null {
  const email = env.SUPER_ADMIN_EMAIL?.trim();
  const password = env.SUPER_ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SUPER_ADMIN_EMAIL must be a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD must be at least 8 characters long.");
  }

  return { email, password };
}

export async function ensureFirstSuperAdmin() {
  const config = getSuperAdminBootstrapConfig();

  if (!config) {
    throw new Error(
      "Super admin bootstrap is not configured. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in your local environment before bootstrapping."
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: existingSuperAdmins, error: existingError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("role", "SUPER_ADMIN")
    .limit(1);

  if (existingError) {
    throw new Error(
      `Failed to check for existing super admins: ${existingError.message}`
    );
  }

  if (existingSuperAdmins && existingSuperAdmins.length > 0) {
    return {
      created: false,
      message: "A super admin already exists in the system.",
    };
  }

  const { data: createdUserData, error: userCreationError } =
    await supabase.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: {
        role: "SUPER_ADMIN",
      },
    });

  if (userCreationError || !createdUserData.user) {
    throw new Error(
      userCreationError?.message ??
        "Failed to create the initial super admin user."
    );
  }

  const { error: profileError } = await supabase.from("admin_profiles").insert({
    user_id: createdUserData.user.id,
    role: "SUPER_ADMIN",
    faculty_id: null,
  });

  if (profileError) {
    throw new Error(
      `User was created but profile assignment failed: ${profileError.message}`
    );
  }

  return {
    created: true,
    email: config.email,
    message: "Initial super admin account created successfully.",
  };
}
