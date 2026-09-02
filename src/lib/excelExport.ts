import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AsignacionGenerada, CATEGORIA_LABEL, CATEGORIA_ORDEN } from './types'
import { formatFechaLarga } from './dateUtils'
import { compararHorarios } from './motor'

const NEGRO = 'FF000000'

export type Orientacion = 'portrait' | 'landscape'

function agruparPorSemana(fechas: string[]): string[][] {
  const ordenadas = [...fechas].sort()
  const semanas: string[][] = []
  let semanaActual: string[] = []
  for (const fecha of ordenadas) {
    const dow = new Date(fecha + 'T00:00:00').getDay()
    if (dow === 1 && semanaActual.length > 0) {
      semanas.push(semanaActual)
      semanaActual = []
    }
    semanaActual.push(fecha)
  }
  if (semanaActual.length > 0) semanas.push(semanaActual)
  return semanas
}

/**
 * Diseño en bloques: cada día es un título grande (sin repetirse en cada
 * fila), cada horario aparece una sola vez, y dentro de él una sola celda
 * junta MENÚ y OFFICE con sus nombres separados por "·" — así se evita
 * repetir día/horario/servicio y entra la semana completa en una A4.
 * Vertical (portrait) aprovecha mejor el espacio acá porque el contenido
 * tiene muchas filas (bloques de horario) y pocas columnas anchas.
 */
function agregarHojaSemana(
  wb: ExcelJS.Workbook,
  nombreHoja: string,
  titulo: string,
  fechaInicio: string,
  fechaFin: string,
  asignaciones: AsignacionGenerada[],
  orientacion: Orientacion
) {
  const dias = Array.from(new Set(asignaciones.map((a) => a.fecha))).sort()

  const ws = wb.addWorksheet(nombreHoja, {
    pageSetup: {
      orientation: orientacion,
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.35, bottom: 0.35, header: 0.2, footer: 0.2 },
    },
  })

  ws.views = [{ showGridLines: false }]

  const anchoContenido = orientacion === 'portrait' ? 62 : 95
  ws.columns = [{ width: 15 }, { width: anchoContenido }]

  ws.mergeCells('A1:B1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: NEGRO } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 22

  ws.mergeCells('A2:B2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } }
  ws.getRow(2).height = 14

  ws.addRow([])

  for (const fecha of dias) {
    const delDia = asignaciones.filter((a) => a.fecha === fecha)
    const horarios = Array.from(new Set(delDia.map((a) => a.horarioTexto))).sort(compararHorarios)

    // --- Título del día: una sola fila grande, sin repetirse abajo ---
    const filaDia = ws.addRow([formatFechaLarga(fecha).toUpperCase(), ''])
    ws.mergeCells(`A${filaDia.number}:B${filaDia.number}`)
    const celdaDia = ws.getCell(`A${filaDia.number}`)
    celdaDia.font = { size: 12, bold: true, color: { argb: NEGRO } }
    celdaDia.alignment = { vertical: 'middle', horizontal: 'left' }
    celdaDia.border = { bottom: { style: 'medium', color: { argb: NEGRO } } }
    filaDia.height = 18

    // --- Un bloque por horario: MENÚ y OFFICE juntos en una sola celda ---
    for (const horario of horarios) {
      const lineas: string[] = []
      for (const categoria of CATEGORIA_ORDEN) {
        const nombres = delDia
          .filter((a) => a.horarioTexto === horario && a.categoria === categoria)
          .map((a) => a.nombre)
        if (nombres.length > 0) {
          lineas.push(`${CATEGORIA_LABEL[categoria].toUpperCase()}: ${nombres.join(' · ')}`)
        }
      }

      const row = ws.addRow([horario, lineas.join('\n')])
      row.height = 12 * Math.max(1, lineas.length) + 6

      const celdaHorario = row.getCell(1)
      celdaHorario.font = { size: 9, bold: true, color: { argb: NEGRO } }
      celdaHorario.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      celdaHorario.border = { bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } } }

      const celdaContenido = row.getCell(2)
      celdaContenido.font = { size: 9, color: { argb: NEGRO } }
      celdaContenido.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      celdaContenido.border = { bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } } }
    }

    ws.addRow([]).height = 4 // espacio chico entre días
  }

  ws.pageSetup.printArea = `A1:B${ws.rowCount}`
  ws.pageSetup.horizontalCentered = true
}

/** Exporta una sola semana en una sola hoja de Excel, lista para imprimir en 1 A4. */
export async function exportarExcelSemanal(
  asignaciones: AsignacionGenerada[],
  titulo: string,
  fechaInicio: string,
  fechaFin: string,
  orientacion: Orientacion = 'portrait'
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Organización de Alimentos'
  wb.created = new Date()

  agregarHojaSemana(wb, 'Organización de Alimentos', titulo, fechaInicio, fechaFin, asignaciones, orientacion)

  const buffer = await wb.xlsx.writeBuffer()
  const nombreArchivo = `organizacion-alimentos_${fechaInicio}_${fechaFin}.xlsx`
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), nombreArchivo)
}

/** Exporta el mes con UNA HOJA POR SEMANA — cada una lista para imprimir en su propio A4. */
export async function exportarExcelMensual(
  asignaciones: AsignacionGenerada[],
  titulo: string,
  fechaInicio: string,
  fechaFin: string,
  orientacion: Orientacion = 'portrait'
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Organización de Alimentos'
  wb.created = new Date()

  const fechas = Array.from(new Set(asignaciones.map((a) => a.fecha)))
  const semanas = agruparPorSemana(fechas)

  semanas.forEach((fechasSemana, i) => {
    const asignacionesSemana = asignaciones.filter((a) => fechasSemana.includes(a.fecha))
    agregarHojaSemana(
      wb,
      `Semana ${i + 1}`,
      `${titulo} — Semana ${i + 1}`,
      fechasSemana[0],
      fechasSemana[fechasSemana.length - 1],
      asignacionesSemana,
      orientacion
    )
  })

  const buffer = await wb.xlsx.writeBuffer()
  const nombreArchivo = `organizacion-alimentos-mensual_${fechaInicio}_${fechaFin}.xlsx`
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), nombreArchivo)
}
