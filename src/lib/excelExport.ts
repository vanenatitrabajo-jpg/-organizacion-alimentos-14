import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AsignacionGenerada, CATEGORIA_COLOR_CLASSES, CATEGORIA_LABEL, CATEGORIA_ORDEN } from './types'
import { formatFechaLarga } from './dateUtils'
import { compararHorarios } from './motor'

const HEADER_FILL = 'FF231F1A'

export async function exportarExcel(
  asignaciones: AsignacionGenerada[],
  titulo: string,
  fechaInicio: string,
  fechaFin: string
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Organización de Alimentos'
  wb.created = new Date()

  const dias = Array.from(new Set(asignaciones.map((a) => a.fecha))).sort()

  const ws = wb.addWorksheet('Organización de Alimentos', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  })

  ws.views = [{ showGridLines: false }]

  ws.mergeCells('A1:D1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:D2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF7A7367' } }
  ws.getRow(2).height = 20

  ws.addRow([])

  ws.columns = [{ width: 16 }, { width: 16 }, { width: 12 }, { width: 55 }]

  const headerRow = ws.addRow(['DÍA', 'HORARIO', 'SERVICIO', 'PERSONAL'])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
