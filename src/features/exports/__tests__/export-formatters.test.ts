import { describe, expect, it } from "vitest";

import { generateExcelExport } from "@/features/exports/excel.exporter";
import { generatePdfExport } from "@/features/exports/pdf.exporter";
import { generateWordExport } from "@/features/exports/word.exporter";
import type { NormalizedExportDataset } from "@/features/exports/export.types";

function dataset(
  format: NormalizedExportDataset["format"]
): NormalizedExportDataset {
  return {
    format,
    scope: { kind: "faculty", facultyId: "faculty-1" },
    fields: [
      { id: "lastName", source: "database", label: "Surname" },
      { id: "custom_remarks", source: "export-only", label: "Remarks" },
    ],
    rows: [["MENSAH", ""]],
    metadata: {
      title: "Faculty of Science Student Enrollment Records",
      subtitle: "1 student record",
      orientation: "portrait",
      createdAt: "2026-09-27T00:00:00.000Z",
    },
  };
}

describe("export format adapters", () => {
  it("generates Excel, Word, and PDF from the same dataset", async () => {
    const excel = await generateExcelExport(dataset("xlsx"));
    const word = await generateWordExport(dataset("docx"));
    const pdf = await generatePdfExport(dataset("pdf"));

    expect(Buffer.from(excel).subarray(0, 2).toString()).toBe("PK");
    expect(Buffer.from(word).subarray(0, 2).toString()).toBe("PK");
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
  });
});
