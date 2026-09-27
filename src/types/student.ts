import type { Database } from "./database.types";
import type { Faculty } from "./faculty";
import type { Department } from "./department";

export type AdmissionType = Database["public"]["Enums"]["admission_type"];

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export interface StudentWithRelations extends Student {
  faculty: Faculty;
  department: Department;
}

/**
 * Format student name per project requirement:
 * Surname (last name) in CAPITAL LETTERS, comma, followed by other names.
 * Example: "DOE, John Alexander"
 */
export function formatStudentFullName(student: {
  last_name: string;
  first_name: string;
  other_name?: string | null;
}): string {
  const surname = student.last_name.trim().toUpperCase();
  const givenNames = [student.first_name.trim(), student.other_name?.trim()]
    .filter(Boolean)
    .join(" ");

  return `${surname}, ${givenNames}`;
}
