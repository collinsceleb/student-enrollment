"use client";

import { Download } from "lucide-react";
import { useState, type FormEvent } from "react";

type ExportMode = "faculty-admin" | "super-admin";
type ExportScope = "department" | "faculty" | "all";

export type ExportFacultyOption = {
  id: string;
  name: string;
  code: string;
};

export type ExportDepartmentOption = {
  id: string;
  faculty_id: string;
  name: string;
  code: string;
};

export function StudentExportForm({
  mode,
  faculties,
  departments,
}: Readonly<{
  mode: ExportMode;
  faculties: ExportFacultyOption[];
  departments: ExportDepartmentOption[];
}>) {
  const [scope, setScope] = useState<ExportScope>(
    mode === "super-admin" ? "all" : "faculty"
  );
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [format, setFormat] = useState<"xlsx" | "docx" | "pdf">("xlsx");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleDepartments =
    mode === "faculty-admin"
      ? departments
      : departments.filter((department) => department.faculty_id === facultyId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const body: Record<string, string> = { format, scope };
    if (mode === "super-admin" && scope === "faculty") {
      body.faculty_id = facultyId;
    }
    if (scope === "department") {
      body.department_id = departmentId;
      if (mode === "super-admin") body.faculty_id = facultyId;
    }

    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(result?.error ?? "Export could not be generated.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition");
      const fileName = disposition?.match(/filename="([^"]+)"/)?.[1];
      anchor.href = url;
      anchor.download = fileName ?? `student-enrollment.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(
        "Export could not be generated. Check your connection and retry."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Student export</h2>
        <p className="mt-1 text-sm text-slate-600">
          Export records within your authorized scope.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-end"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Scope</span>
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value as ExportScope);
              setDepartmentId("");
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {mode === "super-admin" && (
              <option value="all">All student records</option>
            )}
            <option value="faculty">Faculty</option>
            <option value="department">Department</option>
          </select>
        </label>

        {mode === "super-admin" && scope !== "all" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Faculty</span>
            <select
              required
              value={facultyId}
              onChange={(event) => {
                setFacultyId(event.target.value);
                setDepartmentId("");
              }}
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
        )}

        {scope === "department" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Department
            </span>
            <select
              required
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="" disabled>
                Select department
              </option>
              {visibleDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Format</span>
          <select
            value={format}
            onChange={(event) =>
              setFormat(event.target.value as "xlsx" | "docx" | "pdf")
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="xlsx">Excel</option>
            <option value="docx">Word</option>
            <option value="pdf">PDF</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            (mode === "super-admin" && scope !== "all" && !facultyId) ||
            (scope === "department" && !departmentId)
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download aria-hidden="true" size={16} />
          {isSubmitting ? "Preparing export..." : "Download export"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </section>
  );
}
