"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  createFacultyAdministrator,
  removeFacultyAdministrator,
  updateFacultyAdministratorAssignment,
} from "@/features/administration/faculty-admin-management.service";
import {
  facultyAdminAssignmentSchema,
  facultyAdminCreateSchema,
} from "@/lib/validation/faculty-admin.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.uuid();

async function requireSuperAdmin() {
  const supabase = await createClient();
  const profile = await getCurrentAdminProfile(supabase);

  if (profile.data?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
}

function finishFacultyAdminAction(status: string) {
  revalidatePath("/admin");
  redirect(`/admin?facultyAdminStatus=${status}`);
}

function reportFacultyAdminError(status: string): never {
  redirect(`/admin?facultyAdminError=${status}`);
}

export async function createFacultyAdminAction(formData: FormData) {
  await requireSuperAdmin();
  const parsed = facultyAdminCreateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    faculty_id: formData.get("faculty_id"),
  });

  if (!parsed.success) reportFacultyAdminError("invalid");

  const result = await createFacultyAdministrator(
    createAdminClient(),
    parsed.data
  );
  if (result.status !== "success") reportFacultyAdminError(result.status);

  finishFacultyAdminAction("created");
}

export async function updateFacultyAdminAssignmentAction(formData: FormData) {
  await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));
  const assignment = facultyAdminAssignmentSchema.safeParse({
    faculty_id: formData.get("faculty_id"),
  });

  if (!userId.success || !assignment.success) {
    reportFacultyAdminError("invalid");
  }

  const result = await updateFacultyAdministratorAssignment(
    createAdminClient(),
    userId.data,
    assignment.data
  );
  if (result.status !== "success") reportFacultyAdminError(result.status);

  finishFacultyAdminAction("updated");
}

export async function removeFacultyAdminAction(formData: FormData) {
  await requireSuperAdmin();
  const userId = userIdSchema.safeParse(formData.get("user_id"));

  if (!userId.success) reportFacultyAdminError("invalid");

  const result = await removeFacultyAdministrator(
    createAdminClient(),
    userId.data
  );
  if (result.status !== "success") reportFacultyAdminError(result.status);

  finishFacultyAdminAction("removed");
}
