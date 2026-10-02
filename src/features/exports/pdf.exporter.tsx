import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { createElement } from "react";

import type { NormalizedExportDataset } from "@/features/exports/export.types";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 16,
  },
  table: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#64748b",
  },
  row: {
    flexDirection: "row",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
  },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#64748b",
    paddingVertical: 5,
    paddingHorizontal: 3,
    minHeight: 20,
  },
  header: {
    fontWeight: 700,
  },
});

export async function generatePdfExport(
  dataset: NormalizedExportDataset
): Promise<Uint8Array> {
  const width = `${100 / dataset.fields.length}%` as `${number}%`;
  const pdfDocument = createElement(
    Document,
    null,
    createElement(
      Page,
      {
        size: "A4",
        orientation: dataset.metadata.orientation,
        style: styles.page,
      },
      createElement(Text, { style: styles.title }, dataset.metadata.title),
      ...dataset.metadata.subtitle
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) =>
          createElement(Text, { key: line, style: styles.subtitle }, line)
        ),
      createElement(
        View,
        { style: styles.table },
        createElement(
          View,
          { style: styles.headerRow, fixed: true },
          ...dataset.fields.map((field) =>
            createElement(
              View,
              { key: field.id, style: [styles.cell, { width }] },
              createElement(Text, { style: styles.header }, field.label)
            )
          )
        ),
        ...dataset.rows.map((row, rowIndex) =>
          createElement(
            View,
            { key: `row-${rowIndex}`, style: styles.row, wrap: false },
            ...row.map((value, columnIndex) =>
              createElement(
                View,
                {
                  key: dataset.fields[columnIndex].id,
                  style: [styles.cell, { width }],
                },
                createElement(Text, null, value)
              )
            )
          )
        )
      )
    )
  );

  return new Uint8Array(await renderToBuffer(pdfDocument));
}
