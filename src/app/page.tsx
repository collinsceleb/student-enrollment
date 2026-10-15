import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, GraduationCap } from "lucide-react";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { getDepartmentsByFaculty } from "@/features/department/department.service";
import {
  getPublicDepartmentOptions,
  getPublicFacultyOptions,
} from "@/features/enrollment/enrollment.service";
import { StudentEnrollmentForm } from "@/features/enrollment/student-enrollment-form";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
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

  let faculties;
  let departments;
  let lockFaculty = false;
  let defaultFacultyId: string | undefined = undefined;

  if (profile.data.role === "FACULTY_ADMIN") {
    const facultyId = profile.data.faculty_id;
    if (!facultyId) {
      redirect("/unauthorized");
    }

    const [facultyResult, departmentList] = await Promise.all([
      supabaseClient
        .from("faculties")
        .select("*")
        .eq("id", facultyId)
        .maybeSingle(),
      getDepartmentsByFaculty(supabaseClient, facultyId),
    ]);

    faculties = facultyResult.data ? [facultyResult.data] : [];
    departments = departmentList;
    lockFaculty = true;
    defaultFacultyId = facultyId;
  } else {
    [faculties, departments] = await Promise.all([
      getPublicFacultyOptions(),
      getPublicDepartmentOptions(),
    ]);
  }

  return (
    <main className="enrollment-page">
      <div className="enrollment-layout">
        <header className="enrollment-intro">
          <div className="space-y-10">
            <div className="flex items-center justify-between gap-4">
              <div className="enrollment-seal" aria-hidden="true">
                <GraduationCap className="size-6" />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
                >
                  Dashboard
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
                <form action="/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#d9ee88] uppercase">
                Office of the Registrar
              </p>
              <h1 className="display-heading max-w-[10ch] text-5xl leading-[0.98] text-white sm:text-6xl">
                Student Enrollment
              </h1>
              <p className="text-sm font-medium text-white/65">
                Admission Form <span aria-hidden="true">/</span> 2026
              </p>
              {profile.data.role === "FACULTY_ADMIN" && faculties[0] && (
                <div className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  Assigned Faculty:{" "}
                  <span className="font-semibold text-white">
                    {faculties[0].name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-white/15 pt-4 text-xs font-medium text-white/55">
            <span>ENROLLMENT RECORD</span>
            <span>01 / 01</span>
          </div>
        </header>

        <section className="enrollment-form-shell" aria-labelledby="form-title">
          <div className="mb-7 space-y-2">
            <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
              Student intake
            </p>
            <h2
              id="form-title"
              className="display-heading text-3xl text-slate-900"
            >
              Personal details
            </h2>
          </div>
          <StudentEnrollmentForm
            faculties={faculties}
            departments={departments}
            defaultFacultyId={defaultFacultyId}
            lockFaculty={lockFaculty}
          />
        </section>
      </div>
    </main>
  );
}
