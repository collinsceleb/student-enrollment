import {
  createDepartmentAction,
  updateDepartmentAction,
} from "@/features/department/department.actions";
import { DepartmentDeleteForm } from "@/features/department/department-delete-form";

type DepartmentRow = {
  id: string;
  faculty_id: string;
  name: string;
  code: string;
};

type FacultyOption = {
  id: string;
  name: string;
  code: string;
};

const statusMessages: Record<string, string> = {
  created: "Department created.",
  updated: "Department updated.",
  deleted: "Department deleted.",
};

const errorMessages: Record<string, string> = {
  invalid: "Enter valid department details and select a faculty.",
  duplicate: "That department name or code already exists in this faculty.",
  "invalid-faculty": "Select an existing faculty.",
  "not-found": "That department could not be found.",
  "has-students":
    "This department cannot be deleted while students are enrolled in it.",
  failed: "The department change could not be completed. Please try again.",
};

export function DepartmentManagementPanel({
  departments,
  faculties,
  status,
  error,
}: Readonly<{
  departments: DepartmentRow[];
  faculties: FacultyOption[];
  status?: string;
  error?: string;
}>) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Departments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Assign every department to a faculty. Departments with enrolled
          students cannot be deleted.
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

      {faculties.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Create a faculty before adding departments.
        </p>
      ) : (
        <form
          action={createDepartmentAction}
          className="mb-5 grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2"
        >
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
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Department name
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
              Department code
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
            className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add department
          </button>
        </form>
      )}

      <div className="space-y-3">
        {departments.length === 0 ? (
          <p className="text-sm text-slate-500">No departments available.</p>
        ) : (
          departments.map((department) => {
            const facultyName =
              faculties.find((faculty) => faculty.id === department.faculty_id)
                ?.name ?? "Unknown faculty";

            return (
              <div
                key={department.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {department.name}
                    </p>
                    <p className="text-sm text-slate-500">{facultyName}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {department.code}
                  </span>
                </div>
                <form
                  action={updateDepartmentAction}
                  className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2"
                >
                  <input type="hidden" name="id" value={department.id} />
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Faculty
                    </span>
                    <select
                      name="faculty_id"
                      required
                      defaultValue={department.faculty_id}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      {faculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name} ({faculty.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Name
                    </span>
                    <input
                      name="name"
                      defaultValue={department.name}
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
                      defaultValue={department.code}
                      required
                      minLength={2}
                      maxLength={20}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <button
                    type="submit"
                    className="self-end rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Save changes
                  </button>
                </form>
                <div className="mt-3 flex justify-end">
                  <DepartmentDeleteForm departmentId={department.id} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
