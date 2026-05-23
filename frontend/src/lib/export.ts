import * as XLSX from 'xlsx'

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

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 20)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 28)

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: data,
    styles: {
      font: 'helvetica',
      fontSize: 9,
    },
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { top: 34, left: 14, right: 14 },
  })

  doc.save(`${filename}.pdf`)
}
