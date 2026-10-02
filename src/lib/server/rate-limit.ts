import "server-only";

import { createHmac } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitScope =
  | "enrollment"
  | "login-ip"
  | "login-email"
  | "password-reauth"
  | "admin-action"
  | "export";

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Rate limit service is unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

const policies: Record<
  RateLimitScope,
  { limit: number; windowSeconds: number }
> = {
  enrollment: { limit: 8, windowSeconds: 600 },
  "login-ip": { limit: 8, windowSeconds: 900 },
  "login-email": { limit: 5, windowSeconds: 900 },
  "password-reauth": { limit: 5, windowSeconds: 900 },
  "admin-action": { limit: 60, windowSeconds: 600 },
  export: { limit: 6, windowSeconds: 3600 },
};

export function createRateLimitKey(
  scope: RateLimitScope,
  identity: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(`${scope}:${identity.trim().toLowerCase() || "unknown"}`)
    .digest("hex");
}

export function getRequestIdentity(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export async function consumeRateLimit(
  scope: RateLimitScope,
  identity: string
): Promise<RateLimitDecision> {
  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new RateLimitUnavailableError();

  const policy = policies[scope];
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    p_key: createRateLimitKey(scope, identity, secret),
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
  });

  const result = data?.[0];
  if (error || !result) throw new RateLimitUnavailableError();

  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retry_after_seconds,
  };
}
