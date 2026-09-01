import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AsignacionGenerada, CATEGORIA_LABEL, CATEGORIA_ORDEN } from './types'
import { formatFechaLarga } from './dateUtils'
import { compararHorarios } from './motor'

const NEGRO = 'FF000000'
const GRIS_CLARO = 'FFF2F2F2'

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
      orientation: 'portrait',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  })

  ws.views = [{ showGridLines: false }]

  ws.mergeCells('A1:D1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: NEGRO } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 22

  ws.mergeCells('A2:D2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } }
  ws.getRow(2).height = 14

  ws.addRow([])

  ws.columns = [{ width: 12 }, { width: 13 }, { width: 11 }, { width: 42 }]

  const headerRow = ws.addRow(['DÍA', 'HORARIO', 'SERVICIO', 'PERSONAL'])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder()
  })
  headerRow.height = 16

  let alternar = false
  for (const fecha of dias) {
    const delDia = asignaciones.filter((a) => a.fecha === fecha)
    const horarios = Array.from(new Set(delDia.map((a) => a.horarioTexto))).sort(compararHorarios)
    alternar = !alternar

    const filaInicioDia = ws.rowCount + 1
    let primeraFilaDelDia = true

    for (const horario of horarios) {
      const filaInicioHorario = ws.rowCount + 1
      let primeraFilaDelHorario = true

      for (const categoria of CATEGORIA_ORDEN) {
        const deEsteGrupo = delDia.filter((a) => a.horarioTexto === horario && a.categoria === categoria)
        if (deEsteGrupo.length === 0) continue

        const personal = deEsteGrupo.map((a) => a.nombre).join(', ')

        const row = ws.addRow([
          primeraFilaDelDia ? formatFechaLarga(fecha).toUpperCase() : '',
          primeraFilaDelHorario ? horario : '',
          CATEGORIA_LABEL[categoria],
          personal,
        ])
        row.height = 14

        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder()
          cell.alignment = { vertical: 'middle', horizontal: colNumber <= 3 ? 'center' : 'left', wrapText: true }
          cell.font = { size: 8, bold: colNumber <= 2, color: { argb: NEGRO } }
          if (alternar) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CLARO } }
        })

        primeraFilaDelDia = false
        primeraFilaDelHorario = false
      }

      if (ws.rowCount > filaInicioHorario) {
        ws.mergeCells(`B${filaInicioHorario}:B${ws.rowCount}`)
        ws.getCell(`B${filaInicioHorario}`).alignment = { vertical: 'middle', horizontal: 'center' }
      }
    }

    if (ws.rowCount > filaInicioDia) {
      ws.mergeCells(`A${filaInicioDia}:A${ws.rowCount}`)
      ws.getCell(`A${filaInicioDia}`).alignment = { vertical: 'middle', horizontal: 'center' }
    }
  }

  ws.pageSetup.printArea = `A1:D${ws.rowCount}`
  ws.pageSetup.horizontalCentered = true

  const buffer = await wb.xlsx.writeBuffer()
  const nombreArchivo = `organizacion-alimentos_${fechaInicio}_${fechaFin}.xlsx`
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), nombreArchivo)
}

function thinBorder() {
  const style = { style: 'thin' as const, color: { argb: 'FFBBBBBB' } }
  return { top: style, left: style, bottom: style, right: style }
}
