"use client";

import { removeSuperAdminAction } from "@/features/administration/super-admin.actions";

export function SuperAdminDeleteForm({
  userId,
  disabledReason,
}: {
  userId: string;
  disabledReason?: string;
}) {
  return (
    <form
      action={removeSuperAdminAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Remove this super administrator? Their account access will be revoked."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        disabled={Boolean(disabledReason)}
        title={disabledReason}
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabledReason ?? "Remove"}
      </button>
    </form>
  );
}
