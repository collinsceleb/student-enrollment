import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { createClient } from "@/lib/supabase/server";

export default async function FacultyDashboardPage() {
  const supabaseClient = await createClient();
  const { data: userSession } = await supabaseClient.auth.getUser();

  if (!userSession.user) {
    redirect("/login");
  }

  const profile = await getCurrentAdminProfile(supabaseClient);

  if (!profile.data?.role) {
    redirect("/login");
  }

  redirect("/admin");
}
