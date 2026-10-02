import { z } from "zod";

const databaseFieldSchema = z.object({
  source: z.literal("database"),
  id: z.enum([
    "lastName",
    "firstName",
    "otherName",
    "phoneNumber",
    "registrationNumber",
    "faculty",
    "department",
    "admissionType",
  ]),
});

const exportOnlyFieldSchema = z.object({
  source: z.literal("export-only"),
  id: z.string().regex(/^custom_[a-zA-Z0-9_-]{1,48}$/),
  label: z.string().trim().min(1).max(100),
});

export const exportFieldSchema = z.discriminatedUnion("source", [
  databaseFieldSchema,
  exportOnlyFieldSchema,
]);

export const exportRequestSchema = z
  .object({
    format: z.enum(["xlsx", "docx", "pdf"]),
    scope: z.enum(["department", "faculty", "all"]),
    faculty_id: z.uuid().optional(),
    department_id: z.uuid().optional(),
    title: z.string().trim().min(1).max(160).optional(),
    subtitle: z.string().trim().min(1).max(160).optional(),
    fields: z.array(exportFieldSchema).min(1).max(32).optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.scope === "department" && !request.department_id) {
      context.addIssue({
        code: "custom",
        path: ["department_id"],
        message: "A department ID is required for a department export.",
      });
    }
    if (
      request.scope === "all" &&
      (request.faculty_id || request.department_id)
    ) {
      context.addIssue({
        code: "custom",
        path: ["scope"],
        message: "All-data exports cannot include faculty or department IDs.",
      });
    }

    const fieldIds = request.fields?.map((field) => field.id) ?? [];
    if (new Set(fieldIds).size !== fieldIds.length) {
      context.addIssue({
        code: "custom",
        path: ["fields"],
        message: "Export field identifiers must be unique.",
      });
    }
  });

export type ParsedExportRequest = z.infer<typeof exportRequestSchema>;
