import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signOut: mocks.signOut },
  }),
}));

import { POST } from "@/app/auth/logout/route";

describe("POST /auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs the user out and redirects to the public enrollment page", async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    const response = await POST(
      new Request("https://student.example.edu/auth/logout", {
        method: "POST",
      })
    );

    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(
      "https://student.example.edu/"
    );
  });

  it("returns an error instead of redirecting when sign-out fails", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("Sign out failed.") });

    const response = await POST(
      new Request("https://student.example.edu/auth/logout", {
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("Location")).toBeNull();
  });
});
