import ExcelJS from "exceljs";

import type { ExportDefinition } from "../admin/export-data";

export async function createExcelExport(definition: ExportDefinition) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smartfit.am";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(definition.worksheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = definition.columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? 20,
  }));
  worksheet.addRows(definition.rows);
  worksheet.autoFilter = {
    from: { column: 1, row: 1 },
    to: { column: definition.columns.length, row: 1 },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    fgColor: { argb: "FF1666A8" },
    pattern: "solid",
    type: "pattern",
  };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 22;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "top", wrapText: true };
    }
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
