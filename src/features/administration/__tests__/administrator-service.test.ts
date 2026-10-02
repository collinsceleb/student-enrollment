import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createFacultyAdministrator } from "@/features/administration/faculty-admin-management.service";
import { createSuperAdministrator } from "@/features/administration/super-admin-management.service";
import type { createAdminClient } from "@/lib/supabase/admin";

function createAdminClientFixture(profileInsertError: unknown = null) {
  const deleteUser = vi.fn().mockResolvedValue({ error: null });
  const createUser = vi.fn().mockResolvedValue({
    data: { user: { id: "created-user-id" } },
    error: null,
  });
  const insert = vi.fn().mockResolvedValue({ error: profileInsertError });
  const client = {
    auth: {
      admin: { createUser, deleteUser },
    },
    from: vi.fn(() => ({ insert })),
  };

  return {
    client: client as unknown as ReturnType<typeof createAdminClient>,
    createUser,
    deleteUser,
    insert,
  };
}

describe("administrator management services", () => {
  it("creates a faculty admin with only the requested faculty role assignment", async () => {
    const fixture = createAdminClientFixture();

    await expect(
      createFacultyAdministrator(
        fixture.client,
        {
          email: "faculty.admin@example.edu",
          faculty_id: "11111111-1111-4111-8111-111111111111",
        },
        "TemporaryPassword123!",
        "reset-id"
      )
    ).resolves.toEqual({ status: "success" });

    expect(fixture.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "faculty.admin@example.edu" })
    );
    expect(fixture.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "created-user-id",
        role: "FACULTY_ADMIN",
        faculty_id: "11111111-1111-4111-8111-111111111111",
      })
    );
  });

  it("deletes the auth user if faculty profile creation fails", async () => {
    const fixture = createAdminClientFixture({
      code: "23503",
      message: "invalid faculty",
    });

    await expect(
      createFacultyAdministrator(
        fixture.client,
        {
          email: "faculty.admin@example.edu",
          faculty_id: "11111111-1111-4111-8111-111111111111",
        },
        "TemporaryPassword123!",
        "reset-id"
      )
    ).resolves.toEqual({ status: "invalid-faculty" });

    expect(fixture.deleteUser).toHaveBeenCalledWith("created-user-id");
  });

  it("creates a super admin without a faculty assignment", async () => {
    const fixture = createAdminClientFixture();

    await expect(
      createSuperAdministrator(
        fixture.client,
        { email: "root@example.edu" },
        "TemporaryPassword123!",
        "reset-id"
      )
    ).resolves.toEqual({ status: "success" });

    expect(fixture.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "created-user-id",
        role: "SUPER_ADMIN",
        faculty_id: null,
      })
    );
  });
});
