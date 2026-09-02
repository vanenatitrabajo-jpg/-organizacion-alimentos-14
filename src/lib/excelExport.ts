import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AsignacionGenerada, CATEGORIA_LABEL, CATEGORIA_ORDEN } from './types'
import { formatFechaLarga } from './dateUtils'
import { compararHorarios } from './motor'

const NEGRO = 'FF000000'
const BLANCO = 'FFFFFFFF'
const GRIS_CLARO = 'FFF3F3F3'

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
 * Cada día es una barra negra con texto blanco (imposible de no ver),
 * y debajo una tabla de 3 columnas para ese día: HORARIO (fusionado
 * verticalmente cuando Menú y Office comparten el mismo bloque, así no
 * se repite) | SERVICIO (negrita, bien destacado) | PERSONAL.
 * Blanco y negro, sin colores — el gris clarito es solo una franja
 * alternada para que se siga con la vista más fácil, no un color de
 * servicio.
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

  const anchoPersonal = orientacion === 'portrait' ? 42 : 70
  ws.columns = [{ width: 14 }, { width: 11 }, { width: anchoPersonal }]

  ws.mergeCells('A1:C1')
  const tituloCell = ws.getCell('A1')
  tituloCell.value = titulo.toUpperCase()
  tituloCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: NEGRO } }
  tituloCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 22

  ws.mergeCells('A2:C2')
  const subtitulo = ws.getCell('A2')
  subtitulo.value = `Del ${formatFechaLarga(fechaInicio)} al ${formatFechaLarga(fechaFin)}`
  subtitulo.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } }
  ws.getRow(2).height = 14

  ws.addRow([])

  let alternar = false
  for (const fecha of dias) {
    const delDia = asignaciones.filter((a) => a.fecha === fecha)
    const horarios = Array.from(new Set(delDia.map((a) => a.horarioTexto))).sort(compararHorarios)
    alternar = !alternar

    // --- Barra negra con el día, imposible de no ver ---
    const filaDia = ws.addRow([formatFechaLarga(fecha).toUpperCase(), '', ''])
    ws.mergeCells(`A${filaDia.number}:C${filaDia.number}`)
    const celdaDia = ws.getCell(`A${filaDia.number}`)
    celdaDia.font = { size: 12, bold: true, color: { argb: BLANCO } }
    celdaDia.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    celdaDia.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEGRO } }
    filaDia.height = 19

    // --- Tabla del día: Horario (fusionado) | Servicio | Personal ---
    for (const horario of horarios) {
      const filaInicioHorario = ws.rowCount + 1
      let primeraFilaDelHorario = true

      for (const categoria of CATEGORIA_ORDEN) {
        const nombres = delDia
          .filter((a) => a.horarioTexto === horario && a.categoria === categoria)
          .map((a) => a.nombre)
        if (nombres.length === 0) continue

        const row = ws.addRow([primeraFilaDelHorario ? horario : '', CATEGORIA_LABEL[categoria].toUpperCase(), nombres.join(' · ')])
        row.height = 14

        row.eachCell((cell, colNumber) => {
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } } }
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 3 ? 'left' : 'center',
            wrapText: true,
          }
          if (colNumber === 1) cell.font = { size: 9, bold: true, color: { argb: NEGRO } }
          if (colNumber === 2) cell.font = { size: 9, bold: true, color: { argb: NEGRO } }
          if (colNumber === 3) cell.font = { size: 9, color: { argb: NEGRO } }
          if (alternar) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CLARO } }
        })

        primeraFilaDelHorario = false
      }

      if (ws.rowCount > filaInicioHorario) {
        ws.mergeCells(`A${filaInicioHorario}:A${ws.rowCount}`)
        ws.getCell(`A${filaInicioHorario}`).alignment = { vertical: 'middle', horizontal: 'center' }
      }
    }
  }

  ws.pageSetup.printArea = `A1:C${ws.rowCount}`
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
