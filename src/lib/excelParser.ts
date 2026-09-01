import * as XLSX from 'xlsx'
import { FilaCruda, DIA_LABEL } from './types'

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
 * Limpia un nombre que puede traer un horario pegado, y separa nombres
 * unidos por guión (una misma celda a veces trae "Dai-Nini"), ej:
 * "11:30 Isa" -> ["Isa"], "Rocioh/18" -> ["Rocio"], "Dai-Nini" -> ["Dai","Nini"].
 */
function limpiarYSepararNombres(crudo: string): string[] {
  let n = crudo.trim()
  n = n.replace(/^\d{1,2}[:.]\d{2}\s*/, '')
  n = n.replace(/h?\s*\/?\s*\d{1,2}(?:[:.]\d{2})?\s*$/i, '')
  n = n.replace(/\bhs?\b\.?/gi, '')
  n = n.replace(/[¿?()]/g, '')
  n = n.trim()
  const partes = n
    .split('-')
    .map((p) => p.trim())
    .filter(Boolean)
  return partes.length > 0 ? partes : n ? [n] : []
}

function esNombreValido(n: string): boolean {
  if (!n) return false
  if (n.length > 40) return false
  if (/^\d+$/.test(n)) return false
  return true
}

const DIA_REGEX = /^(domingo|lunes|martes|miercoles|jueves|vier?nes|sabado|sadabo)\D{0,6}(\d{1,2})\b/

/** Extrae el número de día de un nombre de hoja como "Lunes 22---" o "Jueves28---". */
function extraerNumeroDia(nombreHoja: string): number | null {
  const n = normalizar(nombreHoja)
  const match = n.match(DIA_REGEX)
  if (!match) return null
  const numero = Number(match[2])
  if (Number.isNaN(numero) || numero < 1 || numero > 31) return null
  return numero
}

/**
 * El libro suele traer meses anteriores acumulados debajo del mes actual.
 * Como las hojas de un mismo mes están en orden descendente (28, 27, 26…
 * hasta 1), tomamos solo esa primera racha descendente — apenas el número
 * de día vuelve a subir, significa que empezó el mes anterior y cortamos ahí.
 */
function detectarHojasDelMesMasReciente(nombresHojas: string[]): { nombre: string; numeroDia: number }[] {
  const bloque: { nombre: string; numeroDia: number }[] = []
  let ultimoDia: number | null = null

  for (const nombreHoja of nombresHojas) {
    const numero = extraerNumeroDia(nombreHoja)
    if (numero === null) {
      if (bloque.length > 0) break
      continue
    }
    if (ultimoDia !== null && numero > ultimoDia) break
    bloque.push({ nombre: nombreHoja, numeroDia: numero })
    ultimoDia = numero
  }

  return bloque
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
  hojasSinFecha: number
}

/**
 * Dentro de cada hoja-día: columna A trae el horario del bloque (solo en
 * la primera fila del bloque), columna B el sector/tarea (ej "Alimentos"),
 * y columnas C a G los nombres — puede haber varias filas por bloque.
 */
export async function parsearExcel(file: File, mes: number, anio: number): Promise<ResultadoParseo> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  const hojasDelMes = detectarHojasDelMesMasReciente(workbook.SheetNames)

  const filas: FilaCruda[] = []
  let hojasConAlimentos = 0
  let hojasSinFecha = 0

  for (const { nombre: nombreHoja, numeroDia } of hojasDelMes) {
    const hoja = workbook.Sheets[nombreHoja]
    const data: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })
    if (data.length === 0) continue

    const fechaISO = `${anio}-${String(mes).padStart(2, '0')}-${String(numeroDia).padStart(2, '0')}`
    const fechaValida = new Date(fechaISO + 'T00:00:00')
    if (Number.isNaN(fechaValida.getTime()) || fechaValida.getDate() !== numeroDia) {
      hojasSinFecha++
      continue
    }
    const dia = DIA_LABEL[fechaValida.getDay()]

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

        for (const nombre of limpiarYSepararNombres(crudo)) {
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
    }

    if (huboAlimentos) hojasConAlimentos++
  }

  return {
    filas,
    hojasAnalizadas: hojasDelMes.length,
    hojasConAlimentos,
    hojasSinFecha,
  }
}
