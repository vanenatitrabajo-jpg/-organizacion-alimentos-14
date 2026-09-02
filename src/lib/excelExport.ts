import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AsignacionGenerada } from './types'
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

function bordeNegro() {
  const linea = { style: 'thin' as const, color: { argb: NEGRO } }
  return { top: linea, left: linea, bottom: linea, right: linea }
}

/** Estima cuántas líneas va a ocupar un texto al ajustarse (wrap) en una columna de cierto ancho. */
function estimarLineas(texto: string, anchoColumna: number): number {
  if (!texto) return 1
  const caracteresPorLinea = Math.max(8, Math.floor(anchoColumna * 1.15))
  return Math.max(1, Math.ceil(texto.length / caracteresPorLinea))
}

/**
 * Tabla clásica en blanco y negro: DÍA | HORARIO | MENÚ | OFFICE, una
 * sola fila por horario (nunca se repite), con el día fusionado
 * verticalmente. Fondo blanco, letras y bordes negros, sin rellenos.
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

  const anchoServicio = orientacion === 'portrait' ? 27 : 45
  ws.columns = [{ width: 12 }, { width: 13 }, { width: anchoServicio }, { width: anchoServicio }]

  ws.mergeCells('A1:D1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: NEGRO } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 22

  ws.mergeCells('A2:D2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } }
  ws.getRow(2).height = 14

  ws.addRow([])

  const headerRow = ws.addRow(['DÍA', 'HORARIO', 'MENÚ', 'OFFICE'])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 9, color: { argb: NEGRO } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = bordeNegro()
  })
  headerRow.height = 16

  for (const fecha of dias) {
    const delDia = asignaciones.filter((a) => a.fecha === fecha)
    const horarios = Array.from(new Set(delDia.map((a) => a.horarioTexto))).sort(compararHorarios)

    const filaInicioDia = ws.rowCount + 1
    let primeraFilaDelDia = true

    for (const horario of horarios) {
      const menu = delDia
        .filter((a) => a.horarioTexto === horario && a.categoria === 'menu')
        .map((a) => a.nombre)
        .join(' · ')
      const office = delDia
        .filter((a) => a.horarioTexto === horario && a.categoria === 'office')
        .map((a) => a.nombre)
        .join(' · ')

      const row = ws.addRow([primeraFilaDelDia ? formatFechaLarga(fecha).toUpperCase() : '', horario, menu || '—', office || '—'])
      const lineasMenu = estimarLineas(menu, anchoServicio)
      const lineasOffice = estimarLineas(office, anchoServicio)
      row.height = 12 * Math.max(lineasMenu, lineasOffice) + 6

      row.eachCell((cell, colNumber) => {
        cell.border = bordeNegro()
        cell.alignment = { vertical: 'middle', horizontal: colNumber <= 2 ? 'center' : 'left', wrapText: true }
        cell.font = { size: 8, bold: colNumber === 1, color: { argb: NEGRO } }
      })

      primeraFilaDelDia = false
    }

    if (ws.rowCount > filaInicioDia) {
      ws.mergeCells(`A${filaInicioDia}:A${ws.rowCount}`)
      ws.getCell(`A${filaInicioDia}`).alignment = { vertical: 'middle', horizontal: 'center' }
    }
  }

  ws.pageSetup.printArea = `A1:D${ws.rowCount}`
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
