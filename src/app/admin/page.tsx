import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabaseClient = await createClient();
  const { data: userSession } = await supabaseClient.auth.getUser();

  if (!userSession.user) {
    redirect("/login");
  }

  const profile = await getCurrentAdminProfile(supabaseClient);

  if (!profile.data || !profile.data.role) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-slate-500 uppercase">
              Admin Portal
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>

          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Role: {profile.data.role}</p>
          <p className="text-sm text-slate-600">
            Faculty scope: {profile.data.faculty_id ?? "All faculties"}
          </p>
        </div>
      </div>
    </main>
  );
}
