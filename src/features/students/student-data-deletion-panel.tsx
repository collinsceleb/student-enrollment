"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { deleteAllStudentDataAction } from "@/features/students/student-data-deletion.actions";
import { studentDataDeletionConfirmation } from "@/lib/validation/student-data-deletion.schema";

const statusMessages: Record<string, string> = {
  deleted:
    "All student records were deleted. Faculties, departments, and administrator accounts were preserved.",
};

const errorMessages: Record<string, string> = {
  confirmation: "The confirmation phrase did not match. No data was deleted.",
  failed: "Student data could not be deleted. No configuration was changed.",
};

interface StudentDataDeletionPanelProps {
  readonly status?: string;
  readonly error?: string;
}

export function StudentDataDeletionPanel({
  status,
  error,
}: StudentDataDeletionPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  return (
    <section className="space-y-4 rounded-lg border border-red-200 bg-white p-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Delete all student data?
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          This permanently removes every student enrollment record. Faculty,
          department, and administrator accounts will remain.
        </p>
      </div>

      {status && statusMessages[status] && (
        <output className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {statusMessages[status]}
        </output>
      )}
      {error && errorMessages[error] && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {errorMessages[error]}
        </p>
      )}

      {!isConfirming ? (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirming(true)}
        >
          Begin student data deletion
        </Button>
      ) : (
        <form action={deleteAllStudentDataAction} className="space-y-4">
          <label className="block max-w-lg space-y-2">
            <span className="text-sm font-medium text-slate-800">
              Type {studentDataDeletionConfirmation} to confirm
            </span>
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              maxLength={studentDataDeletionConfirmation.length}
              required
              className="w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={confirmation !== studentDataDeletionConfirmation}
            >
              Permanently delete student records
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsConfirming(false);
                setConfirmation("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
