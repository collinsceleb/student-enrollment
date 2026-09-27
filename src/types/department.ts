import type { Database } from "./database.types";
import type { Faculty } from "./faculty";

export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type DepartmentInsert =
  Database["public"]["Tables"]["departments"]["Insert"];
export type DepartmentUpdate =
  Database["public"]["Tables"]["departments"]["Update"];

export interface DepartmentWithFaculty extends Department {
  faculty: Faculty;
}
