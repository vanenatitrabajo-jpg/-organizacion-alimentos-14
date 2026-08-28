import * as XLSX from 'xlsx'
import { FilaCruda } from './types'
import { excelSerialToISO, parseFechaTexto, extraerHorarios } from './dateUtils'

const PALABRAS_ALIMENTOS = ['alimentos', 'alimento']

const HEADER_KEYWORDS: Record<string, string[]> = {
  fecha: ['fecha'],
  dia: ['dia', 'día'],
  horario: ['horario', 'hora'],
  nombre: ['nombre', 'persona', 'personal', 'apellido'],
  sector: ['sector', 'actividad', 'servicio', 'area', 'área', 'tarea'],
}

function normalizar(texto: string): string {
  return texto
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function contieneAlimentos(texto: string): boolean {
  const n = normalizar(texto)
  return PALABRAS_ALIMENTOS.some((p) => n.includes(p))
}

function detectarColumnas(headerRow: unknown[]): Record<string, number> {
  const columnas: Record<string, number> = {}
  headerRow.forEach((celda, idx) => {
    const n = normalizar(String(celda ?? ''))
    if (!n) return
    for (const [campo, palabras] of Object.entries(HEADER_KEYWORDS)) {
      if (palabras.some((p) => n.includes(p)) && columnas[campo] === undefined) {
        columnas[campo] = idx
      }
    }
  })
  return columnas
}

function esFilaDeEncabezado(row: unknown[]): boolean {
  const cols = detectarColumnas(row)
  return Object.keys(cols).length >= 2
}

function celdaComoTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) {
    return `${valor.getDate()}/${valor.getMonth() + 1}/${valor.getFullYear()}`
  }
  return String(valor)
}

let contador = 0
function nuevoId() {
  contador += 1
  return `fila-${Date.now()}-${contador}`
}

export interface ResultadoParseo {
  filas: FilaCruda[]
  hojasAnalizadas: number
  totalFilasRevisadas: number
}

export async function parsearExcel(file: File, anioReferencia: number): Promise<ResultadoParseo> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  const filas: FilaCruda[] = []
  let totalFilasRevisadas = 0

  for (const nombreHoja of workbook.SheetNames) {
    const hoja = workbook.Sheets[nombreHoja]
    const data: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })
    if (data.length === 0) continue

    // Fecha/día de referencia si el nombre de la hoja ya lo indica
    // (ej: hoja "Lunes 24" o "24-08").
    const fechaDeHoja = parseFechaTexto(nombreHoja, anioReferencia)

    // Buscar fila de encabezado dentro de las primeras 6 filas.
    let headerIdx = -1
    let columnas: Record<string, number> = {}
    for (let i = 0; i < Math.min(6, data.length); i++) {
      if (esFilaDeEncabezado(data[i])) {
        headerIdx = i
        columnas = detectarColumnas(data[i])
        break
      }
    }

    if (headerIdx >= 0) {
      // ---- Modo estructurado: usamos las columnas detectadas ----
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i]
        totalFilasRevisadas++
        const textoCompleto = row.map(celdaComoTexto).join(' | ')

        const sectorTexto = columnas.sector !== undefined ? celdaComoTexto(row[columnas.sector]) : ''
        const esAlimentos = contieneAlimentos(sectorTexto) || contieneAlimentos(textoCompleto)
        if (!esAlimentos) continue

        const nombreTexto = columnas.nombre !== undefined ? celdaComoTexto(row[columnas.nombre]).trim() : ''
        const fechaTexto = columnas.fecha !== undefined ? celdaComoTexto(row[columnas.fecha]) : ''
        const diaTexto = columnas.dia !== undefined ? celdaComoTexto(row[columnas.dia]) : ''
        const horarioTexto = columnas.horario !== undefined ? celdaComoTexto(row[columnas.horario]) : textoCompleto

        let fechaISO: string | null = null
        const serial = Number(fechaTexto)
        if (fechaTexto && !Number.isNaN(serial) && serial > 20000 && serial < 90000) {
          fechaISO = excelSerialToISO(serial)
        } else if (fechaTexto) {
          fechaISO = parseFechaTexto(fechaTexto, anioReferencia)
        }
        if (!fechaISO) fechaISO = fechaDeHoja ?? parseFechaTexto(diaTexto, anioReferencia)

        const horarios = extraerHorarios(horarioTexto)

        filas.push({
          id: nuevoId(),
          hoja: nombreHoja,
          fila: i + 1,
          fechaTexto: fechaTexto || diaTexto || nombreHoja,
          fecha: fechaISO,
          dia: diaTexto || null,
          horario: horarios[0] ?? null,
          nombre: nombreTexto || null,
          observacion: !nombreTexto || !fechaISO || horarios.length === 0 ? 'Faltan datos en la fila original' : null,
        })
      }
    } else {
      // ---- Modo heurístico: la hoja no tiene encabezados claros ----
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        totalFilasRevisadas++
        const textoCompleto = row.map(celdaComoTexto).join(' | ')
        if (!contieneAlimentos(textoCompleto)) continue

        const horarios = extraerHorarios(textoCompleto)
        // Nombre: la celda de texto más larga que no sea un horario/fecha/"alimentos".
        let nombreTexto: string | null = null
        let mejorLongitud = 0
        for (const celda of row) {
          const txt = celdaComoTexto(celda).trim()
          if (!txt) continue
          if (contieneAlimentos(txt)) continue
          if (/^\d{1,2}[:.]\d{2}/.test(txt)) continue
          if (parseFechaTexto(txt, anioReferencia)) continue
          if (txt.length > mejorLongitud && txt.length < 40) {
            mejorLongitud = txt.length
            nombreTexto = txt
          }
        }

        const fechaISO = fechaDeHoja ?? parseFechaTexto(nombreHoja, anioReferencia)

        filas.push({
          id: nuevoId(),
          hoja: nombreHoja,
          fila: i + 1,
          fechaTexto: fechaISO ? null : nombreHoja,
          fecha: fechaISO,
          dia: null,
          horario: horarios[0] ?? null,
          nombre: nombreTexto,
          observacion: 'Detectado sin encabezados claros — revisar antes de confirmar',
        })
      }
    }
  }

  return { filas, hojasAnalizadas: workbook.SheetNames.length, totalFilasRevisadas }
}
