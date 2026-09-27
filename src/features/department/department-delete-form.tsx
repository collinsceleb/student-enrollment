"use client";

import { deleteDepartmentAction } from "@/features/department/department.actions";

export function DepartmentDeleteForm({
  departmentId,
}: {
  departmentId: string;
}) {
  return (
    <form
      action={deleteDepartmentAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this department? Deletion will be blocked while students are enrolled in it."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={departmentId} />
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
