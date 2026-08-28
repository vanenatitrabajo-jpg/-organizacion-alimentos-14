import { Asignacion, AsignacionVariable, FilaCruda, Persona, Regla, Sector } from './types'
import { clasificarTurno, dentroDeVentana, diaDeSemana } from './dateUtils'

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Empareja el nombre detectado en el Excel con la base de Personal fijo. */
function encontrarPersona(nombre: string, personas: Persona[]): Persona | null {
  const n = normalizar(nombre)
  if (!n) return null
  let match = personas.find((p) => normalizar(p.nombre) === n)
  if (match) return match
  match = personas.find((p) => normalizar(p.nombre).includes(n) || n.includes(normalizar(p.nombre)))
  return match ?? null
}

function reglaParaHorario(horario: string, reglas: Regla[]): Regla | null {
  const activas = reglas
    .filter((r) => r.activa && r.hora_desde && r.hora_hasta && r.sector)
    .sort((a, b) => b.prioridad - a.prioridad)
  for (const r of activas) {
    if (dentroDeVentana(horario, r.hora_desde!, r.hora_hasta!)) return r
  }
  return null
}

let contador = 0
function nuevoId() {
  contador += 1
  return `asig-${Date.now()}-${contador}`
}

/**
 * Genera las asignaciones finales cruzando lo detectado en el Excel con:
 * 1) personal variable para ese día,
 * 2) reglas por horario,
 * 3) sector habitual del personal fijo.
 * Nunca inventa sector: si nada coincide, queda "revisión". Si dos fuentes
 * confiables se contradicen, queda "conflicto".
 */
export function generarAsignaciones(
  filas: FilaCruda[],
  personas: Persona[],
  variables: AsignacionVariable[],
  reglas: Regla[]
): Asignacion[] {
  return filas.map((fila) => {
    const nombre = fila.nombre?.trim() || '(nombre sin detectar)'
    const persona = fila.nombre ? encontrarPersona(fila.nombre, personas) : null

    if (!fila.nombre || !fila.fecha) {
      return {
        id: nuevoId(),
        fecha: fila.fecha,
        dia: fila.dia ?? (fila.fecha ? diaDeSemana(fila.fecha) : null),
        horario: fila.horario,
        turno: fila.horario ? clasificarTurno(fila.horario) : null,
        nombre,
        personaId: persona?.id ?? null,
        sector: null,
        estado: 'revision',
        motivo: !fila.nombre ? 'No se pudo detectar el nombre en esta fila.' : 'No se pudo detectar la fecha en esta fila.',
      }
    }

    const variable = persona
      ? variables.find((v) => v.persona_id === persona.id && v.dia === fila.fecha)
      : null

    const reglaHoraria = fila.horario ? reglaParaHorario(fila.horario, reglas) : null

    const candidatos: { sector: Sector; fuente: string }[] = []
    if (variable?.sector) candidatos.push({ sector: variable.sector, fuente: `asignación variable de ${nombre} para ese día` })
    if (reglaHoraria?.sector) candidatos.push({ sector: reglaHoraria.sector, fuente: `regla "${reglaHoraria.nombre}"` })
    if (persona?.sector) candidatos.push({ sector: persona.sector, fuente: `sector habitual (Personal fijo)` })

    const turno = fila.horario ? clasificarTurno(fila.horario) : persona?.turno ?? null

    if (candidatos.length === 0) {
      return {
        id: nuevoId(),
        fecha: fila.fecha,
        dia: fila.dia ?? diaDeSemana(fila.fecha),
        horario: fila.horario,
        turno,
        nombre,
        personaId: persona?.id ?? null,
        sector: null,
        estado: 'revision',
        motivo: persona
          ? 'La persona no tiene sector habitual ni regla horaria que aplique.'
          : 'La persona no está cargada en Personal fijo ni tiene regla horaria que aplique.',
      }
    }

    // Prioridad de fuente: variable > regla horaria > fijo.
    const principal = candidatos[0]
    const distintos = new Set(candidatos.map((c) => c.sector))

    if (distintos.size > 1) {
      return {
        id: nuevoId(),
        fecha: fila.fecha,
        dia: fila.dia ?? diaDeSemana(fila.fecha),
        horario: fila.horario,
        turno,
        nombre,
        personaId: persona?.id ?? null,
        sector: principal.sector,
        estado: 'conflicto',
        motivo: `Se aplicó ${principal.fuente}, pero hay otra fuente que sugiere un sector distinto: ${candidatos
          .filter((c) => c.sector !== principal.sector)
          .map((c) => `${c.fuente} → ${c.sector}`)
          .join(', ')}.`,
      }
    }

    return {
      id: nuevoId(),
      fecha: fila.fecha,
      dia: fila.dia ?? diaDeSemana(fila.fecha),
      horario: fila.horario,
      turno,
      nombre,
      personaId: persona?.id ?? null,
      sector: principal.sector,
      estado: variable?.sector ? 'fijo' : reglaHoraria?.sector ? 'regla' : 'fijo',
      motivo: `Asignado por ${principal.fuente}.`,
    }
  })
}
