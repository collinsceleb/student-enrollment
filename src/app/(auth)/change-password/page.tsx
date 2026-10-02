import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { createClient } from "@/lib/supabase/server";
import { changeOwnPasswordAction } from "@/features/auth/password-change.actions";

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid current password and matching new passwords.",
  "incorrect-current": "The current or temporary password is incorrect.",
  "too-many-attempts":
    "Too many password checks. Please wait before trying again.",
  "rate-limit-unavailable":
    "Password changes are temporarily unavailable. Please try again.",
  "password-update": "The new password could not be saved. Please try again.",
  "profile-update":
    "The password changed, but account setup could not be completed. Sign in with the new password and try again.",
};

export default async function ChangePasswordPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ error?: string }>;
}>) {
  const supabase = await createClient();
  const { data: userSession } = await supabase.auth.getUser();
  if (!userSession.user) redirect("/login");

  const profile = await getCurrentAdminProfile(supabase);
  if (!profile.data?.role) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-500">
          {profile.data.role === "SUPER_ADMIN"
            ? "Super Admin"
            : "Faculty Admin"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {profile.data.has_changed_password
            ? "Change password"
            : "Set your password"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your current password or temporary password, then choose a new
          password.
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {errorMessage}
          </p>
        )}

        <form action={changeOwnPasswordAction} className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Current or temporary password
            </span>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              New password
            </span>
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Confirm new password
            </span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save password
          </button>
        </form>

        <form action="/auth/logout" method="POST" className="mt-3 text-center">
          <button
            type="submit"
            className="text-sm font-medium text-slate-600 underline underline-offset-4"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
