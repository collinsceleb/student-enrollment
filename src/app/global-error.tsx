"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ErrorState onRetry={retry} />
      </body>
    </html>
  );
}
