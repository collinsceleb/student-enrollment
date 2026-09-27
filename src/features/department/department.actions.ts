"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import {
  createDepartment,
  deleteDepartmentSafely,
  updateDepartment,
} from "@/features/department/department-management.service";
import { departmentSchema } from "@/lib/validation/department.schema";
import { createClient } from "@/lib/supabase/server";

const departmentIdSchema = z.uuid();

async function requireSuperAdmin() {
  const supabase = await createClient();
  const profile = await getCurrentAdminProfile(supabase);

  if (profile.data?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return supabase;
}

function getDepartmentInput(formData: FormData) {
  return departmentSchema.safeParse({
    faculty_id: formData.get("faculty_id"),
    name: formData.get("name"),
    code: formData.get("code"),
  });
}

function finishDepartmentAction(status: string) {
  revalidatePath("/admin");
  redirect(`/admin?departmentStatus=${status}`);
}

function reportDepartmentError(status: string): never {
  redirect(`/admin?departmentError=${status}`);
}

export async function createDepartmentAction(formData: FormData) {
  const supabase = await requireSuperAdmin();
  const parsed = getDepartmentInput(formData);

  if (!parsed.success) reportDepartmentError("invalid");

  const result = await createDepartment(supabase, parsed.data);
  if (result.status !== "success") reportDepartmentError(result.status);

  finishDepartmentAction("created");
}

export async function updateDepartmentAction(formData: FormData) {
  const supabase = await requireSuperAdmin();
  const parsed = getDepartmentInput(formData);
  const id = departmentIdSchema.safeParse(formData.get("id"));

  if (!parsed.success || !id.success) reportDepartmentError("invalid");

  const result = await updateDepartment(supabase, id.data, parsed.data);
  if (result.status !== "success") reportDepartmentError(result.status);

  finishDepartmentAction("updated");
}

export async function deleteDepartmentAction(formData: FormData) {
  const supabase = await requireSuperAdmin();
  const id = departmentIdSchema.safeParse(formData.get("id"));

  if (!id.success) reportDepartmentError("invalid");

  const result = await deleteDepartmentSafely(supabase, id.data);
  if (result.status !== "success") reportDepartmentError(result.status);

  finishDepartmentAction("deleted");
}
