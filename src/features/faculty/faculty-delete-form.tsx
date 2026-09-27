"use client";

import { deleteFacultyAction } from "@/features/faculty/faculty.actions";

export function FacultyDeleteForm({ facultyId }: Readonly<{ facultyId: string }>) {
  return (
    <form
      action={deleteFacultyAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this faculty? Deletion will be blocked while it has departments, students, or faculty administrators."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={facultyId} />
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
