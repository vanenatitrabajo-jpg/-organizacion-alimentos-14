import { Turno, DIA_LABEL } from './types'

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Excel guarda las fechas como número de días desde 1899-12-30. */
export function excelSerialToISO(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) return null
  const epoch = new Date(Date.UTC(1899, 11, 30))
  const ms = epoch.getTime() + serial * 86400000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/**
 * Intenta reconocer una fecha en texto libre: "24/08", "24-08-2026",
 * "Lunes 24", "24 de agosto", etc. Devuelve ISO (yyyy-mm-dd) cuando puede
 * resolver el año (usa el año de referencia dado si el texto no lo trae).
 */
export function parseFechaTexto(texto: string, anioReferencia: number): string | null {
  const t = texto.trim().toLowerCase()

  // dd/mm/yyyy o dd-mm-yyyy
  let m = t.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    const dd = Number(m[1])
    const mm = Number(m[2])
    let yyyy = Number(m[3])
    if (yyyy < 100) yyyy += 2000
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      return `${yyyy}-${pad(mm)}-${pad(dd)}`
    }
  }

  // dd/mm (sin año)
  m = t.match(/(\d{1,2})[/\-.](\d{1,2})(?!\d)/)
  if (m) {
    const dd = Number(m[1])
    const mm = Number(m[2])
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      return `${anioReferencia}-${pad(mm)}-${pad(dd)}`
    }
  }

  // "24 de agosto" / "24 agosto"
  m = t.match(/(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)/)
  if (m) {
    const dd = Number(m[1])
    const mesNombre = m[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const mm = MESES[mesNombre]
    if (mm && dd >= 1 && dd <= 31) {
      return `${anioReferencia}-${pad(mm)}-${pad(dd)}`
    }
  }

  return null
}

/** Nombre del día de la semana en español a partir de una fecha ISO. */
export function diaDeSemana(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return DIA_LABEL[date.getUTCDay()]
}

/** Extrae uno o más bloques horarios de un texto: "08:25", "12:50-14:30", "20:15 a 21:35". */
export function extraerHorarios(texto: string): string[] {
  const resultados: string[] = []
  const regexRango = /(\d{1,2})[:.](\d{2})\s*(?:-|a|–|—)\s*(\d{1,2})[:.](\d{2})/gi
  const regexSuelto = /(\d{1,2})[:.](\d{2})/g

  let m: RegExpExecArray | null
  const usados = new Set<number>()

  while ((m = regexRango.exec(texto))) {
    const desde = `${pad(Number(m[1]))}:${m[2]}`
    const hasta = `${pad(Number(m[3]))}:${m[4]}`
    resultados.push(`${desde}-${hasta}`)
    usados.add(m.index)
  }

  regexSuelto.lastIndex = 0
  while ((m = regexSuelto.exec(texto))) {
    const dentroDeRango = resultados.some((r) => texto.indexOf(m![0], m!.index - 6) !== -1 && r.includes(`${pad(Number(m![1]))}:${m![2]}`))
    if (!dentroDeRango) {
      const yaIncluido = resultados.some((r) => r.startsWith(`${pad(Number(m![1]))}:${m![2]}`))
      if (!yaIncluido) resultados.push(`${pad(Number(m![1]))}:${m![2]}`)
    }
  }

  return resultados
}

/** Primera hora (HH:MM) de un bloque horario, para ordenar y clasificar turno. */
export function horaInicio(horario: string): number | null {
  const m = horario.match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function clasificarTurno(horario: string): Turno {
  const inicio = horaInicio(horario)
  if (inicio === null) return 'manana'
  if (inicio < 11 * 60 + 30) return 'manana'
  if (inicio < 16 * 60) return 'tarde'
  return 'noche'
}

/** ¿el horario cae dentro de la ventana [desde, hasta) de una regla? */
export function dentroDeVentana(horario: string, desde: string, hasta: string): boolean {
  const inicio = horaInicio(horario)
  if (inicio === null) return false
  const [dH, dM] = desde.split(':').map(Number)
  const [hH, hM] = hasta.split(':').map(Number)
  const desdeMin = dH * 60 + dM
  const hastaMin = hH * 60 + hM
  return inicio >= desdeMin && inicio < hastaMin
}

export function formatFechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dia = DIA_LABEL[date.getUTCDay()]
  return `${dia} ${d}`
}
