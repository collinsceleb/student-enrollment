import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));

import {
  consumeRateLimit,
  createRateLimitKey,
  getRequestIdentity,
  RateLimitUnavailableError,
} from "@/lib/server/rate-limit";

describe("rate limiting", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("creates deterministic, scope-separated opaque keys", () => {
    const key = createRateLimitKey(
      "login-email",
      " USER@example.com ",
      "secret"
    );

    expect(key).toBe(
      createRateLimitKey("login-email", "user@example.com", "secret")
    );
    expect(key).not.toBe(
      createRateLimitKey("login-ip", "user@example.com", "secret")
    );
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses trusted proxy IP headers for request identity", () => {
    const request = new Request("https://example.test", {
      headers: {
        "cf-connecting-ip": "203.0.113.5",
        "x-forwarded-for": "198.51.100.2, 203.0.113.8",
      },
    });

    expect(getRequestIdentity(request)).toBe("203.0.113.5");

    const untrustedForwardedRequest = new Request("https://example.test", {
      headers: { "x-forwarded-for": "198.51.100.9" },
    });
    expect(getRequestIdentity(untrustedForwardedRequest)).toBe("unknown");
  });

  it("calls the atomic database limiter with the policy for its operation", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 30 }],
      error: null,
    });

    await expect(consumeRateLimit("login-ip", "203.0.113.5")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 30,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "consume_rate_limit",
      expect.objectContaining({ p_limit: 8, p_window_seconds: 900 })
    );
  });

  it.each([
    ["enrollment", 8, 600],
    ["login-ip", 8, 900],
    ["login-email", 5, 900],
    ["password-reauth", 5, 900],
    ["admin-action", 60, 600],
    ["export", 6, 3600],
  ] as const)(
    "configures %s for %i requests per %i seconds",
    async (scope, limit, windowSeconds) => {
      vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
      mocks.rpc.mockResolvedValue({
        data: [{ allowed: true, retry_after_seconds: 0 }],
        error: null,
      });

      await consumeRateLimit(scope, "user-or-ip");

      expect(mocks.rpc).toHaveBeenLastCalledWith(
        "consume_rate_limit",
        expect.objectContaining({
          p_limit: limit,
          p_window_seconds: windowSeconds,
        })
      );
    }
  );

  it("fails closed if the limiter RPC fails", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("db offline") });

    await expect(
      consumeRateLimit("enrollment", "203.0.113.5")
    ).rejects.toBeInstanceOf(RateLimitUnavailableError);
  });
});
