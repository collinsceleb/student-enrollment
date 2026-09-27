import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  generateTemporaryPassword,
  getTemporaryPasswordIssuedAt,
} from "@/features/auth/temporary-password";

describe("temporary admin passwords", () => {
  it("generates distinct, high-entropy URL-safe credentials", () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();

    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(first).not.toBe(second);
  });

  it("rounds issuance time past the current JWT auth-time second", () => {
    expect(getTemporaryPasswordIssuedAt(1_790_539_210_900)).toBe(
      "2026-09-27T20:00:11.000Z"
    );
  });
});
