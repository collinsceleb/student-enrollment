import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  getRequestIdentity: vi.fn(() => "203.0.113.8"),
  signInWithPassword: vi.fn(),
}));

vi.mock("@/lib/server/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getRequestIdentity: mocks.getRequestIdentity,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mocks.signInWithPassword },
  }),
}));

import { POST } from "@/app/api/auth/login/route";

function request(body: unknown) {
  return new Request("https://example.test/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
  });

  it("checks both IP and normalized email limits before signing in", async () => {
    const response = await POST(
      request({ email: " ADMIN@example.com ", password: "valid-password" })
    );

    expect(response.status).toBe(200);
    expect(mocks.consumeRateLimit).toHaveBeenNthCalledWith(
      1,
      "login-ip",
      "203.0.113.8"
    );
    expect(mocks.consumeRateLimit).toHaveBeenNthCalledWith(
      2,
      "login-email",
      "admin@example.com"
    );
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "valid-password",
    });
  });

  it("blocks over-limit IPs before parsing credentials", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 120,
    });

    const response = await POST(request({ email: "admin@example.com" }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("blocks over-limit email identities before attempting authentication", async () => {
    mocks.consumeRateLimit
      .mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });

    const response = await POST(
      request({ email: "admin@example.com", password: "bad-password" })
    );

    expect(response.status).toBe(429);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("does not reveal whether an email account exists", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: new Error("bad user"),
    });

    const response = await POST(
      request({ email: "admin@example.com", password: "bad-password" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid email or password.",
    });
  });
});
