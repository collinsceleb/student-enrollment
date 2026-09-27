"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  generateTemporaryPassword,
  generateTemporaryPasswordResetId,
} from "@/features/auth/temporary-password";
import { createFacultyAdministrator } from "@/features/administration/faculty-admin-management.service";
import { issueTemporaryPassword } from "@/features/administration/admin-password-management.service";
import { createSuperAdministrator } from "@/features/administration/super-admin-management.service";
import type { AdminPasswordActionState } from "@/features/administration/admin-password-action-state";
import { facultyAdminCreateSchema } from "@/lib/validation/faculty-admin.schema";
import { superAdminCreateSchema } from "@/lib/validation/super-admin.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.uuid();

async function requireSuperAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentAdminProfile(supabase);

  if (!user || profile.data?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  if (!profile.data.has_changed_password) {
    redirect("/change-password");
  }
  if (!profile.data.session_is_current) {
    redirect("/login");
  }

  return user.id;
}

function fail(code: string): AdminPasswordActionState {
  return { status: "error", code };
}

function created(temporaryPassword: string, email: string) {
  revalidatePath("/admin");
  return { status: "success", temporaryPassword, email } as const;
}

export async function createFacultyAdminAction(
  _previousState: AdminPasswordActionState,
  formData: FormData
): Promise<AdminPasswordActionState> {
  await requireSuperAdmin();
  const parsed = facultyAdminCreateSchema.safeParse({
    email: formData.get("email"),
    faculty_id: formData.get("faculty_id"),
  });

  if (!parsed.success) return fail("invalid");

  const temporaryPassword = generateTemporaryPassword();
  const resetId = generateTemporaryPasswordResetId();
  const result = await createFacultyAdministrator(
    createAdminClient(),
    parsed.data,
    temporaryPassword,
    resetId
  );

  if (result.status !== "success") return fail(result.status);
  return created(temporaryPassword, parsed.data.email);
}

export async function createSuperAdminAction(
  _previousState: AdminPasswordActionState,
  formData: FormData
): Promise<AdminPasswordActionState> {
  await requireSuperAdmin();
  const parsed = superAdminCreateSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) return fail("invalid");

  const temporaryPassword = generateTemporaryPassword();
  const resetId = generateTemporaryPasswordResetId();
  const result = await createSuperAdministrator(
    createAdminClient(),
    parsed.data,
    temporaryPassword,
    resetId
  );

  if (result.status !== "success") return fail(result.status);
  return created(temporaryPassword, parsed.data.email);
}

export async function issueTemporaryPasswordAction(
  _previousState: AdminPasswordActionState,
  formData: FormData
): Promise<AdminPasswordActionState> {
  const currentUserId = await requireSuperAdmin();
  const targetUserId = userIdSchema.safeParse(formData.get("user_id"));

  if (!targetUserId.success) return fail("invalid");
  if (targetUserId.data === currentUserId) return fail("self-reset");

  const temporaryPassword = generateTemporaryPassword();
  const resetId = generateTemporaryPasswordResetId();
  const result = await issueTemporaryPassword(
    createAdminClient(),
    targetUserId.data,
    temporaryPassword,
    resetId
  );

  if (result.status !== "success") return fail(result.status);
  return created(temporaryPassword, result.email);
}
