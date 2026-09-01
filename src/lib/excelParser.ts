import * as XLSX from 'xlsx'
import { FilaCruda } from './types'
import { parseFechaTexto, diaDeSemana } from './dateUtils'

function normalizar(texto: string): string {
  return texto
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function esAlimentos(texto: string): boolean {
  return normalizar(texto).includes('aliment')
}

function celdaComoTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) {
    const h = valor.getHours()
    const m = valor.getMinutes()
    if (h || m) return `${h}:${String(m).padStart(2, '0')}`
    return `${valor.getDate()}/${valor.getMonth() + 1}/${valor.getFullYear()}`
  }
  return String(valor).trim()
}

/**
 * Limpia un nombre que puede traer un horario pegado, ej:
 * "11:30 Isa" -> "Isa", "16:15Anto" -> "Anto", "Isah/11:30" -> "Isa",
 * "Vaneh/17:30" -> "Vane".
 */
function limpiarNombre(crudo: string): string {
  let n = crudo.trim()
  n = n.replace(/^\d{1,2}[:.]\d{2}\s*/, '') // horario al principio
  n = n.replace(/h?\s*\/?\s*\d{1,2}[:.]\d{2}\s*$/i, '') // "h/11:30" al final
  n = n.replace(/\bhs?\b\.?/gi, '')
  n = n.replace(/[¿?()]/g, '')
  n = n.replace(/\s{2,}/g, ' ')
  return n.trim()
}

function esNombreValido(n: string): boolean {
  if (!n) return false
  if (n.length > 40) return false
  if (/^\d+$/.test(n)) return false
  return true
}

let contador = 0
function nuevoId() {
  contador += 1
  return `fila-${Date.now()}-${contador}`
}

export interface ResultadoParseo {
  filas: FilaCruda[]
  hojasAnalizadas: number
  hojasConAlimentos: number
}

/**
 * Cada hoja del Excel es un día. Dentro de la hoja, la columna A trae el
 * horario del bloque (solo en la primera fila del bloque, después queda en
 * blanco), la columna B trae el nombre del sector/tarea (ej "Alimentos",
 * "HK", "Ropa"...) y también puede quedar en blanco en filas de
 * continuación del mismo bloque. Las columnas C a G traen los nombres de
 * las personas asignadas ese bloque — pueden ser varias filas.
 */
export async function parsearExcel(file: File, anioReferencia: number): Promise<ResultadoParseo> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  const filas: FilaCruda[] = []
  let hojasConAlimentos = 0

  for (const nombreHoja of workbook.SheetNames) {
    const hoja = workbook.Sheets[nombreHoja]
    const data: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })
    if (data.length === 0) continue

    const fechaISO = parseFechaTexto(nombreHoja, anioReferencia)
    if (!fechaISO) continue // hojas que no son un día puntual (resúmenes, hojas sueltas, etc.)

    const dia = diaDeSemana(fechaISO)

    let horarioActual = ''
    let sectorActual = ''
    let huboAlimentos = false

    for (const row of data) {
      const colA = celdaComoTexto(row[0])
      const colB = celdaComoTexto(row[1])

      if (colA) horarioActual = colA
      if (colB) sectorActual = colB

      if (!esAlimentos(sectorActual)) continue
      huboAlimentos = true

      for (let i = 2; i <= 6; i++) {
        const crudo = celdaComoTexto(row[i])
        if (!crudo) continue
        const nombre = limpiarNombre(crudo)
        if (!esNombreValido(nombre)) continue

        filas.push({
          id: nuevoId(),
          hoja: nombreHoja,
          fecha: fechaISO,
          dia,
          horarioTexto: horarioActual || '(sin horario)',
          nombreCrudo: crudo,
          nombre,
        })
      }
    }

    if (huboAlimentos) hojasConAlimentos++
  }

  return { filas, hojasAnalizadas: workbook.SheetNames.length, hojasConAlimentos }
}
