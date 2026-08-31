// ============================================================
// Tipos "legacy" — se mantienen para no romper páginas viejas
// que todavía puedan importarlos. El motor nuevo NO los usa.
// ============================================================
export type Sector = 'cocina' | 'office' | 'menu'
export type EstadoAsignacion = 'fijo' | 'regla' | 'revision' | 'conflicto'

export interface AsignacionVariable {
  id: string
  persona_id: string
  dia: string
  sector: Sector | null
  horario: string | null
  turno: Turno | null
}

export interface Regla {
  id: string
  nombre: string
  activa: boolean
  prioridad: number
  hora_desde: string | null
  hora_hasta: string | null
  sector: Sector | null
}

export const SECTOR_LABEL: Record<Sector, string> = {
  cocina: 'Cocina',
  office: 'Office',
  menu: 'Menú',
}

// ============================================================
// Tipos nuevos — modelo de PUESTOS + PREFERENCIAS (prompt maestro)
// ============================================================

/** Los cuatro bloques del día. "manana" agrupa las Cocina 1-7. */
export type Grupo = 'manana' | 'office' | 'menu' | 'noche'

export type Turno = 'manana' | 'tarde' | 'noche'

export type Color = 'verde' | 'azul' | 'naranja' | 'violeta'

export interface Puesto {
  id: string
  grupo: Grupo
  nombre: string
  color: Color
  sort_order: number
  activo: boolean
}

export interface Persona {
  id: string
  nombre: string
  // legacy, ya no se completan desde la UI nueva pero siguen en la tabla:
  sector: Sector | null
  puesto: string | null
  horario_habitual: string | null
  dias_habituales: string[] | null
  turno: Turno | null
  prioridad: number
  observaciones: string | null
  // nuevo modelo:
  puesto_principal_id: string | null
  puesto_segunda_id: string | null
  puesto_tercera_id: string | null
  es_fijo: boolean
  activo: boolean
}

/** Una fila "Alimentos" cruda detectada en el Excel importado. */
export interface FilaCruda {
  id: string
  hoja: string
  fila: number
  fechaTexto: string | null
  fecha: string | null // ISO yyyy-mm-dd si se pudo resolver
  dia: string | null // Lunes, Martes...
  horario: string | null
  nombre: string | null
  observacion: string | null
}

/** Una persona ya ubicada (o no) en un puesto concreto, un día concreto. */
export interface AsignacionGenerada {
  id: string
  fecha: string
  dia: string
  nombre: string
  personaId: string | null
  puestoId: string | null
  puestoNombre: string | null
  grupo: Grupo | null
  preferenciaUsada: 1 | 2 | 3 | null
  conflicto: boolean
  sinPreferenciasCargadas: boolean
  observaciones: string | null
}

export interface OrganizacionGenerada {
  id?: string
  tipo: 'semanal' | 'mensual'
  fechaInicio: string
  fechaFin: string
  archivoOrigen: string
  asignaciones: AsignacionGenerada[]
  notasPorDia?: Record<string, string>
  resumen: {
    diasEncontrados: number
    personasEncontradas: number
    asignacionesAutomaticas: number
    conflictos: number
    sinPreferencias: number
    /** @deprecated se mantiene en 0 — la pantalla "Inicio" vieja todavía lo lee */
    revisionesNecesarias: number
  }
}

export const GRUPO_LABEL: Record<Grupo, string> = {
  manana: 'Mañana',
  office: 'Office',
  menu: 'Menú',
  noche: 'Noche',
}

export const GRUPO_ORDEN: Grupo[] = ['manana', 'office', 'menu', 'noche']

/** Clases de Tailwind por grupo — verde / azul / naranja / violeta, como pediste. */
interface GrupoEstilo {
  bg: string
  text: string
  border: string
  header: string
  fill: string
  font: string
}

export const GRUPO_COLOR_CLASSES: Record<Grupo, GrupoEstilo> = {
  manana: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    header: 'bg-emerald-600',
    fill: 'FFDCFCE7',
    font: 'FF047857',
  },
  office: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-100',
    header: 'bg-sky-600',
    fill: 'FFE0F2FE',
    font: 'FF0369A1',
  },
  menu: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-100',
    header: 'bg-orange-600',
    fill: 'FFFFEDD5',
    font: 'FFC2410C',
  },
  noche: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-100',
    header: 'bg-violet-600',
    fill: 'FFEDE9FE',
    font: 'FF6D28D9',
  },
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
