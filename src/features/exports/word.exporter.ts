import {
  AlignmentType,
  Document,
  Paragraph,
  Packer,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { NormalizedExportDataset } from "@/features/exports/export.types";

export async function generateWordExport(
  dataset: NormalizedExportDataset
): Promise<Uint8Array> {
  const columnCount = dataset.fields.length;
  const totalWidth = 9_000;
  const columnWidths = dataset.fields.map(() =>
    Math.floor(totalWidth / columnCount)
  );
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: dataset.fields.map(
        (field, index) =>
          new TableCell({
            width: { size: columnWidths[index], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: field.label, bold: true })],
              }),
            ],
          })
      ),
    }),
    ...dataset.rows.map(
      (row) =>
        new TableRow({
          children: row.map(
            (value, index) =>
              new TableCell({
                width: { size: columnWidths[index], type: WidthType.DXA },
                children: [new Paragraph(value)],
              })
          ),
        })
    ),
  ];

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation:
                dataset.metadata.orientation === "landscape"
                  ? "landscape"
                  : "portrait",
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: dataset.metadata.title,
                bold: true,
                size: 30,
              }),
            ],
          }),
          ...dataset.metadata.subtitle
            .split(/\r?\n/)
            .filter((line) => line.trim().length > 0)
            .map(
              (line) =>
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: line, italics: true })],
                })
            ),
          new Paragraph(""),
          new Table({
            width: { size: totalWidth, type: WidthType.DXA },
            columnWidths,
            rows: tableRows,
          }),
        ],
      },
    ],
  });

  return new Uint8Array(await Packer.toBuffer(document));
}
