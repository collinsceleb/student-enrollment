import { updateFacultyAdminAssignmentAction } from "@/features/administration/faculty-admin.actions";
import {
  createFacultyAdminAction,
  issueTemporaryPasswordAction,
} from "@/features/administration/temporary-password.actions";
import { TemporaryPasswordForm } from "@/features/administration/temporary-password-form";
import { FacultyAdminDeleteForm } from "@/features/administration/faculty-admin-delete-form";
import type { FacultyAdministrator } from "@/features/administration/faculty-admin-management.service";

type FacultyOption = {
  id: string;
  name: string;
  code: string;
};

const statusMessages: Record<string, string> = {
  created: "Faculty administrator created.",
  updated: "Faculty assignment updated.",
  removed: "Faculty administrator removed and access revoked.",
};

const errorMessages: Record<string, string> = {
  "not-found": "That faculty administrator could not be found.",
  failed: "The administrator change could not be completed. Please try again.",
};

export function FacultyAdminManagementPanel({
  administrators,
  faculties,
  status,
  error,
}: Readonly<{
  administrators: FacultyAdministrator[];
  faculties: FacultyOption[];
  status?: string;
  error?: string;
}>) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Faculty Administrators
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Each administrator can access data for their assigned faculty.
        </p>
      </div>

      {status && statusMessages[status] && (
        <output className="mb-4 block rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {statusMessages[status]}
        </output>
      )}
      {error && errorMessages[error] && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {errorMessages[error]}
        </p>
      )}

      {faculties.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Create a faculty before adding faculty administrators.
        </p>
      ) : (
        <TemporaryPasswordForm
          action={createFacultyAdminAction}
          submitLabel="Create administrator"
          className="mb-5 rounded-lg border border-slate-200 p-4"
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
            <span className="text-sm font-medium text-slate-700">Faculty</span>
            <select
              name="faculty_id"
              required
              defaultValue=""
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="" disabled>
                Select faculty
              </option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name} ({faculty.code})
                </option>
              ))}
            </select>
          </label>
        </TemporaryPasswordForm>
      )}

      <div className="space-y-3">
        {administrators.length === 0 ? (
          <p className="text-sm text-slate-500">
            No faculty administrators assigned.
          </p>
        ) : (
          administrators.map((administrator) => (
            <div
              key={administrator.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-3">
                <p className="font-medium text-slate-900">
                  {administrator.email ?? "Email unavailable"}
                </p>
                <p className="text-xs text-slate-500">
                  Account ID: {administrator.user_id.slice(0, 8)}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {administrator.has_changed_password
                    ? "Password changed"
                    : "Temporary password pending"}
                </p>
              </div>
              <form
                action={updateFacultyAdminAssignmentAction}
                className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
              >
                <input
                  type="hidden"
                  name="user_id"
                  value={administrator.user_id}
                />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Assigned faculty
                  </span>
                  <select
                    name="faculty_id"
                    required
                    defaultValue={administrator.faculty_id ?? ""}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="" disabled>
                      Select faculty
                    </option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name} ({faculty.code})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Update assignment
                </button>
              </form>
              <div className="mt-3 flex items-end justify-between gap-3">
                <TemporaryPasswordForm
                  action={issueTemporaryPasswordAction}
                  submitLabel="Issue temporary password"
                  className="flex-1"
                >
                  <input
                    type="hidden"
                    name="user_id"
                    value={administrator.user_id}
                  />
                </TemporaryPasswordForm>
                <FacultyAdminDeleteForm userId={administrator.user_id} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
