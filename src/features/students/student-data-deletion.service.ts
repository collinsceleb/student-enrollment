import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export class StudentDataDeletionError extends Error {
  constructor() {
    super("Student data could not be deleted.");
    this.name = "StudentDataDeletionError";
  }
}

export async function deleteAllStudentRecords(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { error } = await supabase
    .from("students")
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new StudentDataDeletionError();
  }
}
