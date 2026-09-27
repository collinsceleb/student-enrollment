import { redirect } from "next/navigation";

import {
  buildFacultyDashboardSummary,
  filterStudentsForFacultyDashboard,
} from "@/features/faculty/faculty.service";
import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { getDepartmentsByFaculty } from "@/features/department/department.service";
import { getStudentsByFacultyPage } from "@/features/students/student.service";
import { createClient } from "@/lib/supabase/server";
import { formatStudentFullName, type AdmissionType } from "@/types/student";

export default async function AdminDashboardPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{
    search?: string;
    department?: string;
    admissionType?: string;
    page?: string;
  }>;
}>) {
  const supabaseClient = await createClient();
  const { data: userSession } = await supabaseClient.auth.getUser();

  if (!userSession.user) {
    redirect("/login");
  }

  const profile = await getCurrentAdminProfile(supabaseClient);

  if (!profile.data?.role) {
    redirect("/login");
  }

  const resolvedSearchParams =
    searchParams !== undefined ? await searchParams : {};
  const activePage = Math.max(
    1,
    Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1
  );

  if (profile.data.role === "FACULTY_ADMIN") {
    const facultyId = profile.data.faculty_id;

    if (!facultyId) {
      redirect("/login");
    }

    const departments = await getDepartmentsByFaculty(
      supabaseClient,
      facultyId
    );

    const pageSize = 20;
    const studentPage = await getStudentsByFacultyPage(supabaseClient, {
      facultyId,
      departmentId: resolvedSearchParams.department,
      admissionType: resolvedSearchParams.admissionType as
        AdmissionType | undefined,
      searchQuery: resolvedSearchParams.search,
      page: activePage,
      pageSize,
    });

    const filteredStudents = filterStudentsForFacultyDashboard(
      studentPage.items,
      {
        search: resolvedSearchParams.search,
        departmentId: resolvedSearchParams.department,
        admissionType: resolvedSearchParams.admissionType as
          AdmissionType | undefined,
      }
    );

    const summary = buildFacultyDashboardSummary(filteredStudents);

    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium tracking-[0.18em] text-slate-500 uppercase">
                  Faculty Admin
                </p>
                <h1 className="text-3xl font-bold text-slate-900">
                  Student Overview
                </h1>
              </div>

              <form action="/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Total Students</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {summary.totalStudents}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Department distribution
            </h2>
            <div className="space-y-3">
              {summary.departmentBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No departments have enrolled students yet.
                </p>
              ) : (
                summary.departmentBreakdown.map((department) => (
                  <div key={department.departmentName}>
                    <div className="mb-1 flex justify-between text-sm text-slate-700">
                      <span>{department.departmentName}</span>
                      <span>{department.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{
                          width: `${Math.max((department.total / Math.max(summary.totalStudents, 1)) * 100, 8)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Student list
              </h2>
              <form
                className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]"
                method="GET"
              >
                <input
                  type="text"
                  name="search"
                  defaultValue={resolvedSearchParams.search ?? ""}
                  placeholder="Search by name or registration"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <input type="hidden" name="page" value="1" />

                <select
                  name="department"
                  defaultValue={resolvedSearchParams.department ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                <select
                  name="admissionType"
                  defaultValue={resolvedSearchParams.admissionType ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">All admission types</option>
                  <option value="JAMBITE">JAMBITE</option>
                  <option value="DIRECT_ENTRY">DIRECT_ENTRY</option>
                </select>
              </form>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700">
                      Student
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-700">
                      Department
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-700">
                      Admission Type
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-700">
                      Registration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No students match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-slate-800">
                          {formatStudentFullName(student)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {student.department.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {student.admission_type}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {student.registration_number}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Page {studentPage.page} of {studentPage.totalPages}
              </div>

              <div className="flex gap-2">
                {studentPage.page > 1 && (
                  <a
                    href={`?page=${studentPage.page - 1}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ""}${resolvedSearchParams.department ? `&department=${encodeURIComponent(resolvedSearchParams.department)}` : ""}${resolvedSearchParams.admissionType ? `&admissionType=${encodeURIComponent(resolvedSearchParams.admissionType)}` : ""}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    Previous
                  </a>
                )}

                {studentPage.page < studentPage.totalPages && (
                  <a
                    href={`?page=${studentPage.page + 1}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ""}${resolvedSearchParams.department ? `&department=${encodeURIComponent(resolvedSearchParams.department)}` : ""}${resolvedSearchParams.admissionType ? `&admissionType=${encodeURIComponent(resolvedSearchParams.admissionType)}` : ""}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (profile.data.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [
    facultiesResult,
    departmentsResult,
    facultyAdminsResult,
    studentsResult,
    superAdminsResult,
  ] = await Promise.all([
    supabaseClient
      .from("faculties")
      .select("id, name, code")
      .order("name", { ascending: true }),
    supabaseClient
      .from("departments")
      .select("id, name, code, faculty_id")
      .order("name", { ascending: true }),
    supabaseClient
      .from("admin_profiles")
      .select("id, user_id, faculty_id, role")
      .eq("role", "FACULTY_ADMIN")
      .order("faculty_id", { ascending: true }),
    supabaseClient
      .from("students")
      .select(
        "id, first_name, last_name, other_name, registration_number, faculty_id, department_id"
      )
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(10),
    supabaseClient
      .from("admin_profiles")
      .select("id, user_id, faculty_id, role")
      .eq("role", "SUPER_ADMIN")
      .order("user_id", { ascending: true }),
  ]);

  const faculties = facultiesResult.data ?? [];
  const departments = departmentsResult.data ?? [];
  const facultyAdmins = facultyAdminsResult.data ?? [];
  const students = studentsResult.data ?? [];
  const superAdmins = superAdminsResult.data ?? [];

  const facultyCount = faculties.length;
  const departmentCount = departments.length;
  const facultyAdminCount = facultyAdmins.length;
  const studentCount = students.length;
  const superAdminCount = superAdmins.length;

  const facultyBreakdown = faculties.map((faculty) => ({
    ...faculty,
    departmentCount: departments.filter(
      (department) => department.faculty_id === faculty.id
    ).length,
    adminCount: facultyAdmins.filter((admin) => admin.faculty_id === faculty.id)
      .length,
    studentCount: students.filter(
      (student) => student.faculty_id === faculty.id
    ).length,
  }));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-[0.18em] text-slate-500 uppercase">
                Super Admin Portal
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Overview Dashboard
              </h1>
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
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Faculties</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {facultyCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Departments</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {departmentCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Faculty Admins</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {facultyAdminCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Students</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {studentCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Super Admins</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {superAdminCount}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Faculties
            </h2>
            <div className="space-y-3">
              {faculties.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No faculties available.
                </p>
              ) : (
                facultyBreakdown.map((faculty) => (
                  <div
                    key={faculty.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {faculty.name}
                        </p>
                        <p className="text-sm text-slate-500">{faculty.code}</p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <div>{faculty.departmentCount} departments</div>
                        <div>{faculty.adminCount} admins</div>
                        <div>{faculty.studentCount} students</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Departments
            </h2>
            <div className="space-y-3">
              {departments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No departments available.
                </p>
              ) : (
                departments.map((department) => {
                  const facultyName =
                    faculties.find(
                      (faculty) => faculty.id === department.faculty_id
                    )?.name ?? "Unknown faculty";

                  return (
                    <div
                      key={department.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                    >
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
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Faculty Administrators
            </h2>
            <div className="space-y-3">
              {facultyAdmins.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No faculty administrators assigned.
                </p>
              ) : (
                facultyAdmins.map((admin) => {
                  const facultyName =
                    faculties.find((faculty) => faculty.id === admin.faculty_id)
                      ?.name ?? "Unassigned faculty";

                  return (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          Administrator #{admin.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-slate-500">
                          User ID: {admin.user_id.slice(0, 8)}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {facultyName}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Super Administrators
            </h2>
            <div className="space-y-3">
              {superAdmins.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No super administrators found.
                </p>
              ) : (
                superAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        Super Admin #{admin.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-slate-500">
                        User ID: {admin.user_id.slice(0, 8)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-medium text-white">
                      SUPER_ADMIN
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Students
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">
                    Student
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700">
                    Faculty
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700">
                    Department
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700">
                    Registration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const facultyName =
                      faculties.find(
                        (faculty) => faculty.id === student.faculty_id
                      )?.name ?? "Unknown faculty";
                    const departmentName =
                      departments.find(
                        (department) => department.id === student.department_id
                      )?.name ?? "Unknown department";

                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-slate-800">
                          {student.last_name.toUpperCase()},{" "}
                          {student.first_name} {student.other_name ?? ""}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {facultyName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {departmentName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {student.registration_number}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Exports</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Export faculties CSV
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Export students CSV
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Export department summary
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
