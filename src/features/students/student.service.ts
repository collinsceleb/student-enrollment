import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  Student,
  StudentInsert,
  StudentWithRelations,
  AdmissionType,
} from "@/types/student";

export interface StudentFilterParams {
  facultyId: string;
  departmentId?: string;
  admissionType?: AdmissionType;
  searchQuery?: string;
}

/**
 * Insert a new student record
 */
export async function createStudent(
  supabase: SupabaseClient<Database>,
  studentData: StudentInsert
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      ...studentData,
      registration_number: studentData.registration_number.toUpperCase().trim(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Postgres unique violation
      throw new Error(
        `Registration number "${studentData.registration_number}" has already been enrolled.`
      );
    }
    throw new Error(`Failed to create student enrollment: ${error.message}`);
  }

  return data;
}

/**
 * Get student by unique registration number
 */
export async function getStudentByRegistrationNumber(
  supabase: SupabaseClient<Database>,
  registrationNumber: string
): Promise<Student | null> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("registration_number", registrationNumber.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check registration number: ${error.message}`);
  }

  return data;
}

/**
 * Get student by ID with joined faculty and department
 */
export async function getStudentById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<StudentWithRelations | null> {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      faculty:faculties (*),
      department:departments (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch student by id: ${error.message}`);
  }

  return data as unknown as StudentWithRelations;
}

/**
 * Get students for a specific faculty with optional department, admission type, and search filters
 */
export async function getStudentsByFaculty(
  supabase: SupabaseClient<Database>,
  params: StudentFilterParams
): Promise<StudentWithRelations[]> {
  let query = supabase
    .from("students")
    .select(
      `
      *,
      faculty:faculties (*),
      department:departments (*)
    `
    )
    .eq("faculty_id", params.facultyId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (params.departmentId) {
    query = query.eq("department_id", params.departmentId);
  }

  if (params.admissionType) {
    query = query.eq("admission_type", params.admissionType);
  }

  if (params.searchQuery && params.searchQuery.trim().length > 0) {
    const term = `%${params.searchQuery.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},other_name.ilike.${term},registration_number.ilike.${term}`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch faculty students: ${error.message}`);
  }

  return (data ?? []) as unknown as StudentWithRelations[];
}
