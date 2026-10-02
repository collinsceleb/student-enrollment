import ExcelJS from "exceljs";
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

  it("preserves Excel headers and blank custom columns", async () => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await generateExcelExport({
      ...dataset("xlsx"),
      fields: [
        { id: "lastName", source: "database", label: "Surname" },
        { id: "firstName", source: "database", label: "First Name" },
        {
          id: "custom_documentation_status",
          source: "export-only",
          label: "Documentation Status",
        },
        { id: "custom_remarks", source: "export-only", label: "Remarks" },
      ],
      rows: [["MENSAH", "Ama", "", ""]],
      metadata: {
        ...dataset("xlsx").metadata,
        title: "Faculty of Computing",
        subtitle: "2026 Admission Documentation",
        orientation: "landscape",
      },
    });

    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet(1)!;

    expect(sheet.getRow(4).values.slice(1)).toEqual([
      "Surname",
      "First Name",
      "Documentation Status",
      "Remarks",
    ]);
    expect(sheet.getRow(5).values.slice(1)).toEqual(["MENSAH", "Ama", "", ""]);
  });

  it("preserves multi-line subtitles in Excel exports", async () => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await generateExcelExport({
      ...dataset("xlsx"),
      fields: [
        { id: "lastName", source: "database", label: "Surname" },
        { id: "firstName", source: "database", label: "First Name" },
      ],
      rows: [["MENSAH", "Ama"]],
      metadata: {
        ...dataset("xlsx").metadata,
        title: "Faculty of Computing",
        subtitle: "2026 Admission Documentation\nFaculty of Science",
        orientation: "landscape",
      },
    });

    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet(1)!;

    expect(sheet.getCell(2, 1).value).toBe("2026 Admission Documentation");
    expect(sheet.getCell(3, 1).value).toBe("Faculty of Science");
  });

  it("preserves PDF landscape layout and valid document output", async () => {
    const pdf = await generatePdfExport({
      ...dataset("pdf"),
      fields: [
        { id: "lastName", source: "database", label: "Surname" },
        { id: "firstName", source: "database", label: "First Name" },
        {
          id: "custom_documentation_status",
          source: "export-only",
          label: "Documentation Status",
        },
        { id: "custom_remarks", source: "export-only", label: "Remarks" },
      ],
      rows: [["MENSAH", "Ama", "", ""]],
      metadata: {
        ...dataset("pdf").metadata,
        title: "Faculty of Computing",
        subtitle: "2026 Admission Documentation",
        orientation: "landscape",
      },
    });

    const raw = Buffer.from(pdf).toString("latin1");

    expect(raw).toContain("%PDF");
    expect(raw).toContain("/MediaBox [0 0 841.890015 595.280029]");
    expect(raw).toContain("/Type /Page");
    expect(raw).toContain("/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]");
  });
});
