import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="flex min-h-[60vh] items-center justify-center px-6 py-16"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        <span>Loading page...</span>
      </div>
    </main>
  );
}
