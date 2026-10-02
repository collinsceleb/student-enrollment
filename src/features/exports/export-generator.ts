import type {
  ExportFormat,
  NormalizedExportDataset,
} from "@/features/exports/export.types";
import { generateExcelExport } from "@/features/exports/excel.exporter";
import { generatePdfExport } from "@/features/exports/pdf.exporter";
import { generateWordExport } from "@/features/exports/word.exporter";

export const exportMimeTypes: Record<ExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

export async function generateExportFile(
  dataset: NormalizedExportDataset
): Promise<Uint8Array> {
  switch (dataset.format) {
    case "xlsx":
      return generateExcelExport(dataset);
    case "docx":
      return generateWordExport(dataset);
    case "pdf":
      return generatePdfExport(dataset);
  }
}
