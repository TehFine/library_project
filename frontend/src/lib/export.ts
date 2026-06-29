import * as XLSX from 'xlsx'
import {
  NOTO_SANS_REGULAR_BASE64,
  NOTO_SANS_BOLD_BASE64,
} from './font-base64'

// Dynamic import for PDF to avoid SSR issues
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportToPDF(
  headers: string[],
  data: (string | number)[][],
  title: string,
  filename: string
) {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  // Register Vietnamese-supporting fonts (embedded as base64)
  doc.addFileToVFS('NotoSans-Regular.ttf', NOTO_SANS_REGULAR_BASE64)
  doc.addFileToVFS('NotoSans-Bold.ttf', NOTO_SANS_BOLD_BASE64)
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')

  // Title
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, 20)

  // Date line
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 28)

  // Table
  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: data,
    styles: {
      font: 'NotoSans',
      fontSize: 9,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: {
      font: 'NotoSans',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 34, left: 14, right: 14 },
  })

  doc.save(`${filename}.pdf`)
}
