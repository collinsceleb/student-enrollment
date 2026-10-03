"use client";

import { useState } from "react";

import { HoneypotField } from "@/components/shared/honeypot-field";
import { TurnstileWidget } from "@/features/enrollment/turnstile-widget";

interface ChangePasswordFormProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly siteKey: string;
}

export function ChangePasswordForm({
  action,
  siteKey,
}: ChangePasswordFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");

  return (
    <form action={action} className="mt-5 space-y-4">
      <HoneypotField />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">
          Current or temporary password
        </span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">New password</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">
          Confirm new password
        </span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </label>
      <input type="hidden" name="turnstile_token" value={turnstileToken} />
      <TurnstileWidget
        siteKey={siteKey}
        action="password_change"
        onTokenChange={setTurnstileToken}
      />
      <button
        type="submit"
        disabled={!turnstileToken || !siteKey}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Save password
      </button>
    </form>
  );
}
