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
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase">
            Student Enrollment
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Admission Form</h1>
        </div>

        <StudentEnrollmentForm
          faculties={faculties}
          departments={departments}
        />
      </div>
    </main>
  );
}
