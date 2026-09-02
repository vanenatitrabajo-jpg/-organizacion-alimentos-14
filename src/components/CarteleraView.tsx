import { AsignacionGenerada, Categoria, CATEGORIA_COLOR_CLASSES, CATEGORIA_LABEL, CATEGORIA_ORDEN } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { compararHorarios } from '../lib/motor'

interface Props {
  titulo?: string
  fechaInicio: string
  fechaFin: string
  asignaciones: AsignacionGenerada[]
  notasPorDia?: Record<string, string>
  onNotaChange?: (fecha: string, texto: string) => void
  /** Cuando se pasa, permite resolver una persona nueva (⚠) eligiendo Menú u Office. */
  onResolverNueva?: (nombre: string, categoria: Categoria) => void
}

export default function CarteleraView({
  titulo = 'Organización de Alimentos',
  fechaInicio,
  fechaFin,
  asignaciones,
  notasPorDia,
  onNotaChange,
  onResolverNueva,
}: Props) {
  const dias = Array.from(new Set(asignaciones.map((a) => a.fecha))).sort()

  return (
    <div className="bg-white p-6 print:p-0">
      <div className="mb-5 print:mb-4">
        <h2 className="font-display text-xl font-bold text-ink-900 uppercase tracking-tight">{titulo}</h2>
        <p className="text-ink-500 text-sm">
          Del {formatFechaLarga(fechaInicio)} al {formatFechaLarga(fechaFin)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-4 gap-3">
        {dias.map((fecha) => (
          <DiaCard
            key={fecha}
            fecha={fecha}
            asignaciones={asignaciones.filter((a) => a.fecha === fecha)}
            nota={notasPorDia?.[fecha] ?? ''}
            onNotaChange={onNotaChange ? (texto) => onNotaChange(fecha, texto) : undefined}
            onResolverNueva={onResolverNueva}
          />
        ))}
      </div>
    </div>
  )
}

interface Grupo {
  horario: string
  categoria: Categoria
  asignaciones: AsignacionGenerada[]
}

/**
 * Agrupa por horario Y categoría (no solo por horario), porque un mismo
 * bloque horario puede tener gente de Menú y gente de Office mezclada
 * (cuando alguien tiene categoría fija que no coincide con lo que el
 * horario sugeriría). Así cada fila muestra una sola categoría, correcta
 * para toda la gente listada en ella.
 */
function agruparPorHorarioYCategoria(asignaciones: AsignacionGenerada[]): Grupo[] {
  const horarios = Array.from(new Set(asignaciones.map((a) => a.horarioTexto))).sort(compararHorarios)
  const grupos: Grupo[] = []

  for (const horario of horarios) {
    for (const categoria of CATEGORIA_ORDEN) {
      const deEsteGrupo = asignaciones.filter((a) => a.horarioTexto === horario && a.categoria === categoria)
      if (deEsteGrupo.length > 0) {
        grupos.push({ horario, categoria, asignaciones: deEsteGrupo })
      }
    }
  }

  return grupos
}

function DiaCard({
  fecha,
  asignaciones,
  nota,
  onNotaChange,
  onResolverNueva,
}: {
  fecha: string
  asignaciones: AsignacionGenerada[]
  nota: string
  onNotaChange?: (texto: string) => void
  onResolverNueva?: (nombre: string, categoria: Categoria) => void
}) {
  const grupos = agruparPorHorarioYCategoria(asignaciones)

  return (
    <div className="border border-base-200 rounded-xl2 overflow-hidden break-inside-avoid flex flex-col">
      <div className="bg-ink-900 text-white px-3 py-1.5">
        <p className="font-display font-bold text-xs uppercase tracking-wide">{formatFechaLarga(fecha)}</p>
      </div>

      <div className="p-2 flex flex-col gap-1">
        {grupos.map((grupo) => {
          const estilo = CATEGORIA_COLOR_CLASSES[grupo.categoria]
          return (
            <div
              key={`${grupo.horario}-${grupo.categoria}`}
              className={`rounded-md border ${estilo.border} ${estilo.bg} px-2 py-1`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-ink-700 shrink-0">{grupo.horario}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${estilo.text} shrink-0`}>
                  {CATEGORIA_LABEL[grupo.categoria]}
                </span>
              </div>
              <div className="text-[11px] leading-snug text-ink-900 mt-0.5 flex flex-wrap gap-x-1 gap-y-1">
                {grupo.asignaciones.map((a, i) => (
                  <span key={a.id} className="inline-flex items-center gap-1">
                    <span className={a.esPersonaNueva ? 'text-amber-600 font-semibold' : ''}>
                      {a.esPersonaNueva && '⚠ '}
                      {a.nombre}
                      {i < grupo.asignaciones.length - 1 ? ',' : ''}
                    </span>
                    {a.esPersonaNueva && onResolverNueva && (
                      <span className="no-print inline-flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => onResolverNueva(a.nombre, 'menu')}
                          className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                          title="Poner en Menú"
                        >
                          Menú
                        </button>
                        <button
                          type="button"
                          onClick={() => onResolverNueva(a.nombre, 'office')}
                          className="text-[8px] font-bold px-1 py-0.5 rounded bg-sky-500 text-white hover:bg-sky-600"
                          title="Poner en Office"
                        >
                          Office
                        </button>
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {onNotaChange && (
          <div className="no-print mt-1">
            <textarea
              value={nota}
              onChange={(e) => onNotaChange(e.target.value)}
              rows={2}
              placeholder="Observaciones…"
              className="w-full text-[11px] px-2 py-1 rounded-md border border-base-200 bg-base-50 focus:outline-none focus:ring-1 focus:ring-cocina-400"
            />
          </div>
        )}
        {!onNotaChange && nota && (
          <div className="print:block hidden mt-1">
            <p className="text-[10px] text-ink-700">{nota}</p>
          </div>
        )}
      </div>
    </div>
  )
}
