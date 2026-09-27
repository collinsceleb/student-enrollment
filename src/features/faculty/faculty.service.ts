import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Faculty, FacultyWithDepartments } from "@/types/faculty";
import type { StudentWithRelations, AdmissionType } from "@/types/student";

export interface FacultyDashboardSummary {
  totalStudents: number;
  jambiteCount: number;
  directEntryCount: number;
  departmentBreakdown: Array<{
    departmentName: string;
    total: number;
  }>;
}

export function buildFacultyDashboardSummary(
  students: StudentWithRelations[]
): FacultyDashboardSummary {
  const departmentTotals = new Map<string, number>();

  const summary = students.reduce(
    (accumulator, student) => {
      const departmentName = student.department.name;
      departmentTotals.set(
        departmentName,
        (departmentTotals.get(departmentName) ?? 0) + 1
      );

      if (student.admission_type === "JAMBITE") {
        accumulator.jambiteCount += 1;
      }

      if (student.admission_type === "DIRECT_ENTRY") {
        accumulator.directEntryCount += 1;
      }

      accumulator.totalStudents += 1;
      return accumulator;
    },
    {
      totalStudents: 0,
      jambiteCount: 0,
      directEntryCount: 0,
    }
  );

  return {
    ...summary,
    departmentBreakdown: Array.from(departmentTotals.entries())
      .map(([departmentName, total]) => ({ departmentName, total }))
      .sort(
        (a, b) =>
          b.total - a.total || a.departmentName.localeCompare(b.departmentName)
      ),
  };
}

export function filterStudentsForFacultyDashboard(
  students: StudentWithRelations[],
  filters: {
    search?: string;
    departmentId?: string;
    admissionType?: AdmissionType;
  }
): StudentWithRelations[] {
  const searchTerm = filters.search?.trim().toLowerCase() ?? "";

  return students.filter((student) => {
    const matchesSearch =
      searchTerm.length === 0 ||
      [
        student.first_name,
        student.last_name,
        student.other_name,
        student.registration_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);

    const matchesDepartment =
      !filters.departmentId || student.department_id === filters.departmentId;

    const matchesAdmissionType =
      !filters.admissionType ||
      student.admission_type === filters.admissionType;

    return matchesSearch && matchesDepartment && matchesAdmissionType;
  });
}

export async function getFaculties(
  supabase: SupabaseClient<Database>
): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch faculties: ${error.message}`);
  }

  return data ?? [];
}

export async function getFacultyById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Faculty | null> {
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch faculty by id: ${error.message}`);
  }

  return data;
}

export async function getFacultyWithDepartments(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<FacultyWithDepartments | null> {
  const { data, error } = await supabase
    .from("faculties")
    .select(
      `
      *,
      departments (
        id,
        name,
        code
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(
      `Failed to fetch faculty with departments: ${error.message}`
    );
  }

  return data as unknown as FacultyWithDepartments;
}
