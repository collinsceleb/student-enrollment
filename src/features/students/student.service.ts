import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  Student,
  StudentInsert,
  StudentUpdate,
  StudentWithRelations,
  AdmissionType,
} from "@/types/student";

export class FacultyDepartmentMismatchError extends Error {
  constructor(
    public readonly facultyId: string,
    public readonly departmentId: string
  ) {
    super(
      `Invalid enrollment: department "${departmentId}" does not belong to faculty "${facultyId}".`
    );
    this.name = "FacultyDepartmentMismatchError";
  }
}

export class DepartmentNotFoundError extends Error {
  constructor(public readonly departmentId: string) {
    super(`Department with ID "${departmentId}" was not found.`);
    this.name = "DepartmentNotFoundError";
  }
}

export interface StudentFilterParams {
  facultyId: string;
  departmentId?: string;
  admissionType?: AdmissionType;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentListQueryOptions {
  facultyId: string;
  departmentId?: string;
  admissionType?: AdmissionType;
  searchQuery: string;
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

export function buildStudentListQueryOptions(
  params: StudentFilterParams
): StudentListQueryOptions {
  const normalizedPage = Math.max(
    1,
    Number.parseInt(String(params.page ?? 1), 10) || 1
  );
  const normalizedPageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(String(params.pageSize ?? 20), 10) || 20)
  );
  const normalizedSearchQuery = params.searchQuery?.trim() ?? "";

  return {
    facultyId: params.facultyId,
    departmentId: params.departmentId,
    admissionType: params.admissionType,
    searchQuery: normalizedSearchQuery,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    offset: (normalizedPage - 1) * normalizedPageSize,
    limit: normalizedPageSize,
  };
}

/**
 * Phase 4 Database Integrity Verification:
 * Explicitly verifies on the server that department.faculty_id === submitted faculty_id
 * before creating or updating any student enrollment record.
 */
export async function verifyFacultyDepartmentMatch(
  supabase: SupabaseClient<Database>,
  facultyId: string,
  departmentId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: department, error } = await supabase
    .from("departments")
    .select("id, faculty_id")
    .eq("id", departmentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify department: ${error.message}`);
  }

  if (!department) {
    throw new DepartmentNotFoundError(departmentId);
  }

  if (department.faculty_id !== facultyId) {
    return {
      valid: false,
      error: `Department "${departmentId}" belongs to faculty "${department.faculty_id}", not submitted faculty "${facultyId}".`,
    };
  }

  return { valid: true };
}

/**
 * Insert a new student record with mandatory server-side integrity check
 */
export async function createStudent(
  supabase: SupabaseClient<Database>,
  studentData: StudentInsert
): Promise<Student> {
  // 1. Mandatory server-side integrity check (department.faculty_id === submitted faculty_id)
  const integrity = await verifyFacultyDepartmentMatch(
    supabase,
    studentData.faculty_id,
    studentData.department_id
  );

  if (!integrity.valid) {
    throw new FacultyDepartmentMismatchError(
      studentData.faculty_id,
      studentData.department_id
    );
  }

  // 2. Perform database insert
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
    if (error.code === "23514" || error.code === "23503") {
      // Postgres constraint or trigger violation (integrity defense in depth)
      throw new FacultyDepartmentMismatchError(
        studentData.faculty_id,
        studentData.department_id
      );
    }
    throw new Error(`Failed to create student enrollment: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing student record with mandatory integrity check if faculty/department changed
 */
export async function updateStudent(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: StudentUpdate
): Promise<Student> {
  // If either faculty_id or department_id is being updated, verify integrity
  if (updates.faculty_id || updates.department_id) {
    // Fetch current record to get the other half of the pair if only one is updated
    const { data: current, error: fetchErr } = await supabase
      .from("students")
      .select("faculty_id, department_id")
      .eq("id", id)
      .single();

    if (fetchErr || !current) {
      throw new Error(`Student record "${id}" not found.`);
    }

    const targetFacultyId = updates.faculty_id ?? current.faculty_id;
    const targetDeptId = updates.department_id ?? current.department_id;

    const integrity = await verifyFacultyDepartmentMatch(
      supabase,
      targetFacultyId,
      targetDeptId
    );

    if (!integrity.valid) {
      throw new FacultyDepartmentMismatchError(targetFacultyId, targetDeptId);
    }
  }

  const payload = {
    ...updates,
    ...(updates.registration_number
      ? {
          registration_number: updates.registration_number.toUpperCase().trim(),
        }
      : {}),
  };

  const { data, error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `Registration number "${updates.registration_number}" is already used.`
      );
    }
    if (error.code === "23514" || error.code === "23503") {
      throw new FacultyDepartmentMismatchError(
        updates.faculty_id || "",
        updates.department_id || ""
      );
    }
    throw new Error(`Failed to update student: ${error.message}`);
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
      department:departments!students_department_id_fkey (*)
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
  const queryOptions = buildStudentListQueryOptions(params);

  let query = supabase
    .from("students")
    .select(
      `
      *,
      faculty:faculties (*),
      department:departments!students_department_id_fkey (*)
    `
    )
    .eq("faculty_id", queryOptions.facultyId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(queryOptions.offset, queryOptions.offset + queryOptions.limit - 1);

  if (queryOptions.departmentId) {
    query = query.eq("department_id", queryOptions.departmentId);
  }

  if (queryOptions.admissionType) {
    query = query.eq("admission_type", queryOptions.admissionType);
  }

  if (queryOptions.searchQuery.length > 0) {
    const term = `%${queryOptions.searchQuery}%`;
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

export async function getStudentsByFacultyPage(
  supabase: SupabaseClient<Database>,
  params: StudentFilterParams
): Promise<{
  items: StudentWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const queryOptions = buildStudentListQueryOptions(params);

  let query = supabase
    .from("students")
    .select(
      `
      *,
      faculty:faculties (*),
      department:departments!students_department_id_fkey (*)
    `,
      { count: "exact" }
    )
    .eq("faculty_id", queryOptions.facultyId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(queryOptions.offset, queryOptions.offset + queryOptions.limit - 1);

  if (queryOptions.departmentId) {
    query = query.eq("department_id", queryOptions.departmentId);
  }

  if (queryOptions.admissionType) {
    query = query.eq("admission_type", queryOptions.admissionType);
  }

  if (queryOptions.searchQuery.length > 0) {
    const term = `%${queryOptions.searchQuery}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},other_name.ilike.${term},registration_number.ilike.${term}`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch faculty students: ${error.message}`);
  }

  const totalCount = count ?? data?.length ?? 0;
  const pageSize = queryOptions.pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: (data ?? []) as unknown as StudentWithRelations[],
    totalCount,
    page: queryOptions.page,
    pageSize,
    totalPages,
  };
}
