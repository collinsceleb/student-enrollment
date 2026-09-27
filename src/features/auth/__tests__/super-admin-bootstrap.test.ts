import { describe, expect, it } from "vitest";

import { getSuperAdminBootstrapConfig } from "@/features/auth/super-admin-bootstrap";
import { hasSupabaseAuthSession } from "@/../proxy";

describe("Super admin bootstrap config", () => {
  it("returns null when local super admin values are missing", () => {
    expect(
      getSuperAdminBootstrapConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      })
    ).toBeNull();
  });

  it("accepts a valid email and password for bootstrap", () => {
    const config = getSuperAdminBootstrapConfig({
      SUPER_ADMIN_EMAIL: "admin@example.com",
      SUPER_ADMIN_PASSWORD: "StrongPassword123",
    });

    expect(config).toEqual({
      email: "admin@example.com",
      password: "StrongPassword123",
    });
  });

  it("detects a real Supabase auth-token cookie without mistaking the verifier cookie", () => {
    expect(
      hasSupabaseAuthSession([
        { name: "sb-example-auth-token", value: "session-token" },
      ])
    ).toBe(true);

    expect(
      hasSupabaseAuthSession([
        { name: "sb-example-auth-token.0", value: "session-token-chunk" },
      ])
    ).toBe(true);

    expect(
      hasSupabaseAuthSession([
        { name: "sb-example-auth-token-code-verifier", value: "verifier" },
      ])
    ).toBe(false);

    expect(
      hasSupabaseAuthSession([{ name: "custom-cookie", value: "value" }])
    ).toBe(false);
  });
});
