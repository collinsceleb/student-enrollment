import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <section className="max-w-md space-y-5 text-center" role="alert">
        <ShieldX aria-hidden="true" className="mx-auto size-10 text-red-700" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Access not permitted
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            You do not have permission to access this data. Contact your system
            administrator if you believe this is a mistake.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Return to enrollment</Link>
        </Button>
      </section>
    </main>
  );
}
