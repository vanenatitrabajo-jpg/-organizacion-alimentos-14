import { AsignacionGenerada, Grupo, GRUPO_LABEL, GRUPO_COLOR_CLASSES, GRUPO_ORDEN, Puesto } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'

interface Props {
  titulo?: string
  fechaInicio: string
  fechaFin: string
  asignaciones: AsignacionGenerada[]
  puestos: Puesto[]
  /** Si es true, se puede arrastrar un nombre a otro puesto. */
  editable?: boolean
  onMover?: (asignacionId: string, nuevoPuestoId: string) => void
  notasPorDia?: Record<string, string>
  onNotaChange?: (fecha: string, texto: string) => void
}

export default function CarteleraView({
  titulo = 'Organización de Alimentos',
  fechaInicio,
  fechaFin,
  asignaciones,
  puestos,
  editable,
  onMover,
  notasPorDia,
  onNotaChange,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4">
        {dias.map((fecha) => (
          <DiaCard
            key={fecha}
            fecha={fecha}
            asignaciones={asignaciones.filter((a) => a.fecha === fecha)}
            puestos={puestos}
            editable={editable}
            onMover={onMover}
            nota={notasPorDia?.[fecha] ?? ''}
            onNotaChange={onNotaChange ? (texto) => onNotaChange(fecha, texto) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function DiaCard({
  fecha,
  asignaciones,
  puestos,
  editable,
  onMover,
  nota,
  onNotaChange,
}: {
  fecha: string
  asignaciones: AsignacionGenerada[]
  puestos: Puesto[]
  editable?: boolean
  onMover?: (asignacionId: string, nuevoPuestoId: string) => void
  nota: string
  onNotaChange?: (texto: string) => void
}) {
  const sinPuesto = asignaciones.filter((a) => !a.puestoId)

  return (
    <div className="border border-base-200 rounded-xl2 overflow-hidden break-inside-avoid flex flex-col">
      <div className="bg-ink-900 text-white px-3.5 py-2">
        <p className="font-display font-bold text-sm uppercase tracking-wide">{formatFechaLarga(fecha)}</p>
      </div>

      <div className="p-3.5 flex flex-col gap-3.5">
        {GRUPO_ORDEN.map((grupo) => (
          <BloqueGrupo
            key={grupo}
            grupo={grupo}
            puestosDelGrupo={puestos
              .filter((p) => p.grupo === grupo && p.activo)
              .sort((a, b) => a.sort_order - b.sort_order)}
            asignaciones={asignaciones}
            editable={editable}
            onMover={onMover}
          />
        ))}

        {sinPuesto.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-amber-600">
              Sin puesto — arrastrar a un lugar libre
            </p>
            <div className="flex flex-col gap-1">
              {sinPuesto.map((a) => (
                <div
                  key={a.id}
                  draggable={editable}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', a.id)}
                  title={a.observaciones ?? undefined}
                  className={`rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[12px] font-semibold text-amber-700 ${
                    editable ? 'cursor-grab' : ''
                  }`}
                >
                  ⚠ {a.nombre}
                </div>
              ))}
            </div>
          </div>
        )}

        {onNotaChange && (
          <div className="no-print">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-500">Observaciones</p>
            <textarea
              value={nota}
              onChange={(e) => onNotaChange(e.target.value)}
              rows={2}
              placeholder="Notas para este día…"
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-base-200 bg-base-50 focus:outline-none focus:ring-1 focus:ring-cocina-400"
            />
          </div>
        )}
        {!onNotaChange && nota && (
          <div className="print:block hidden">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Observaciones</p>
            <p className="text-xs text-ink-700">{nota}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BloqueGrupo({
  grupo,
  puestosDelGrupo,
  asignaciones,
  editable,
  onMover,
}: {
  grupo: Grupo
  puestosDelGrupo: Puesto[]
  asignaciones: AsignacionGenerada[]
  editable?: boolean
  onMover?: (asignacionId: string, nuevoPuestoId: string) => void
}) {
  const estilo = GRUPO_COLOR_CLASSES[grupo]

  if (puestosDelGrupo.length === 0) return null

  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${estilo.text}`}>
        {GRUPO_LABEL[grupo]}
      </p>
      <div className="flex flex-col gap-1">
        {puestosDelGrupo.map((puesto) => {
          const asignacion = asignaciones.find((a) => a.puestoId === puesto.id)
          return (
            <div
              key={puesto.id}
              onDragOver={(e) => editable && e.preventDefault()}
              onDrop={(e) => {
                if (!editable || !onMover) return
                e.preventDefault()
                const asigId = e.dataTransfer.getData('text/plain')
                if (asigId) onMover(asigId, puesto.id)
              }}
              className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1 ${estilo.bg} ${estilo.border}`}
            >
              <span className="text-[10px] font-medium opacity-70 shrink-0">{puesto.nombre}</span>
              {asignacion ? (
                <span
                  draggable={editable}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', asignacion.id)}
                  title={asignacion.observaciones ?? undefined}
                  className={`text-[12px] font-semibold ${estilo.text} truncate text-right ${
                    editable ? 'cursor-grab' : ''
                  }`}
                >
                  {asignacion.nombre}
                </span>
              ) : (
                <span className="text-ink-300 text-[12px]">—</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
