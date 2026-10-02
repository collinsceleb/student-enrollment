import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { verifyTurnstileToken } from "@/lib/server/turnstile";

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepts only a successful enrollment token from the configured host", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://enrollment.example.edu");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        success: true,
        hostname: "enrollment.example.edu",
        action: "enrollment",
      })
    );

    await expect(
      verifyTurnstileToken("valid-token", { fetcher })
    ).resolves.toBe("verified");
    expect(fetcher).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          secret: "test-secret",
          response: "valid-token",
        }),
      })
    );
  });

  it("rejects failed tokens and mismatched hostnames or actions", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://enrollment.example.edu");

    for (const payload of [
      { success: false },
      {
        success: true,
        hostname: "attacker.example.net",
        action: "enrollment",
      },
      {
        success: true,
        hostname: "enrollment.example.edu",
        action: "login",
      },
    ]) {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(payload));
      await expect(verifyTurnstileToken("token", { fetcher })).resolves.toBe(
        "rejected"
      );
    }
  });

  it("fails closed when server verification is unavailable", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://enrollment.example.edu");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("offline"));

    await expect(verifyTurnstileToken("token", { fetcher })).resolves.toBe(
      "unavailable"
    );
  });

  it("reports missing server configuration as unavailable", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetcher = vi.fn<typeof fetch>();

    await expect(verifyTurnstileToken("token", { fetcher })).resolves.toBe(
      "unavailable"
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects missing and oversized tokens without calling Cloudflare", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    const fetcher = vi.fn<typeof fetch>();

    await expect(verifyTurnstileToken("")).resolves.toBe("rejected");
    await expect(verifyTurnstileToken("x".repeat(2049))).resolves.toBe(
      "rejected"
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
