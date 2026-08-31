import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AsignacionGenerada, GRUPO_COLOR_CLASSES, GRUPO_LABEL, GRUPO_ORDEN, Puesto } from './types'
import { formatFechaLarga } from './dateUtils'

const HEADER_FILL = 'FF231F1A'

export async function exportarExcel(
  asignaciones: AsignacionGenerada[],
  puestos: Puesto[],
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
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  })

  ws.views = [{ showGridLines: false }]

  ws.mergeCells('A1:E1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:E2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF7A7367' } }
  ws.getRow(2).height = 20

  ws.addRow([])

  ws.columns = [
    { width: 18 }, // Día
    { width: 30 }, // Mañana
    { width: 30 }, // Office
    { width: 30 }, // Menú
    { width: 30 }, // Noche
  ]

  const headerRow = ws.addRow(['DÍA', ...GRUPO_ORDEN.map((g) => GRUPO_LABEL[g].toUpperCase())])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder()
  })
  headerRow.height = 22

  for (const fecha of dias) {
    const delDia = asignaciones.filter((a) => a.fecha === fecha)

    const textoPorGrupo = GRUPO_ORDEN.map((grupo) => {
      const puestosDelGrupo = puestos.filter((p) => p.grupo === grupo).sort((a, b) => a.sort_order - b.sort_order)
      return puestosDelGrupo
        .map((p) => {
          const asig = delDia.find((a) => a.puestoId === p.id)
          return `${p.nombre}: ${asig ? asig.nombre : '—'}`
        })
        .join('\n')
    })

    const maxPuestosEnUnGrupo = Math.max(
      1,
      ...GRUPO_ORDEN.map((g) => puestos.filter((p) => p.grupo === g).length)
    )
    const row = ws.addRow([formatFechaLarga(fecha).toUpperCase(), ...textoPorGrupo])
    row.height = 15 * maxPuestosEnUnGrupo + 10

    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder()
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left', wrapText: true }
      if (colNumber === 1) {
        cell.font = { bold: true, size: 11 }
      } else {
        const grupo = GRUPO_ORDEN[colNumber - 2]
        const estilo = GRUPO_COLOR_CLASSES[grupo]
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estilo.fill } }
        cell.font = { color: { argb: estilo.font }, bold: true, size: 10 }
      }
    })
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
