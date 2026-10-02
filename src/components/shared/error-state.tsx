"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  readonly onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <section className="max-w-md space-y-5 text-center" role="alert">
        <AlertTriangle
          aria-hidden="true"
          className="mx-auto size-10 text-amber-700"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            We could not load this page. Please try again.
          </p>
        </div>
        <Button onClick={onRetry}>Try again</Button>
      </section>
    </main>
  );
}
