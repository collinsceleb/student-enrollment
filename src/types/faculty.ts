import type { Database } from "./database.types";

export type Faculty = Database["public"]["Tables"]["faculties"]["Row"];
export type FacultyInsert = Database["public"]["Tables"]["faculties"]["Insert"];
export type FacultyUpdate = Database["public"]["Tables"]["faculties"]["Update"];

export interface FacultyWithDepartments extends Faculty {
  departments: DepartmentSummary[];
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
}
