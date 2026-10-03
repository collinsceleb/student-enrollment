"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { HoneypotField } from "@/components/shared/honeypot-field";
import { TurnstileWidget } from "@/features/enrollment/turnstile-widget";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          turnstile_token: turnstileToken,
          website: String(formData.get("website") ?? ""),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Unable to sign in. Please try again.");
        return;
      }

      window.location.replace("/admin");
    } catch {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
      setTurnstileToken("");
      setTurnstileResetKey((key) => key + 1);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="mb-7 flex items-center justify-between">
          <div className="enrollment-seal !size-11 !rounded-xl bg-[#173a32]">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <span className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
            Registrar portal
          </span>
        </div>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
          Secure sign in
        </p>
        <h1 className="display-heading text-3xl text-slate-900">
          Administrator access
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your assigned account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <HoneypotField />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <TurnstileWidget
            key={turnstileResetKey}
            siteKey={turnstileSiteKey}
            action="login"
            onTokenChange={setTurnstileToken}
          />

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken || !turnstileSiteKey}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <Link
          href="/"
          className="hover:text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Return to enrollment
        </Link>
      </div>
    </main>
  );
}
