import {
  createFacultyAction,
  updateFacultyAction,
} from "@/features/faculty/faculty.actions";
import { FacultyDeleteForm } from "@/features/faculty/faculty-delete-form";

type FacultyOverview = {
  id: string;
  name: string;
  code: string;
  departmentCount: number;
  adminCount: number;
  studentCount: number;
};

const statusMessages: Record<string, string> = {
  created: "Faculty created.",
  updated: "Faculty updated.",
  deleted: "Faculty deleted.",
};

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid faculty name and code.",
  duplicate: "A faculty with that name or code already exists.",
  "not-found": "That faculty could not be found.",
  "has-dependencies":
    "This faculty cannot be deleted while it has departments, students, or faculty administrators.",
  failed: "The faculty change could not be completed. Please try again.",
};

export function FacultyManagementPanel({
  faculties,
  status,
  error,
}: Readonly<{
  faculties: FacultyOverview[];
  status?: string;
  error?: string;
}>) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Faculties</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create and maintain faculties. Deletion is blocked while departments,
          students, or faculty administrators are assigned.
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
        action={createFacultyAction}
        className="mb-5 grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Faculty name
          </span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={150}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Faculty code
          </span>
          <input
            name="code"
            required
            minLength={2}
            maxLength={20}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add faculty
        </button>
      </form>

      <div className="space-y-3">
        {faculties.length === 0 ? (
          <p className="text-sm text-slate-500">No faculties available.</p>
        ) : (
          faculties.map((faculty) => (
            <div
              key={faculty.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{faculty.name}</p>
                  <p className="text-sm text-slate-500">{faculty.code}</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <div>{faculty.departmentCount} departments</div>
                  <div>{faculty.adminCount} admins</div>
                  <div>{faculty.studentCount} students</div>
                </div>
              </div>
              <form
                action={updateFacultyAction}
                className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
              >
                <input type="hidden" name="id" value={faculty.id} />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Name
                  </span>
                  <input
                    name="name"
                    defaultValue={faculty.name}
                    required
                    minLength={2}
                    maxLength={150}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Code
                  </span>
                  <input
                    name="code"
                    defaultValue={faculty.code}
                    required
                    minLength={2}
                    maxLength={20}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                <FacultyDeleteForm facultyId={faculty.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
