"use client";

import { ArrowDown, ArrowUp, Download, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  createCustomExportFieldRequest,
  databaseExportFields,
  defaultExportFieldRequests,
  resolveExportFields,
} from "@/features/exports/export-fields";
import type { ExportFieldRequest } from "@/features/exports/export.types";

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
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedFields, setSelectedFields] = useState<ExportFieldRequest[]>(
    defaultExportFieldRequests
  );
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleDepartments =
    mode === "faculty-admin"
      ? departments
      : departments.filter((department) => department.faculty_id === facultyId);

  const availableDatabaseFields = useMemo(
    () =>
      Object.values(databaseExportFields).filter(
        (definition) =>
          !selectedFields.some(
            (field) => field.source === "database" && field.id === definition.id
          )
      ),
    [selectedFields]
  );

  const previewFields = useMemo(
    () => resolveExportFields(selectedFields),
    [selectedFields]
  );

  function addCustomField() {
    const trimmedLabel = customFieldLabel.trim();
    if (!trimmedLabel) {
      setFieldError("Enter a label for the export-only field.");
      return;
    }

    const duplicate = selectedFields.some(
      (field) =>
        field.source === "export-only" &&
        field.label.trim().toLowerCase() === trimmedLabel.toLowerCase()
    );

    if (duplicate) {
      setFieldError("That custom field label is already selected.");
      return;
    }

    try {
      const field = createCustomExportFieldRequest(trimmedLabel);
      setSelectedFields((current) => [...current, field]);
      setCustomFieldLabel("");
      setFieldError(null);
    } catch (requestError) {
      setFieldError(
        requestError instanceof Error
          ? requestError.message
          : "Invalid field label."
      );
    }
  }

  function removeField(index: number) {
    setSelectedFields((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function moveField(index: number, direction: -1 | 1) {
    setSelectedFields((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const updated = [...current];
      [updated[index], updated[nextIndex]] = [
        updated[nextIndex],
        updated[index],
      ];
      return updated;
    });
  }

  async function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const resolvedScope: ExportScope =
      scope === "department" && departmentId ? "department" : "faculty";
    const resolvedAllData =
      mode === "super-admin" && !facultyId && !departmentId && scope === "all";

    const body: Record<string, unknown> = {
      format,
      scope: resolvedAllData ? "all" : resolvedScope,
      fields: selectedFields,
    };

    const trimmedTitle = title.trim();
    const trimmedSubtitle = subtitle.trim();
    if (trimmedTitle) body.title = trimmedTitle;
    if (trimmedSubtitle) body.subtitle = trimmedSubtitle;

    if (mode === "super-admin" && facultyId) {
      body.faculty_id = facultyId;
    }
    if (departmentId) {
      body.department_id = departmentId;
    }

    if (selectedFields.length === 0) {
      setError("Choose at least one field to include in the export.");
      setIsSubmitting(false);
      return;
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

        <label className="block space-y-1.5 sm:col-span-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Faculty of Computing"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block space-y-1.5 sm:col-span-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">Subtitle</span>
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="2026 Admission Documentation"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            selectedFields.length === 0 ||
            (mode === "super-admin" && scope !== "all" && !facultyId) ||
            (scope === "department" && !departmentId)
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download aria-hidden="true" size={16} />
          {isSubmitting ? "Preparing export..." : "Download export"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-[0.12em] text-slate-600 uppercase">
              Export configuration
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Select, reorder, and preview the columns for the generated export.
            </p>
          </div>
          <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
            {selectedFields.length} selected
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Selected fields
            </p>
            <div className="space-y-2">
              {selectedFields.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No fields selected. Pick at least one field.
                </p>
              ) : (
                selectedFields.map((field, index) => {
                  const label =
                    field.source === "database"
                      ? databaseExportFields[field.id].label
                      : field.label;

                  return (
                    <div
                      key={`${field.source}-${field.id}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-700">{label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${label} up`}
                          className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowUp size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 1)}
                          disabled={index === selectedFields.length - 1}
                          aria-label={`Move ${label} down`}
                          className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowDown size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          aria-label={`Remove ${label}`}
                          className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Available database fields
            </p>
            <div className="space-y-2">
              {availableDatabaseFields.length === 0 ? (
                <p className="text-sm text-slate-500">
                  All database-backed fields are already selected.
                </p>
              ) : (
                availableDatabaseFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() =>
                      setSelectedFields((current) => [
                        ...current,
                        { source: "database", id: field.id },
                      ])
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>{field.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Plus size={12} aria-hidden="true" /> Add
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <label className="block space-y-1.5 text-sm text-slate-700">
                <span className="font-medium">Custom export-only field</span>
                <div className="flex gap-2">
                  <input
                    value={customFieldLabel}
                    onChange={(event) => {
                      setCustomFieldLabel(event.target.value);
                      setFieldError(null);
                    }}
                    placeholder="Documentation Status"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
              </label>
              {fieldError && (
                <p className="mt-2 text-sm text-red-700">{fieldError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">Preview</p>
          <div className="flex flex-wrap gap-2">
            {previewFields.map((field, index) => (
              <span
                key={`${field.source}-${field.id}-${index}`}
                className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {field.label}
              </span>
            ))}
          </div>
        </div>
      </div>

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
