import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  enforceAdminActionLimit: vi.fn(),
  createAdminClient: vi.fn(() => ({ privileged: true })),
  deleteAllStudentRecords: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/auth.service", () => ({
  getCurrentAdminProfile: mocks.getProfile,
}));
vi.mock("@/features/students/student-data-deletion.service", () => ({
  deleteAllStudentRecords: mocks.deleteAllStudentRecords,
}));
vi.mock("@/lib/server/admin-action-limit", () => ({
  enforceAdminActionLimit: mocks.enforceAdminActionLimit,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import { deleteAllStudentDataAction } from "@/features/students/student-data-deletion.actions";
import { studentDataDeletionConfirmation } from "@/lib/validation/student-data-deletion.schema";

function createConfirmationForm(confirmation: string) {
  const formData = new FormData();
  formData.set("confirmation", confirmation);
  return formData;
}

describe("deleteAllStudentDataAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "super-admin-id" } },
    });
    mocks.getProfile.mockResolvedValue({
      data: {
        role: "SUPER_ADMIN",
        has_changed_password: true,
        session_is_current: true,
      },
    });
    mocks.enforceAdminActionLimit.mockResolvedValue(undefined);
    mocks.deleteAllStudentRecords.mockResolvedValue(undefined);
  });

  it("does not delete records for a faculty admin", async () => {
    mocks.getProfile.mockResolvedValue({
      data: {
        role: "FACULTY_ADMIN",
        has_changed_password: true,
        session_is_current: true,
      },
    });

    await expect(
      deleteAllStudentDataAction(
        createConfirmationForm(studentDataDeletionConfirmation)
      )
    ).rejects.toThrow("redirect:/unauthorized");

    expect(mocks.deleteAllStudentRecords).not.toHaveBeenCalled();
  });

  it("does not delete records unless the server receives the exact phrase", async () => {
    await expect(
      deleteAllStudentDataAction(createConfirmationForm("DELETE ALL DATA"))
    ).rejects.toThrow("redirect:/admin?studentDataError=confirmation");

    expect(mocks.deleteAllStudentRecords).not.toHaveBeenCalled();
  });

  it("deletes student rows and revalidates the admin dashboard after confirmation", async () => {
    await expect(
      deleteAllStudentDataAction(
        createConfirmationForm(studentDataDeletionConfirmation)
      )
    ).rejects.toThrow("redirect:/admin?studentDataStatus=deleted");

    expect(mocks.enforceAdminActionLimit).toHaveBeenCalledWith(
      "super-admin-id"
    );
    expect(mocks.deleteAllStudentRecords).toHaveBeenCalledWith({
      privileged: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  });
});
