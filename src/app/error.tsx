"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";

export default function RouteError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return <ErrorState onRetry={retry} />;
}
