import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <section className="max-w-md space-y-5 text-center">
        <p className="text-sm font-semibold tracking-[0.16em] text-slate-500 uppercase">
          404
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Page not found
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            This page may have moved or the address may be incorrect.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Return to enrollment
          </Link>
        </Button>
      </section>
    </main>
  );
}
