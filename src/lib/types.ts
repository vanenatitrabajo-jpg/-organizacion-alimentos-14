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
// Modelo final: solo 2 categorías, decididas por horario.
//   Mañana (hasta 12:15) y Turno tarde (16:00-19:45)  -> Menú
//   Turno mediodía (12:50-14:30) y Turno noche (20:15-21:35) -> Office
// Sin puestos numerados: la cantidad de nombres por categoría
// varía cada día.
// ============================================================
export type Categoria = 'menu' | 'office'

export type Turno = 'manana' | 'tarde' | 'noche'

export interface Persona {
  id: string
  nombre: string
  /** Personal fijo: a qué categoría pertenece habitualmente. null = todavía sin clasificar. */
  categoria_fija: Categoria | null
  observaciones: string | null
  activo: boolean
  // columnas legacy de versiones anteriores del modelo, ya no se usan:
  sector: Sector | null
  puesto: string | null
  horario_habitual: string | null
  dias_habituales: string[] | null
  turno: Turno | null
  prioridad: number
  puesto_principal_id: string | null
  puesto_segunda_id: string | null
  puesto_tercera_id: string | null
  es_fijo: boolean
}

/** Una fila "Alimentos" cruda detectada en el Excel, una por persona por bloque horario. */
export interface FilaCruda {
  id: string
  hoja: string
  fecha: string | null // ISO yyyy-mm-dd si se pudo resolver
  dia: string | null // Lunes, Martes...
  horarioTexto: string // ej "12:50 a 14:30"
  nombreCrudo: string // tal cual apareció en la celda (puede traer horario embebido)
  nombre: string // limpio, sin horario embebido
}

/** Una persona ya ubicada en Menú u Office, un día concreto. */
export interface AsignacionGenerada {
  id: string
  fecha: string
  dia: string
  nombre: string
  personaId: string | null
  categoria: Categoria
  horarioTexto: string
  /** true si el nombre no coincide con nadie en "Personal de Alimentos" — hay que revisar. */
  esPersonaNueva: boolean
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
    personasNuevas: number
    /** @deprecated — se mantienen en 0, por si "Inicio" u otra pantalla vieja los sigue leyendo */
    asignacionesAutomaticas: number
    conflictos: number
    sinPreferencias: number
    revisionesNecesarias: number
  }
}

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  menu: 'Menú',
  office: 'Office',
}

export const CATEGORIA_ORDEN: Categoria[] = ['menu', 'office']

interface CategoriaEstilo {
  bg: string
  text: string
  border: string
  header: string
  fill: string
  font: string
}

/** Menú = verde, Office = azul. */
export const CATEGORIA_COLOR_CLASSES: Record<Categoria, CategoriaEstilo> = {
  menu: {
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
