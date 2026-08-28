import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { Asignacion, SECTOR_LABEL, Sector } from './types'
import { formatFechaLarga } from './dateUtils'

const SECTOR_FILL: Record<Sector, string> = {
  cocina: 'FFF8E0CC',
  office: 'FFD3E4E1',
  menu: 'FFDFD4E8',
}
const SECTOR_FONT: Record<Sector, string> = {
  cocina: 'FFB8641E',
  office: 'FF316A61',
  menu: 'FF664988',
}
const HEADER_FILL = 'FF231F1A'

export async function exportarExcel(
  asignaciones: Asignacion[],
  titulo: string,
  fechaInicio: string,
  fechaFin: string
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Organización de Alimentos'
  wb.created = new Date()

  const dias = Array.from(new Set(asignaciones.map((a) => a.fecha).filter(Boolean))).sort() as string[]

  const ws = wb.addWorksheet('Organización de Alimentos', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  })

  ws.views = [{ showGridLines: false }]

  // Título
  ws.mergeCells('A1:F1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:F2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Semana del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF7A7367' } }
  ws.getRow(2).height = 20

  ws.addRow([])

  ws.columns = [
    { width: 16 }, // Día
    { width: 14 }, // Horario
    { width: 26 }, // Cocina
    { width: 26 }, // Office
    { width: 26 }, // Menú
  ]

  const headerRow = ws.addRow(['DÍA', 'HORARIO', 'COCINA', 'OFFICE', 'MENÚ'])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder()
  })
  headerRow.height = 22

  for (const fecha of dias) {
    const delDia = asignaciones.filter((a) => a.fecha === fecha)
    const horarios = Array.from(new Set(delDia.map((a) => a.horario ?? '(sin horario)'))).sort()

    let primeraFilaDelDia = true
    for (const horario of horarios) {
      const porSector: Record<Sector, string[]> = { cocina: [], office: [], menu: [] }
      delDia
        .filter((a) => (a.horario ?? '(sin horario)') === horario)
        .forEach((a) => {
          if (a.sector) porSector[a.sector].push(a.nombre)
        })

      const row = ws.addRow([
        primeraFilaDelDia ? formatFechaLarga(fecha).toUpperCase() : '',
        horario,
        porSector.cocina.join(' · '),
        porSector.office.join(' · '),
        porSector.menu.join(' · '),
      ])
      row.height = 20

      row.eachCell((cell, colNumber) => {
        cell.border = thinBorder()
        cell.alignment = { vertical: 'middle', horizontal: colNumber <= 2 ? 'center' : 'left', wrapText: true }
        if (colNumber === 1) {
          cell.font = { bold: true, size: 11 }
        }
        if (colNumber === 3) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTOR_FILL.cocina } }
          cell.font = { color: { argb: SECTOR_FONT.cocina }, bold: true, size: 10 }
        }
        if (colNumber === 4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTOR_FILL.office } }
          cell.font = { color: { argb: SECTOR_FONT.office }, bold: true, size: 10 }
        }
        if (colNumber === 5) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTOR_FILL.menu } }
          cell.font = { color: { argb: SECTOR_FONT.menu }, bold: true, size: 10 }
        }
      })

      primeraFilaDelDia = false
    }
  }

  ws.pageSetup.printArea = `A1:E${ws.rowCount}`
  ws.pageSetup.horizontalCentered = true

  const buffer = await wb.xlsx.writeBuffer()
  const nombreArchivo = `organizacion-alimentos_${fechaInicio}_${fechaFin}.xlsx`
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), nombreArchivo)
}

function thinBorder() {
  const style = { style: 'thin' as const, color: { argb: 'FFE7E5DE' } }
  return { top: style, left: style, bottom: style, right: style }
}
