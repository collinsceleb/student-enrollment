import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  FileDown,
  FolderTree,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  buildFacultyDashboardSummary,
  filterStudentsForFacultyDashboard,
} from "@/features/faculty/faculty.service";
import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { FacultyAdminManagementPanel } from "@/features/administration/faculty-admin-management-panel";
import { AdminRateLimitNotice } from "@/features/administration/admin-rate-limit-notice";
import { getFacultyAdministrators } from "@/features/administration/faculty-admin-management.service";
import { SuperAdminManagementPanel } from "@/features/administration/super-admin-management-panel";
import { getSuperAdministrators } from "@/features/administration/super-admin-management.service";
import { DepartmentManagementPanel } from "@/features/department/department-management-panel";
import { getDepartmentsByFaculty } from "@/features/department/department.service";
import { FacultyManagementPanel } from "@/features/faculty/faculty-management-panel";
import { StudentExportForm } from "@/features/exports/student-export-form";
import { StudentDataDeletionPanel } from "@/features/students/student-data-deletion-panel";
import { getStudentsByFacultyPage } from "@/features/students/student.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatStudentFullName, type AdmissionType } from "@/types/student";

export default async function AdminDashboardPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{
    tab?: string;
    search?: string;
    department?: string;
    admissionType?: string;
    page?: string;
    facultyStatus?: string;
    facultyError?: string;
    departmentStatus?: string;
    departmentError?: string;
    facultyAdminStatus?: string;
    facultyAdminError?: string;
    superAdminStatus?: string;
    superAdminError?: string;
    adminError?: string;
    studentDataStatus?: string;
    studentDataError?: string;
  }>;
}>) {
  const supabaseClient = await createClient();
  const { data: userSession } = await supabaseClient.auth.getUser();

  if (!userSession.user) {
    redirect("/login");
  }

  const profile = await getCurrentAdminProfile(supabaseClient);

  if (!profile.data?.role) {
    redirect("/unauthorized");
  }
  if (!profile.data.has_changed_password) {
    redirect("/change-password");
  }
  if (!profile.data.session_is_current) {
    redirect("/login");
  }

  const resolvedSearchParams =
    searchParams !== undefined ? await searchParams : {};
  const activePage = Math.max(
    1,
    Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1
  );

  const userEmail = userSession.user.email ?? "admin@institution.edu";

  // ==========================================
  // FACULTY ADMIN WORKSPACE
  // ==========================================
  if (profile.data.role === "FACULTY_ADMIN") {
    const facultyId = profile.data.faculty_id;

    if (!facultyId) {
      redirect("/unauthorized");
    }

    const [facultyResult, departments] = await Promise.all([
      supabaseClient
        .from("faculties")
        .select("name")
        .eq("id", facultyId)
        .maybeSingle(),
      getDepartmentsByFaculty(supabaseClient, facultyId),
    ]);

    const facultyName = facultyResult.data?.name ?? "Faculty";

    // Auto-detect active tab for Faculty Admin
    const requestedTab = resolvedSearchParams.tab;
    let activeTab = requestedTab ?? "overview";
    if (!requestedTab) {
      if (
        resolvedSearchParams.search ||
        resolvedSearchParams.department ||
        resolvedSearchParams.admissionType ||
        resolvedSearchParams.page
      ) {
        activeTab = "students";
      }
    }

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
      <DashboardShell
        role="FACULTY_ADMIN"
        activeTab={activeTab}
        userEmail={userEmail}
        facultyName={facultyName}
      >
        <div className="space-y-6">
          <AdminRateLimitNotice error={resolvedSearchParams.adminError} />

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                      Faculty Overview
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {facultyName}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/admin?tab=students"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <GraduationCap className="size-4" />
                      View Students
                    </Link>
                    <Link
                      href="/admin?tab=exports"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileDown className="size-4" />
                      Export Data
                    </Link>
                  </div>
                </div>
              </div>

              {/* Metric Card */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      Enrolled Students
                    </p>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <GraduationCap className="size-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {summary.totalStudents}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      Active Departments
                    </p>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <FolderTree className="size-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {departments.length}
                  </p>
                </div>
              </div>

              {/* Department Distribution Chart */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Department Distribution
                  </h2>
                  <span className="text-xs text-slate-500">
                    {summary.departmentBreakdown.length} departments recorded
                  </span>
                </div>
                <div className="space-y-3">
                  {summary.departmentBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No departments have enrolled students yet.
                    </p>
                  ) : (
                    summary.departmentBreakdown.map((department) => (
                      <div key={department.departmentName}>
                        <div className="mb-1 flex justify-between text-sm text-slate-700">
                          <span className="font-medium">
                            {department.departmentName}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {department.total}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              (
                              {Math.round(
                                (department.total /
                                  Math.max(summary.totalStudents, 1)) *
                                  100
                              )}
                              %)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-[#10241e]"
                            style={{
                              width: `${Math.max(
                                (department.total /
                                  Math.max(summary.totalStudents, 1)) *
                                  100,
                                5
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Student Directory
                    </h2>
                    <p className="text-sm text-slate-500">
                      Browse, filter, and manage students enrolled in{" "}
                      {facultyName}.
                    </p>
                  </div>

                  <form
                    className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr]"
                    method="GET"
                  >
                    <input type="hidden" name="tab" value="students" />

                    <input
                      type="text"
                      name="search"
                      defaultValue={resolvedSearchParams.search ?? ""}
                      placeholder="Search name or reg number"
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

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Student Name
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Department
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Admission Type
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Registration No.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No students match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {formatStudentFullName(student)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.department.name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                                  student.admission_type === "JAMBITE"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                                }`}
                              >
                                {student.admission_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">
                              {student.registration_number}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between gap-3 pt-2">
                  <div className="text-sm text-slate-600">
                    Page <span className="font-medium">{studentPage.page}</span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {studentPage.totalPages}
                    </span>{" "}
                    ({studentPage.totalCount} total)
                  </div>

                  <div className="flex gap-2">
                    {studentPage.page > 1 && (
                      <Link
                        href={`?tab=students&page=${studentPage.page - 1}${
                          resolvedSearchParams.search
                            ? `&search=${encodeURIComponent(resolvedSearchParams.search)}`
                            : ""
                        }${
                          resolvedSearchParams.department
                            ? `&department=${encodeURIComponent(resolvedSearchParams.department)}`
                            : ""
                        }${
                          resolvedSearchParams.admissionType
                            ? `&admissionType=${encodeURIComponent(resolvedSearchParams.admissionType)}`
                            : ""
                        }`}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Previous
                      </Link>
                    )}

                    {studentPage.page < studentPage.totalPages && (
                      <Link
                        href={`?tab=students&page=${studentPage.page + 1}${
                          resolvedSearchParams.search
                            ? `&search=${encodeURIComponent(resolvedSearchParams.search)}`
                            : ""
                        }${
                          resolvedSearchParams.department
                            ? `&department=${encodeURIComponent(resolvedSearchParams.department)}`
                            : ""
                        }${
                          resolvedSearchParams.admissionType
                            ? `&admissionType=${encodeURIComponent(resolvedSearchParams.admissionType)}`
                            : ""
                        }`}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORTS */}
          {activeTab === "exports" && (
            <div className="space-y-6">
              <StudentExportForm
                mode="faculty-admin"
                faculties={[]}
                departments={departments}
              />
            </div>
          )}
        </div>
      </DashboardShell>
    );
  }

  // ==========================================
  // SUPER ADMIN WORKSPACE
  // ==========================================
  if (profile.data.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  const adminClient = createAdminClient();
  const [
    facultiesResult,
    departmentsResult,
    facultyAdmins,
    studentsResult,
    superAdmins,
  ] = await Promise.all([
    supabaseClient
      .from("faculties")
      .select("id, name, code")
      .order("name", { ascending: true }),
    supabaseClient
      .from("departments")
      .select("id, name, code, faculty_id")
      .order("name", { ascending: true }),
    getFacultyAdministrators(adminClient),
    supabaseClient
      .from("students")
      .select(
        "id, first_name, last_name, other_name, registration_number, faculty_id, department_id"
      )
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(50),
    getSuperAdministrators(adminClient),
  ]);

  const faculties = facultiesResult.data ?? [];
  const departments = departmentsResult.data ?? [];
  const students = studentsResult.data ?? [];

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

  // Auto-detect active tab based on server actions feedback
  const requestedTab = resolvedSearchParams.tab;
  let activeTab = requestedTab ?? "overview";
  if (!requestedTab) {
    if (
      resolvedSearchParams.facultyStatus ||
      resolvedSearchParams.facultyError
    ) {
      activeTab = "faculties";
    } else if (
      resolvedSearchParams.departmentStatus ||
      resolvedSearchParams.departmentError
    ) {
      activeTab = "departments";
    } else if (
      resolvedSearchParams.facultyAdminStatus ||
      resolvedSearchParams.facultyAdminError ||
      resolvedSearchParams.superAdminStatus ||
      resolvedSearchParams.superAdminError
    ) {
      activeTab = "admins";
    } else if (
      resolvedSearchParams.studentDataStatus ||
      resolvedSearchParams.studentDataError
    ) {
      activeTab = "settings";
    }
  }

  return (
    <DashboardShell
      role="SUPER_ADMIN"
      activeTab={activeTab}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <AdminRateLimitNotice error={resolvedSearchParams.adminError} />

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                    Institution Registry
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Super Admin Overview
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin?tab=students"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <GraduationCap className="size-4" />
                    Students
                  </Link>
                  <Link
                    href="/admin?tab=exports"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileDown className="size-4" />
                    Exports
                  </Link>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Link
                href="/admin?tab=faculties"
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-sm font-medium">Faculties</span>
                  <Building2 className="size-4.5 text-slate-400 transition group-hover:text-slate-600" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {facultyCount}
                </p>
              </Link>

              <Link
                href="/admin?tab=departments"
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-sm font-medium">Departments</span>
                  <FolderTree className="size-4.5 text-slate-400 transition group-hover:text-slate-600" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {departmentCount}
                </p>
              </Link>

              <Link
                href="/admin?tab=admins"
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-sm font-medium">Faculty Admins</span>
                  <Users className="size-4.5 text-slate-400 transition group-hover:text-slate-600" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {facultyAdminCount}
                </p>
              </Link>

              <Link
                href="/admin?tab=students"
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-sm font-medium">Students</span>
                  <GraduationCap className="size-4.5 text-slate-400 transition group-hover:text-slate-600" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {studentCount}
                </p>
              </Link>

              <Link
                href="/admin?tab=admins"
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-sm font-medium">Super Admins</span>
                  <ShieldCheck className="size-4.5 text-slate-400 transition group-hover:text-slate-600" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {superAdminCount}
                </p>
              </Link>
            </section>

            {/* Faculties Snapshot Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Faculty Directory Snapshot
                  </h2>
                  <p className="text-xs text-slate-500">
                    Quick distribution of departments and students across
                    faculties.
                  </p>
                </div>
                <Link
                  href="/admin?tab=faculties"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Manage Faculties
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Faculty
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Code
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Departments
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Faculty Admins
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Students
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {facultyBreakdown.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No faculties configured yet.
                        </td>
                      </tr>
                    ) : (
                      facultyBreakdown.map((faculty) => (
                        <tr key={faculty.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {faculty.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {faculty.code}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {faculty.departmentCount}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {faculty.adminCount}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {faculty.studentCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Enrolled Students
                  </h2>
                  <p className="text-sm text-slate-500">
                    Recent student enrollment records across all faculties.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#10241e] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                >
                  <span>+ Enroll Student</span>
                </Link>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Student
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Faculty
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Department
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Registration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-slate-500"
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
                            (department) =>
                              department.id === student.department_id
                          )?.name ?? "Unknown department";

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {student.last_name.toUpperCase()},{" "}
                              {student.first_name} {student.other_name ?? ""}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {facultyName}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {departmentName}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">
                              {student.registration_number}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FACULTIES */}
        {activeTab === "faculties" && (
          <FacultyManagementPanel
            faculties={facultyBreakdown}
            status={resolvedSearchParams.facultyStatus}
            error={resolvedSearchParams.facultyError}
          />
        )}

        {/* TAB 4: DEPARTMENTS */}
        {activeTab === "departments" && (
          <DepartmentManagementPanel
            departments={departments}
            faculties={faculties}
            status={resolvedSearchParams.departmentStatus}
            error={resolvedSearchParams.departmentError}
          />
        )}

        {/* TAB 5: ADMINISTRATORS */}
        {activeTab === "admins" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <FacultyAdminManagementPanel
              administrators={facultyAdmins}
              faculties={faculties}
              status={resolvedSearchParams.facultyAdminStatus}
              error={resolvedSearchParams.facultyAdminError}
            />

            <SuperAdminManagementPanel
              administrators={superAdmins}
              currentUserId={userSession.user.id}
              status={resolvedSearchParams.superAdminStatus}
              error={resolvedSearchParams.superAdminError}
            />
          </div>
        )}

        {/* TAB 6: EXPORTS */}
        {activeTab === "exports" && (
          <StudentExportForm
            mode="super-admin"
            faculties={faculties}
            departments={departments}
          />
        )}

        {/* TAB 7: DATA SETTINGS / DANGER ZONE */}
        {activeTab === "settings" && (
          <StudentDataDeletionPanel
            status={resolvedSearchParams.studentDataStatus}
            error={resolvedSearchParams.studentDataError}
          />
        )}
      </div>
    </DashboardShell>
  );
}
