"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  createFaculty,
  deleteFacultySafely,
  updateFaculty,
} from "@/features/faculty/faculty-management.service";
import { facultySchema } from "@/lib/validation/faculty.schema";
import { createClient } from "@/lib/supabase/server";
import { enforceAdminActionLimit } from "@/lib/server/admin-action-limit";

const facultyIdSchema = z.uuid();

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
  return supabaseClient;
}

function getFacultyInput(formData: FormData) {
  return facultySchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
  });
}

function finishFacultyAction(status: string) {
  revalidatePath("/admin");
  redirect(`/admin?facultyStatus=${status}`);
}

function reportFacultyError(status: string): never {
  redirect(`/admin?facultyError=${status}`);
}

export async function createFacultyAction(formData: FormData) {
  const supabase = await requireSuperAdmin();
  const parsed = getFacultyInput(formData);

  if (!parsed.success) reportFacultyError("invalid");

  const result = await createFaculty(supabase, parsed.data);
  if (result.status !== "success") reportFacultyError(result.status);

  finishFacultyAction("created");
}

export async function updateFacultyAction(formData: FormData) {
  const supabaseClient = await requireSuperAdmin();
  const parsed = getFacultyInput(formData);
  const id = facultyIdSchema.safeParse(formData.get("id"));

  if (!parsed.success || !id.success) reportFacultyError("invalid");

  const result = await updateFaculty(supabaseClient, id.data, parsed.data);
  if (result.status !== "success") reportFacultyError(result.status);

  finishFacultyAction("updated");
}

export async function deleteFacultyAction(formData: FormData) {
  const supabaseClient = await requireSuperAdmin();
  const id = facultyIdSchema.safeParse(formData.get("id"));

  if (!id.success) reportFacultyError("invalid");

  const result = await deleteFacultySafely(supabaseClient, id.data);
  if (result.status !== "success") reportFacultyError(result.status);

  finishFacultyAction("deleted");
}
