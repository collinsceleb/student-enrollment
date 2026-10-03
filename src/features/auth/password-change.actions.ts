"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { passwordChangeSchema } from "@/lib/validation/password-change.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstileToken } from "@/lib/server/turnstile";

function reportError(code: string): never {
  redirect(`/change-password?error=${code}`);
}

export async function changeOwnPasswordAction(formData: FormData) {
  if (formData.get("website")) reportError("invalid");

  const verification = await verifyTurnstileToken(
    String(formData.get("turnstile_token") ?? ""),
    { expectedAction: "password_change" }
  );
  if (verification !== "verified") {
    reportError(
      verification === "unavailable"
        ? "verification-unavailable"
        : "verification-failed"
    );
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) reportError("invalid");

  const supabaseClient = await createClient();
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user?.email) redirect("/login");

  const profile = await getCurrentAdminProfile(supabaseClient);
  if (!profile.data?.role) redirect("/login");

  let reauthenticationLimit;
  try {
    reauthenticationLimit = await consumeRateLimit("password-reauth", user.id);
  } catch {
    reportError("rate-limit-unavailable");
  }
  if (!reauthenticationLimit.allowed) reportError("too-many-attempts");

  const { data: reauthenticated, error: reauthenticationError } =
    await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });

  if (reauthenticationError || reauthenticated.user?.id !== user.id) {
    reportError("incorrect-current");
  }

  const { error: passwordError } = await supabaseClient.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (passwordError) reportError("password-update");

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    reportError("profile-update");
  }

  const { data: updatedProfile, error: profileError } = await adminClient
    .from("admin_profiles")
    .update({ has_changed_password: true })
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (profileError || !updatedProfile) reportError("profile-update");

  revalidatePath("/admin");
  redirect("/admin");
}
