// ═══════════════════════════════════════════════════════════════════════════════
// Excel Service — Lead export to XLSX (migrated from Flask openpyxl)
// Uses exceljs instead of openpyxl
// ═══════════════════════════════════════════════════════════════════════════════

import ExcelJS from "exceljs";
import { promises as fs } from "fs";
import path from "path";
import type { LeadData } from "@/services/leads";
import { getPriority } from "@/services/leads";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_DIR = path.join(DATA_DIR, "leads");

const LEAD_COLS = [
  "Date", "Time", "Reference Number", "Lead Priority",
  "Full Name", "Company Name", "Mobile Number", "Email",
  "State", "City", "Village",
  "Industry", "Machine Type", "Machine Series", "Machine Model",
  "Purchase Timeline", "Remarks",
];

const COL_WIDTHS = [12, 10, 20, 18, 20, 22, 16, 28, 14, 14, 16, 22, 14, 22, 20, 20, 35];

const PRIORITY_COLORS: Record<string, string> = {
  "HOT LEAD": "FFFF0000",
  "HIGH PRIORITY": "FFFF6600",
  "MEDIUM PRIORITY": "FFFFA500",
  "LOW PRIORITY": "FF2196F3",
  "FUTURE OPPORTUNITY": "FF9C27B0",
  UNCLASSIFIED: "FF666666",
};

function createWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Leads");

  // Header row
  const headerRow = ws.addRow(LEAD_COLS);
  headerRow.height = 22;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003087" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  });

  // Column widths
  LEAD_COLS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  ws.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  return wb;
}

export async function appendToExcel(data: LeadData): Promise<void> {
  await fs.mkdir(LEADS_DIR, { recursive: true });

  const now = new Date();
  const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}`;
  const filePath = path.join(LEADS_DIR, `Leads_${dateStr}.xlsx`);

  const priority = getPriority(data.purchase_timeline || "");
  let ts: Date;
  try {
    ts = new Date(data.timestamp || now.toISOString());
  } catch {
    ts = now;
  }

  const rowValues = [
    ts.toISOString().split("T")[0],
    ts.toTimeString().split(" ")[0],
    data.reference_number || "",
    priority,
    data.name || "",
    data.company || "",
    data.phone || "",
    data.email || "",
    data.state || "",
    data.city || "",
    data.village || "",
    data.industry || "",
    data.machine_category || "",
    data.series || "",
    data.model_label || data.model || "",
    data.purchase_timeline || "",
    data.remarks || "",
  ];

  let wb: ExcelJS.Workbook;
  try {
    await fs.access(filePath);
    wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
  } catch {
    wb = createWorkbook();
  }

  const ws = wb.getWorksheet("Leads") || wb.addWorksheet("Leads");
  const rowNum = ws.rowCount + 1;
  const row = ws.addRow(rowValues);
  const isAlt = rowNum % 2 === 0;

  row.eachCell((cell, colNumber) => {
    cell.alignment = { vertical: "middle" };
    if (isAlt) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF3FB" } };
    }
    // Priority cell styling
    if (colNumber === 4) {
      const color = PRIORITY_COLORS[String(cell.value)] || "FF666666";
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  await wb.xlsx.writeFile(filePath);
}

export async function exportAllLeadsToExcel(records: LeadData[]): Promise<Buffer> {
  const wb = createWorkbook();
  const ws = wb.getWorksheet("Leads")!;

  for (let ri = 0; ri < records.length; ri++) {
    const data = records[ri];
    let ts: Date;
    try {
      ts = new Date(data.timestamp || "");
    } catch {
      ts = new Date();
    }

    const priority = data.lead_priority || getPriority(data.purchase_timeline || "");
    const rowValues = [
      ts.toISOString().split("T")[0],
      ts.toTimeString().split(" ")[0],
      data.reference_number || "",
      priority,
      data.name || "",
      data.company || "",
      data.phone || "",
      data.email || "",
      data.state || "",
      data.city || "",
      data.village || "",
      data.industry || "",
      data.machine_category || "",
      data.series || "",
      data.model_label || data.model || "",
      data.purchase_timeline || "",
      data.remarks || "",
    ];

    const row = ws.addRow(rowValues);
    const rowNum = ri + 2;
    const isAlt = rowNum % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: "middle" };
      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF3FB" } };
      }
      if (colNumber === 4) {
        const color = PRIORITY_COLORS[String(cell.value)] || "FF666666";
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
