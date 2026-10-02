import "server-only";

import { redirect } from "next/navigation";

import { consumeRateLimit } from "@/lib/server/rate-limit";

export async function enforceAdminActionLimit(userId: string): Promise<void> {
  let decision;
  try {
    decision = await consumeRateLimit("admin-action", userId);
  } catch {
    redirect("/admin?adminError=unavailable");
  }

  if (!decision.allowed) {
    redirect("/admin?adminError=rate-limited");
  }
}
