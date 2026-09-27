"use client";

import { removeFacultyAdminAction } from "@/features/administration/faculty-admin.actions";

export function FacultyAdminDeleteForm({ userId }: Readonly<{ userId: string }>) {
  return (
    <form
      action={removeFacultyAdminAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Remove this faculty administrator? Their Auth account will be deleted and access revoked."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Remove
      </button>
    </form>
  );
}
