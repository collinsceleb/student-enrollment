"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { deleteAllStudentRecords } from "@/features/students/student-data-deletion.service";
import { enforceAdminActionLimit } from "@/lib/server/admin-action-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { studentDataDeletionConfirmationSchema } from "@/lib/validation/student-data-deletion.schema";

export async function deleteAllStudentDataAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getCurrentAdminProfile(supabase);
  if (profile.data?.role !== "SUPER_ADMIN") redirect("/unauthorized");
  if (!profile.data.has_changed_password) redirect("/change-password");
  if (!profile.data.session_is_current) redirect("/login");

  await enforceAdminActionLimit(user.id);

  const confirmation = studentDataDeletionConfirmationSchema.safeParse(
    formData.get("confirmation")
  );
  if (!confirmation.success) {
    redirect("/admin?studentDataError=confirmation");
  }

  try {
    await deleteAllStudentRecords(createAdminClient());
  } catch (error) {
    console.error("Student data deletion failed:", error);
    redirect("/admin?studentDataError=failed");
  }

  revalidatePath("/admin");
  redirect("/admin?studentDataStatus=deleted");
}
