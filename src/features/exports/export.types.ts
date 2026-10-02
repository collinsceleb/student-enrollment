import type { AdmissionType, StudentWithRelations } from "@/types/student";

export type ExportFormat = "xlsx" | "docx" | "pdf";
export type ExportScopeKind = "department" | "faculty" | "all";
export type ExportOrientation = "portrait" | "landscape";

export type DatabaseExportFieldId =
  | "lastName"
  | "firstName"
  | "otherName"
  | "phoneNumber"
  | "registrationNumber"
  | "faculty"
  | "department"
  | "admissionType";

export type ExportFieldRequest =
  | { source: "database"; id: DatabaseExportFieldId }
  | { source: "export-only"; id: string; label: string };

export type ExportFieldDefinition = {
  id: DatabaseExportFieldId;
  source: "database";
  label: string;
  resolve: (student: StudentWithRelations) => string;
};

export type ResolvedExportField = {
  id: string;
  source: "database" | "export-only";
  label: string;
};

export type AuthorizedExportScope =
  | { kind: "department"; departmentId: string; facultyId?: string }
  | { kind: "faculty"; facultyId: string }
  | { kind: "all" };

export type ExportRequest = {
  format: ExportFormat;
  scope: ExportScopeKind;
  faculty_id?: string;
  department_id?: string;
  fields?: ExportFieldRequest[];
};

export type ExportProfile = {
  role: "SUPER_ADMIN" | "FACULTY_ADMIN";
  faculty_id: string | null;
  has_changed_password: boolean;
  session_is_current: boolean;
};

export interface NormalizedExportDataset {
  format: ExportFormat;
  scope: AuthorizedExportScope;
  fields: ResolvedExportField[];
  rows: string[][];
  metadata: {
    title: string;
    subtitle: string;
    orientation: ExportOrientation;
    createdAt: string;
  };
}

export type ExportValueStudent = StudentWithRelations & {
  admission_type: AdmissionType;
};
