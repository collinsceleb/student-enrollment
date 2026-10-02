"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  removeFacultyAdministrator,
  updateFacultyAdministratorAssignment,
} from "@/features/administration/faculty-admin-management.service";
import { facultyAdminAssignmentSchema } from "@/lib/validation/faculty-admin.schema";
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
  return createAdminClient();
}

function reportFacultyAdminError(status: string): never {
  redirect(`/admin?facultyAdminError=${status}`);
}

export async function updateFacultyAdminAssignmentAction(formData: FormData) {
  const adminClient = await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));
  const assignment = facultyAdminAssignmentSchema.safeParse({
    faculty_id: formData.get("faculty_id"),
  });

  if (!userId.success || !assignment.success) {
    reportFacultyAdminError("invalid");
  }

  const result = await updateFacultyAdministratorAssignment(
    adminClient,
    userId.data,
    assignment.data
  );
  if (result.status !== "success") reportFacultyAdminError(result.status);

  revalidatePath("/admin");
  redirect("/admin?facultyAdminStatus=updated");
}

export async function removeFacultyAdminAction(formData: FormData) {
  const adminClient = await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));

  if (!userId.success) reportFacultyAdminError("invalid");

  const result = await removeFacultyAdministrator(adminClient, userId.data);
  if (result.status !== "success") reportFacultyAdminError(result.status);

  revalidatePath("/admin");
  redirect("/admin?facultyAdminStatus=removed");
}
