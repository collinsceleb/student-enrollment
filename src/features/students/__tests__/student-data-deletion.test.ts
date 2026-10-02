import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  deleteAllStudentRecords,
  StudentDataDeletionError,
} from "@/features/students/student-data-deletion.service";
import {
  studentDataDeletionConfirmation,
  studentDataDeletionConfirmationSchema,
} from "@/lib/validation/student-data-deletion.schema";
import type { Database } from "@/types/database.types";

describe("student data deletion safety", () => {
  it("accepts only the explicit student-data confirmation phrase", () => {
    expect(
      studentDataDeletionConfirmationSchema.safeParse(
        studentDataDeletionConfirmation
      ).success
    ).toBe(true);
    expect(
      studentDataDeletionConfirmationSchema.safeParse("DELETE ALL DATA").success
    ).toBe(false);
    expect(
      studentDataDeletionConfirmationSchema.safeParse(
        `${studentDataDeletionConfirmation} `
      ).success
    ).toBe(false);
  });

  it("deletes only non-null student rows and never targets configuration tables", async () => {
    const notFilter = vi.fn().mockResolvedValue({ error: null });
    const deleteRows = vi.fn(() => ({ not: notFilter }));
    const from = vi.fn(() => ({ delete: deleteRows }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await deleteAllStudentRecords(client);

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("students");
    expect(deleteRows).toHaveBeenCalledTimes(1);
    expect(notFilter).toHaveBeenCalledWith("id", "is", null);
  });

  it("fails loudly when the database rejects the deletion", async () => {
    const deleteRows = vi.fn(() => ({
      not: vi.fn().mockResolvedValue({ error: new Error("database failure") }),
    }));
    const client = {
      from: vi.fn(() => ({ delete: deleteRows })),
    } as unknown as SupabaseClient<Database>;

    await expect(deleteAllStudentRecords(client)).rejects.toBeInstanceOf(
      StudentDataDeletionError
    );
  });
});
