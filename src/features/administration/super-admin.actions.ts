"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  createSuperAdministrator,
  removeSuperAdministrator,
  updateSuperAdministrator,
} from "@/features/administration/super-admin-management.service";
import {
  superAdminCreateSchema,
  superAdminUpdateSchema,
} from "@/lib/validation/super-admin.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.uuid();

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentAdminProfile(supabase);

  if (!user || profile.data?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return user.id;
}

function finishSuperAdminAction(status: string) {
  revalidatePath("/admin");
  redirect(`/admin?superAdminStatus=${status}`);
}

function reportSuperAdminError(status: string): never {
  redirect(`/admin?superAdminError=${status}`);
}

export async function createSuperAdminAction(formData: FormData) {
  await requireSuperAdmin();
  const parsed = superAdminCreateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) reportSuperAdminError("invalid");

  const result = await createSuperAdministrator(
    createAdminClient(),
    parsed.data
  );
  if (result.status !== "success") reportSuperAdminError(result.status);

  finishSuperAdminAction("created");
}

export async function updateSuperAdminAction(formData: FormData) {
  await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));
  const input = superAdminUpdateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
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
