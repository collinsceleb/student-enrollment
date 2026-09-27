import {
  createSuperAdminAction,
  updateSuperAdminAction,
} from "@/features/administration/super-admin.actions";
import { SuperAdminDeleteForm } from "@/features/administration/super-admin-delete-form";
import type { SuperAdministrator } from "@/features/administration/super-admin-management.service";

const statusMessages: Record<string, string> = {
  created: "Super administrator created.",
  updated: "Super administrator updated.",
  removed: "Super administrator removed and access revoked.",
};

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid email and password.",
  "duplicate-email": "An account with that email already exists.",
  "last-super-admin": "The final super administrator cannot be removed.",
  "self-removal": "You cannot remove your own account.",
  "not-found": "That super administrator could not be found.",
  failed:
    "The super administrator change could not be completed. Please try again.",
};

export function SuperAdminManagementPanel({
  administrators,
  currentUserId,
  status,
  error,
}: Readonly<{
  administrators: SuperAdministrator[];
  currentUserId: string;
  status?: string;
  error?: string;
}>) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Super Administrators
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Keep at least one super administrator account active.
        </p>
      </div>

      {status && statusMessages[status] && (
        <p
          role="status"
          className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          {statusMessages[status]}
        </p>
      )}
      {error && errorMessages[error] && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {errorMessages[error]}
        </p>
      )}

      <form
        action={createSuperAdminAction}
        className="mb-5 grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create super admin
        </button>
      </form>

      <div className="space-y-3">
        {administrators.length === 0 ? (
          <p className="text-sm text-slate-500">
            No super administrators found.
          </p>
        ) : (
          administrators.map((administrator) => {
            const isCurrentUser = administrator.user_id === currentUserId;
            const isLastAdministrator = administrators.length === 1;
            const disabledReason = isCurrentUser
              ? "Current account"
              : isLastAdministrator
                ? "Final super admin"
                : undefined;

            return (
              <div
                key={administrator.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="mb-1 font-medium text-slate-900">
                  {administrator.email ?? "Email unavailable"}
                </p>
                <p className="mb-3 text-xs text-slate-500">
                  Account ID: {administrator.user_id.slice(0, 8)}
                </p>
                <form
                  action={updateSuperAdminAction}
                  className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
                >
                  <input
                    type="hidden"
                    name="user_id"
                    value={administrator.user_id}
                  />
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Email
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      defaultValue={administrator.email ?? ""}
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      New password (optional)
                    </span>
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      maxLength={128}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Save changes
                  </button>
                </form>
                <div className="mt-3 flex justify-end">
                  <SuperAdminDeleteForm
                    userId={administrator.user_id}
                    disabledReason={disabledReason}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
