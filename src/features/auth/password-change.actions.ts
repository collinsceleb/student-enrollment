"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { passwordChangeSchema } from "@/lib/validation/password-change.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function reportError(code: string): never {
  redirect(`/change-password?error=${code}`);
}

export async function changeOwnPasswordAction(formData: FormData) {
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) reportError("invalid");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const profile = await getCurrentAdminProfile(supabase);
  if (!profile.data?.role) redirect("/login");

  const { data: reauthenticated, error: reauthenticationError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });

  if (reauthenticationError || reauthenticated.user?.id !== user.id) {
    reportError("incorrect-current");
  }

  const { error: passwordError } = await supabase.auth.updateUser({
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
