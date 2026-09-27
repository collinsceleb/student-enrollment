"use client";

import { useActionState, useState, type ReactNode } from "react";

import type { AdminPasswordActionState } from "@/features/administration/admin-password-action-state";
import { initialAdminPasswordActionState } from "@/features/administration/admin-password-action-state";

type TemporaryPasswordAction = (
  previousState: AdminPasswordActionState,
  formData: FormData
) => Promise<AdminPasswordActionState>;

const errorMessages: Record<string, string> = {
  invalid: "Check the account details and try again.",
  "duplicate-email": "An account with that email already exists.",
  "invalid-faculty": "Select an existing faculty.",
  "invalid-role": "Only an administrator account can be reset.",
  "already-issued":
    "A temporary password was issued moments ago. Wait briefly, then retry if needed.",
  "self-reset": "Ask another super admin to issue your temporary password.",
  "not-found": "That administrator could not be found.",
  failed: "The password operation could not be completed. Please try again.",
};

export function TemporaryPasswordForm({
  action,
  submitLabel,
  children,
  disabledReason,
  className,
}: Readonly<{
  action: TemporaryPasswordAction;
  submitLabel: string;
  children: ReactNode;
  disabledReason?: string;
  className?: string;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialAdminPasswordActionState
  );
  const [copied, setCopied] = useState(false);

  async function copyTemporaryPassword() {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={className}>
      <form action={formAction} className="grid gap-3 md:grid-cols-2">
        {children}
        <button
          type="submit"
          disabled={
            isPending || state.status === "success" || Boolean(disabledReason)
          }
          title={disabledReason}
          className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Working..." : (disabledReason ?? submitLabel)}
        </button>
      </form>

      {state.status === "error" && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {errorMessages[state.code] ?? errorMessages.failed}
        </p>
      )}

      {state.status === "success" && (
        <div
          role="status"
          className="mt-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900"
        >
          <p className="font-semibold">Temporary password for {state.email}</p>
          <p className="mt-1">
            Share it securely. It is shown only in this response and must be
            changed at sign-in.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              aria-label="Temporary password"
              readOnly
              value={state.temporaryPassword}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-green-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
            />
            <button
              type="button"
              onClick={copyTemporaryPassword}
              className="rounded-md border border-green-300 bg-white px-3 py-2 font-medium hover:bg-green-100"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border border-green-300 bg-white px-3 py-2 font-medium hover:bg-green-100"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
