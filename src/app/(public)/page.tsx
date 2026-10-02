import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";

import { StudentEnrollmentForm } from "@/features/enrollment/student-enrollment-form";
import {
  getPublicDepartmentOptions,
  getPublicFacultyOptions,
} from "@/features/enrollment/enrollment.service";

export default async function PublicEnrollmentPage() {
  const [faculties, departments] = await Promise.all([
    getPublicFacultyOptions(),
    getPublicDepartmentOptions(),
  ]);

  return (
    <main className="enrollment-page">
      <div className="enrollment-layout">
        <header className="enrollment-intro">
          <div className="space-y-10">
            <div className="flex items-center justify-between gap-4">
              <div className="enrollment-seal" aria-hidden="true">
                <GraduationCap className="size-6" />
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm font-semibold text-white/85 transition hover:text-white"
              >
                Staff access
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
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
          />
        </section>
      </div>
    </main>
  );
}
