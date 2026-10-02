"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  removeSuperAdministrator,
  updateSuperAdministrator,
} from "@/features/administration/super-admin-management.service";
import { superAdminUpdateSchema } from "@/lib/validation/super-admin.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceAdminActionLimit } from "@/lib/server/admin-action-limit";

const userIdSchema = z.uuid();

async function requireSuperAdmin() {
  const supabaseClient = await createClient();
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  const profile = await getCurrentAdminProfile(supabaseClient);

  if (!user || profile.data?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  if (!profile.data.has_changed_password) {
    redirect("/change-password");
  }
  if (!profile.data.session_is_current) {
    redirect("/login");
  }

  await enforceAdminActionLimit(user.id);
  return user.id;
}

function finishSuperAdminAction(status: string) {
  revalidatePath("/admin");
  redirect(`/admin?superAdminStatus=${status}`);
}

function reportSuperAdminError(status: string): never {
  redirect(`/admin?superAdminError=${status}`);
}

export async function updateSuperAdminAction(formData: FormData) {
  await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));
  const input = superAdminUpdateSchema.safeParse({
    email: formData.get("email"),
  });

  if (!userId.success || !input.success) reportSuperAdminError("invalid");

  const result = await updateSuperAdministrator(
    createAdminClient(),
    userId.data,
    input.data
  );
  if (result.status !== "success") reportSuperAdminError(result.status);

  finishSuperAdminAction("updated");
}

export async function removeSuperAdminAction(formData: FormData) {
  const currentUserId = await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));

  if (!userId.success) reportSuperAdminError("invalid");

  const result = await removeSuperAdministrator(
    createAdminClient(),
    userId.data,
    currentUserId
  );
  if (result.status !== "success") reportSuperAdminError(result.status);

  finishSuperAdminAction("removed");
}
