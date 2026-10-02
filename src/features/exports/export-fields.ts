import type { StudentWithRelations } from "@/types/student";
import type {
  AuthorizedExportScope,
  DatabaseExportFieldId,
  ExportFieldDefinition,
  ExportFieldRequest,
  ExportProfile,
  ExportRequest,
  NormalizedExportDataset,
  ResolvedExportField,
} from "@/features/exports/export.types";

export class ExportPipelineError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ExportPipelineError";
  }
}

export const databaseExportFields: Record<
  DatabaseExportFieldId,
  ExportFieldDefinition
> = {
  lastName: {
    id: "lastName",
    source: "database",
    label: "Surname",
    resolve: (student) => student.last_name.toUpperCase(),
  },
  firstName: {
    id: "firstName",
    source: "database",
    label: "First Name",
    resolve: (student) => student.first_name,
  },
  otherName: {
    id: "otherName",
    source: "database",
    label: "Other Name",
    resolve: (student) => student.other_name ?? "",
  },
  phoneNumber: {
    id: "phoneNumber",
    source: "database",
    label: "Phone Number",
    resolve: (student) => student.phone_number,
  },
  registrationNumber: {
    id: "registrationNumber",
    source: "database",
    label: "Registration Number",
    resolve: (student) => student.registration_number,
  },
  faculty: {
    id: "faculty",
    source: "database",
    label: "Faculty",
    resolve: (student) => student.faculty.name,
  },
  department: {
    id: "department",
    source: "database",
    label: "Department",
    resolve: (student) => student.department.name,
  },
  admissionType: {
    id: "admissionType",
    source: "database",
    label: "Admission Type",
    resolve: (student) => student.admission_type,
  },
};

export const defaultExportFieldRequests: ExportFieldRequest[] = [
  { source: "database", id: "lastName" },
  { source: "database", id: "firstName" },
  { source: "database", id: "otherName" },
  { source: "database", id: "phoneNumber" },
  { source: "database", id: "registrationNumber" },
  { source: "database", id: "faculty" },
  { source: "database", id: "department" },
  { source: "database", id: "admissionType" },
];

export function authorizeExportScope(
  profile: Pick<ExportProfile, "role" | "faculty_id">,
  request: Pick<ExportRequest, "scope" | "faculty_id" | "department_id">
): AuthorizedExportScope | null {
  if (profile.role === "FACULTY_ADMIN") {
    if (!profile.faculty_id || request.scope === "all") return null;
    if (request.scope === "faculty") {
      return { kind: "faculty", facultyId: profile.faculty_id };
    }
    if (!request.department_id) return null;
    return {
      kind: "department",
      departmentId: request.department_id,
      facultyId: profile.faculty_id,
    };
  }

  if (request.scope === "all") return { kind: "all" };
  if (request.scope === "faculty" && request.faculty_id) {
    return { kind: "faculty", facultyId: request.faculty_id };
  }
  if (request.scope === "department" && request.department_id) {
    return {
      kind: "department",
      departmentId: request.department_id,
      facultyId: request.faculty_id ?? "",
    };
  }
  return null;
}

export function resolveExportFields(
  requests: ExportFieldRequest[] = defaultExportFieldRequests
): ResolvedExportField[] {
  return requests.map((request) => {
    if (request.source === "export-only") {
      return {
        id: request.id,
        source: "export-only",
        label: request.label.trim(),
      };
    }

    const definition = databaseExportFields[request.id];
    if (!definition) {
      throw new ExportPipelineError("An export field is not allowed.", 400);
    }
    return {
      id: definition.id,
      source: "database",
      label: definition.label,
    };
  });
}

export function normalizeExportDataset(
  students: StudentWithRelations[],
  requests: ExportFieldRequest[] | undefined,
  scope: AuthorizedExportScope,
  format: NormalizedExportDataset["format"],
  metadata: NormalizedExportDataset["metadata"]
): NormalizedExportDataset {
  const fields = resolveExportFields(requests);
  const rows = students.map((student) =>
    fields.map((field) => {
      if (field.source === "export-only") return "";
      return databaseExportFields[field.id as DatabaseExportFieldId].resolve(
        student
      );
    })
  );

  return { format, scope, fields, rows, metadata };
}
