import ExcelJS from "exceljs";

import type { NormalizedExportDataset } from "@/features/exports/export.types";

export async function generateExcelExport(
  dataset: NormalizedExportDataset
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Student Enrollment System";
  workbook.created = new Date(dataset.metadata.createdAt);

  const sheet = workbook.addWorksheet("Student Enrollment", {
    pageSetup: {
      orientation: dataset.metadata.orientation,
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  const columnCount = dataset.fields.length;
  const subtitleLines = dataset.metadata.subtitle
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  sheet.mergeCells(1, 1, 1, columnCount);
  sheet.getCell(1, 1).value = dataset.metadata.title;
  sheet.getCell(1, 1).font = { bold: true, size: 16 };

  subtitleLines.forEach((line, index) => {
    const rowNumber = index + 2;
    sheet.mergeCells(rowNumber, 1, rowNumber, columnCount);
    const cell = sheet.getCell(rowNumber, 1);
    cell.value = line;
    cell.font = { italic: true, size: 10 };
    cell.alignment = {
      wrapText: true,
      vertical: "middle",
      horizontal: "center",
    };
  });

  sheet.addRow([]);
  const headerRow = sheet.addRow(dataset.fields.map((field) => field.label));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF263238" },
  };
  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: columnCount },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

  for (const [index, field] of dataset.fields.entries()) {
    sheet.getColumn(index + 1).width = Math.min(
      36,
      Math.max(14, field.label.length + 4)
    );
  }
  for (const row of dataset.rows) {
    sheet.addRow(row);
  }

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
