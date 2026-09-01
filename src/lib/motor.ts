import { AsignacionGenerada, Categoria, FilaCruda, Persona } from './types'

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function encontrarPersona(nombre: string, personas: Persona[]): Persona | null {
  const n = normalizar(nombre)
  if (!n) return null
  let match = personas.find((p) => normalizar(p.nombre) === n)
  if (match) return match
  match = personas.find((p) => normalizar(p.nombre).includes(n) || n.includes(normalizar(p.nombre)))
  return match ?? null
}

/** Extrae la hora de inicio de un texto como "12:45 a 14:30" o "16 a 18:15", en minutos desde medianoche. */
function horarioAMinutos(horarioTexto: string): number | null {
  const match = horarioTexto.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?/)
  if (!match) return null
  const h = Number(match[1])
  const m = match[2] ? Number(match[2]) : 0
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * Regla confirmada:
 *  - Mañana (hasta ~12:15)      -> Menú
 *  - Turno mediodía (~12:45-14:30) -> Office
 *  - Turno tarde (~16:00-19:45)    -> Menú
 *  - Turno noche (~20:15-21:35)    -> Office
 */
export function categoriaPorHorario(horarioTexto: string): Categoria {
  const t = horarioAMinutos(horarioTexto)
  if (t === null) return 'office'
  if (t < 12 * 60 + 20) return 'menu' // antes de 12:20
  if (t < 15 * 60 + 30) return 'office' // 12:20 a 15:30 -> mediodía
  if (t < 20 * 60) return 'menu' // 15:30 a 20:00 -> tarde
  return 'office' // desde las 20:00 -> noche
}

let contador = 0
function nuevoId() {
  contador += 1
  return `asig-${Date.now()}-${contador}`
}

/**
 * Convierte las filas crudas detectadas en el Excel en asignaciones
 * Menú/Office. Una persona puede aparecer en las dos categorías el mismo
 * día si trabaja bloques de ambas (ej: mañana Menú y luego mediodía
 * Office), pero nunca dos veces en la misma categoría el mismo día.
 */
export function generarAsignaciones(filas: FilaCruda[], personas: Persona[]): AsignacionGenerada[] {
  const vistos = new Set<string>() // `${fecha}__${categoria}__${nombre normalizado}`
  const resultado: AsignacionGenerada[] = []

  for (const fila of filas) {
    if (!fila.fecha || !fila.nombre) continue

    const categoria = categoriaPorHorario(fila.horarioTexto)
    const clave = `${fila.fecha}__${categoria}__${normalizar(fila.nombre)}`
    if (vistos.has(clave)) continue
    vistos.add(clave)

    const persona = encontrarPersona(fila.nombre, personas)

    resultado.push({
      id: nuevoId(),
      fecha: fila.fecha,
      dia: fila.dia ?? '',
      nombre: persona?.nombre ?? fila.nombre,
      personaId: persona?.id ?? null,
      categoria,
      horarioTexto: fila.horarioTexto,
      esPersonaNueva: !persona,
      observaciones: !persona ? 'No está en "Personal de Alimentos" — revisar y agregar.' : null,
    })
  }

  return resultado
}
