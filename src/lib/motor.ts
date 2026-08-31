import { AsignacionGenerada, FilaCruda, Persona, Puesto } from './types'
import { diaDeSemana } from './dateUtils'

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Empareja el nombre detectado en el Excel con la base de Personal de Alimentos. */
function encontrarPersona(nombre: string, personas: Persona[]): Persona | null {
  const n = normalizar(nombre)
  if (!n) return null
  let match = personas.find((p) => normalizar(p.nombre) === n)
  if (match) return match
  match = personas.find((p) => normalizar(p.nombre).includes(n) || n.includes(normalizar(p.nombre)))
  return match ?? null
}

let contador = 0
function nuevoId() {
  contador += 1
  return `asig-${Date.now()}-${contador}`
}

/**
 * Genera las asignaciones finales.
 *
 * Para cada persona detectada en el Excel, un día dado:
 *  1) Se busca en Personal de Alimentos.
 *  2) Se intenta ubicarla en su puesto principal.
 *  3) Si el puesto ya está ocupado ese día, se prueba la segunda preferencia.
 *  4) Si también está ocupada, se prueba la tercera.
 *  5) Si las tres están ocupadas (o no tiene preferencias cargadas), queda
 *     marcada como conflicto — se resuelve a mano con drag & drop.
 *
 * Si la misma persona aparece varias veces el mismo día en el Excel (por
 * ejemplo con distintos horarios), se procesa una sola vez por día.
 */
export function generarAsignaciones(
  filas: FilaCruda[],
  personas: Persona[],
  puestos: Puesto[]
): AsignacionGenerada[] {
  const resultado: AsignacionGenerada[] = []
  // Puestos ya ocupados, por fecha: `${fecha}__${puestoId}`
  const ocupado = new Set<string>()

  const porFecha = new Map<string, FilaCruda[]>()
  for (const f of filas) {
    if (!f.fecha) continue
    if (!porFecha.has(f.fecha)) porFecha.set(f.fecha, [])
    porFecha.get(f.fecha)!.push(f)
  }

  for (const [fecha, filasDelDia] of porFecha) {
    const vistosHoy = new Set<string>()

    for (const fila of filasDelDia) {
      const nombreDetectado = fila.nombre?.trim()
      const dia = fila.dia ?? diaDeSemana(fecha)

      if (!nombreDetectado) {
        resultado.push({
          id: nuevoId(),
          fecha,
          dia,
          nombre: '(nombre sin detectar)',
          personaId: null,
          puestoId: null,
          puestoNombre: null,
          grupo: null,
          preferenciaUsada: null,
          conflicto: true,
          sinPreferenciasCargadas: false,
          observaciones: 'No se pudo detectar el nombre en esta fila del Excel.',
        })
        continue
      }

      const clave = normalizar(nombreDetectado)
      if (vistosHoy.has(clave)) continue // ya se procesó a esta persona este día
      vistosHoy.add(clave)

      const persona = encontrarPersona(nombreDetectado, personas)

      if (!persona) {
        resultado.push({
          id: nuevoId(),
          fecha,
          dia,
          nombre: nombreDetectado,
          personaId: null,
          puestoId: null,
          puestoNombre: null,
          grupo: null,
          preferenciaUsada: null,
          conflicto: true,
          sinPreferenciasCargadas: true,
          observaciones: 'No está cargada en "Personal de Alimentos" — agregala para que se ubique sola.',
        })
        continue
      }

      const preferencias: { id: string; n: 1 | 2 | 3 }[] = [
        { id: persona.puesto_principal_id ?? '', n: 1 as const },
        { id: persona.puesto_segunda_id ?? '', n: 2 as const },
        { id: persona.puesto_tercera_id ?? '', n: 3 as const },
      ].filter((p) => p.id) as { id: string; n: 1 | 2 | 3 }[]

      if (preferencias.length === 0) {
        resultado.push({
          id: nuevoId(),
          fecha,
          dia,
          nombre: persona.nombre,
          personaId: persona.id,
          puestoId: null,
          puestoNombre: null,
          grupo: null,
          preferenciaUsada: null,
          conflicto: true,
          sinPreferenciasCargadas: true,
          observaciones: 'No tiene preferencias de puesto cargadas en su ficha.',
        })
        continue
      }

      let asignado: { puesto: Puesto; n: 1 | 2 | 3 } | null = null
      for (const pref of preferencias) {
        const puesto = puestos.find((p) => p.id === pref.id)
        if (!puesto) continue
        const claveOcupacion = `${fecha}__${puesto.id}`
        if (!ocupado.has(claveOcupacion)) {
          asignado = { puesto, n: pref.n }
          ocupado.add(claveOcupacion)
          break
        }
      }

      if (asignado) {
        resultado.push({
          id: nuevoId(),
          fecha,
          dia,
          nombre: persona.nombre,
          personaId: persona.id,
          puestoId: asignado.puesto.id,
          puestoNombre: asignado.puesto.nombre,
          grupo: asignado.puesto.grupo,
          preferenciaUsada: asignado.n,
          conflicto: false,
          sinPreferenciasCargadas: false,
          observaciones:
            asignado.n > 1
              ? `Su puesto principal estaba ocupado — se ubicó con la preferencia ${asignado.n}.`
              : null,
        })
      } else {
        resultado.push({
          id: nuevoId(),
          fecha,
          dia,
          nombre: persona.nombre,
          personaId: persona.id,
          puestoId: null,
          puestoNombre: null,
          grupo: null,
          preferenciaUsada: null,
          conflicto: true,
          sinPreferenciasCargadas: false,
          observaciones: 'Sus 3 preferencias ya estaban ocupadas ese día — asignar a mano arrastrando.',
        })
      }
    }
  }

  return resultado
}
