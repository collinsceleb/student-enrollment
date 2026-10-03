import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/auth.service", () => ({
  getCurrentAdminProfile: vi.fn(),
}));
vi.mock("@/lib/server/rate-limit", () => ({ consumeRateLimit: vi.fn() }));
vi.mock("@/lib/server/turnstile", () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { changeOwnPasswordAction } from "@/features/auth/password-change.actions";

function formData(website = "") {
  const data = new FormData();
  data.set("website", website);
  data.set("turnstile_token", "test-token");
  data.set("currentPassword", "current-password");
  data.set("newPassword", "new-password-123");
  data.set("confirmPassword", "new-password-123");
  return data;
}

describe("changeOwnPasswordAction anti-bot checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a filled honeypot", async () => {
    await expect(
      changeOwnPasswordAction(formData("automated content"))
    ).rejects.toThrow("redirect:/change-password?error=invalid");

    expect(mocks.verifyTurnstileToken).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("blocks the change when Turnstile rejects the token", async () => {
    mocks.verifyTurnstileToken.mockResolvedValue("rejected");

    await expect(changeOwnPasswordAction(formData())).rejects.toThrow(
      "redirect:/change-password?error=verification-failed"
    );

    expect(mocks.verifyTurnstileToken).toHaveBeenCalledWith("test-token", {
      expectedAction: "password_change",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
