export type Sector = 'cocina' | 'office' | 'menu'
export type Turno = 'manana' | 'tarde' | 'noche'
export type EstadoAsignacion = 'fijo' | 'regla' | 'revision' | 'conflicto'

export interface Persona {
  id: string
  nombre: string
  sector: Sector
  puesto: string | null
  horario_habitual: string | null
  dias_habituales: string[] | null
  turno: Turno | null
  prioridad: number
  observaciones: string | null
}

export interface AsignacionVariable {
  id: string
  persona_id: string
  dia: string // ISO date yyyy-mm-dd
  sector: Sector | null
  horario: string | null
  turno: Turno | null
}

export interface Regla {
  id: string
  nombre: string
  activa: boolean
  prioridad: number
  hora_desde: string | null // HH:MM
  hora_hasta: string | null // HH:MM
  sector: Sector | null
}

/** Una fila "Alimentos" cruda detectada en el Excel importado. */
export interface FilaCruda {
  id: string
  hoja: string
  fila: number
  fechaTexto: string | null
  fecha: string | null // ISO yyyy-mm-dd si se pudo resolver
  dia: string | null // Lunes, Martes...
  horario: string | null // "08:25" o "12:50-14:30"
  nombre: string | null
  observacion: string | null
}

/** Una asignación ya cruzada con personal fijo/variable y reglas. */
export interface Asignacion {
  id: string
  fecha: string | null
  dia: string | null
  horario: string | null
  turno: Turno | null
  nombre: string
  personaId: string | null
  sector: Sector | null
  estado: EstadoAsignacion
  motivo: string
}

export interface OrganizacionGenerada {
  id?: string
  tipo: 'semanal' | 'mensual'
  fechaInicio: string
  fechaFin: string
  archivoOrigen: string
  asignaciones: Asignacion[]
  resumen: {
    diasEncontrados: number
    personasEncontradas: number
    asignacionesAutomaticas: number
    revisionesNecesarias: number
    conflictos: number
  }
}

export const SECTOR_LABEL: Record<Sector, string> = {
  cocina: 'Cocina',
  office: 'Office',
  menu: 'Menú',
}

export const TURNO_LABEL: Record<Turno, string> = {
  manana: 'Mañana',
  tarde: 'Tarde / Almuerzo',
  noche: 'Noche',
}

export const DIA_LABEL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]
