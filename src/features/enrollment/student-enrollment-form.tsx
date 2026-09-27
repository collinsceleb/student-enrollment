"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { studentSchema } from "@/lib/validation/student.schema";
import type { Department } from "@/types/department";
import type { Faculty } from "@/types/faculty";

type StudentFormValues = z.input<typeof studentSchema>;

type FormSubmissionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

interface StudentEnrollmentFormProps {
  readonly faculties: Faculty[];
  readonly departments: Department[];
}

export function StudentEnrollmentForm({
  faculties,
  departments,
}: StudentEnrollmentFormProps) {
  const [submissionState, setSubmissionState] = useState<FormSubmissionState>({
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      other_name: "",
      phone_number: "",
      registration_number: "",
      faculty_id: "",
      department_id: "",
      admission_type: "JAMBITE",
    },
  });

  const selectedFacultyId = useWatch({ control, name: "faculty_id" });
  const selectedDepartmentId = useWatch({ control, name: "department_id" });

  const selectableDepartments = useMemo(
    () =>
      departments.filter(
        (department) => department.faculty_id === selectedFacultyId
      ),
    [departments, selectedFacultyId]
  );

  useEffect(() => {
    if (!selectedFacultyId) {
      setValue("department_id", "");
      return;
    }

    const departmentStillValid = selectableDepartments.some(
      (department) => department.id === selectedDepartmentId
    );

    if (!departmentStillValid) {
      setValue("department_id", "");
    }
  }, [
    selectedFacultyId,
    selectedDepartmentId,
    selectableDepartments,
    setValue,
  ]);

  async function onSubmit(values: StudentFormValues) {
    setSubmissionState({ status: "idle" });

    const response = await fetch("/api/enrollment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
    };

    if (!response.ok) {
      const errorMessage =
        payload.message ??
        "Please correct the highlighted errors and try again.";
      setSubmissionState({ status: "error", message: errorMessage });
      return;
    }

    reset();
    setSubmissionState({
      status: "success",
      message: payload.message ?? "Enrollment submitted successfully.",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            First Name *
          </span>
          <input
            {...register("first_name")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="John"
          />
          {errors.first_name && (
            <span className="text-sm text-red-600">
              {errors.first_name.message}
            </span>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Last Name / Surname *
          </span>
          <input
            {...register("last_name")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Doe"
          />
          {errors.last_name && (
            <span className="text-sm text-red-600">
              {errors.last_name.message}
            </span>
          )}
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Other Name</span>
          <input
            {...register("other_name")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Adebayo"
          />
          {errors.other_name && (
            <span className="text-sm text-red-600">
              {errors.other_name.message}
            </span>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Phone Number *
          </span>
          <input
            {...register("phone_number")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="+234 801 234 5678"
          />
          {errors.phone_number && (
            <span className="text-sm text-red-600">
              {errors.phone_number.message}
            </span>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Registration Number *
          </span>
          <input
            {...register("registration_number")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="2026/001"
          />
          {errors.registration_number && (
            <span className="text-sm text-red-600">
              {errors.registration_number.message}
            </span>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Faculty *</span>
          <select
            {...register("faculty_id")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            defaultValue=""
          >
            <option value="">Select faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
          {errors.faculty_id && (
            <span className="text-sm text-red-600">
              {errors.faculty_id.message}
            </span>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Department *
          </span>
          <select
            {...register("department_id")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={selectedDepartmentId ?? ""}
            disabled={!selectedFacultyId || selectableDepartments.length === 0}
          >
            <option value="">
              {selectedFacultyId ? "Select department" : "Choose faculty first"}
            </option>
            {selectableDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {errors.department_id && (
            <span className="text-sm text-red-600">
              {errors.department_id.message}
            </span>
          )}
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Admission Type *
          </span>
          <select
            {...register("admission_type")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="JAMBITE">JAMBITE</option>
            <option value="DIRECT_ENTRY">DIRECT_ENTRY</option>
          </select>
          {errors.admission_type && (
            <span className="text-sm text-red-600">
              {errors.admission_type.message}
            </span>
          )}
        </label>
      </div>

      {submissionState.status !== "idle" && (
        <div
          className={
            submissionState.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {submissionState.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? "Submitting..." : "Submit Enrollment"}
        </Button>
      </div>
    </form>
  );
}
