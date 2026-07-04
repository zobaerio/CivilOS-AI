import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';

export function downloadAsExcel(data: object[], sheetName: string, fileName: string) {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function downloadAsCSV(data: object[], fileName: string) {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}.csv`);
}

export function downloadAsPDF(data: object[], fileName: string, title: string) {
  if (!data || data.length === 0) return;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => Object.values(row as Record<string, unknown>).map((v) => String(v ?? '')));
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  doc.save(`${fileName}.pdf`);
}

export async function downloadAsWord(data: object[], fileName: string, title: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const colWidth = Math.floor(9000 / headers.length);

  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          width: { size: colWidth, type: WidthType.DXA },
        })
    ),
  });

  const dataRows = data.map(
    (row) =>
      new TableRow({
        children: Object.values(row as Record<string, unknown>).map(
          (val) =>
            new TableCell({
              children: [new Paragraph(String(val ?? ''))],
              width: { size: colWidth, type: WidthType.DXA },
            })
        ),
      })
  );

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 9000, type: WidthType.DXA },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })] }),
          new Paragraph(''),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
}

export function openInGoogleSheets(data: object[], fileName: string) {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setTimeout(() => window.open('https://sheets.new', '_blank'), 800);
}
