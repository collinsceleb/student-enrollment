import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnvIfPresent() {
  const localEnvFiles = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const filePath of localEnvFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const [key, ...rest] = line.split("=");
      const value = rest.join("=").trim();
      const cleanedValue = value.replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = cleanedValue;
      }
    }
  }
}

async function ensureInitialSuperAdmin() {
  // Local development may use a gitignored .env.local file.
  // Hosted environments should inject these values directly as server env vars.
  loadLocalEnvIfPresent();

  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    console.log(
      "Skipping super-admin bootstrap: no SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD configured."
    );
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SUPER_ADMIN_EMAIL must be a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    console.log(
      "Skipping super-admin bootstrap: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY."
    );
    return;
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

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
    console.log("Super admin already exists; bootstrap skipped.");
    return;
  }

  const { data: createdUserData, error: userCreationError } =
    await supabase.auth.admin.createUser({
      email,
      password,
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

  console.log(`Initial super admin created successfully: ${email}`);
}

ensureInitialSuperAdmin().catch((error) => {
  console.error("Super admin bootstrap failed:", error.message);
  process.exit(1);
});
