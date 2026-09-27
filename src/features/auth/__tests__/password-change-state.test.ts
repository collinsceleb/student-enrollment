import { describe, expect, it } from "vitest";

import {
  getIssuedAtFromClaims,
  isSessionCurrentAfterTemporaryPassword,
} from "@/features/auth/auth.service";

describe("temporary-password session freshness", () => {
  it("reads iat from the nested Supabase claims object", () => {
    expect(getIssuedAtFromClaims({ claims: { iat: 1_790_539_211 } })).toBe(
      1_790_539_211
    );
  });

  it("keeps existing accounts without an issuance timestamp valid", () => {
    expect(isSessionCurrentAfterTemporaryPassword(null, 0)).toBe(true);
  });

  it("rejects sessions created before a temporary password was issued", () => {
    expect(
      isSessionCurrentAfterTemporaryPassword(
        "2026-09-27T20:00:10.900Z",
        1_790_524_809
      )
    ).toBe(false);
  });

  it("accepts a session created after temporary-password issuance", () => {
    expect(
      isSessionCurrentAfterTemporaryPassword(
        "2026-09-27T20:00:10.000Z",
        1_790_539_211
      )
    ).toBe(true);
  });
});
