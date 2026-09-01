import { AsignacionGenerada, CATEGORIA_COLOR_CLASSES, CATEGORIA_LABEL, CATEGORIA_ORDEN } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'

interface Props {
  titulo?: string
  fechaInicio: string
  fechaFin: string
  asignaciones: AsignacionGenerada[]
  editable?: boolean
  onMover?: (asignacionId: string, nuevaCategoria: 'menu' | 'office') => void
  notasPorDia?: Record<string, string>
  onNotaChange?: (fecha: string, texto: string) => void
}

export default function CarteleraView({
  titulo = 'Organización de Alimentos',
  fechaInicio,
  fechaFin,
  asignaciones,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-4 gap-4">
        {dias.map((fecha) => (
          <DiaCard
            key={fecha}
            fecha={fecha}
            asignaciones={asignaciones.filter((a) => a.fecha === fecha)}
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
  editable,
  onMover,
  nota,
  onNotaChange,
}: {
  fecha: string
  asignaciones: AsignacionGenerada[]
  editable?: boolean
  onMover?: (asignacionId: string, nuevaCategoria: 'menu' | 'office') => void
  nota: string
  onNotaChange?: (texto: string) => void
}) {
  return (
    <div className="border border-base-200 rounded-xl2 overflow-hidden break-inside-avoid flex flex-col">
      <div className="bg-ink-900 text-white px-3.5 py-2">
        <p className="font-display font-bold text-sm uppercase tracking-wide">{formatFechaLarga(fecha)}</p>
      </div>

      <div className="p-3.5 flex flex-col gap-3.5">
        {CATEGORIA_ORDEN.map((categoria) => (
          <BloqueCategoria
            key={categoria}
            categoria={categoria}
            asignaciones={asignaciones.filter((a) => a.categoria === categoria)}
            editable={editable}
            onMover={onMover}
          />
        ))}

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

function BloqueCategoria({
  categoria,
  asignaciones,
  editable,
  onMover,
}: {
  categoria: 'menu' | 'office'
  asignaciones: AsignacionGenerada[]
  editable?: boolean
  onMover?: (asignacionId: string, nuevaCategoria: 'menu' | 'office') => void
}) {
  const estilo = CATEGORIA_COLOR_CLASSES[categoria]

  return (
    <div
      onDragOver={(e) => editable && e.preventDefault()}
      onDrop={(e) => {
        if (!editable || !onMover) return
        e.preventDefault()
        const asigId = e.dataTransfer.getData('text/plain')
        if (asigId) onMover(asigId, categoria)
      }}
      className={`rounded-lg border ${estilo.border} ${estilo.bg} p-2 min-h-[52px]`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${estilo.text}`}>
        {CATEGORIA_LABEL[categoria]} {asignaciones.length > 0 && `(${asignaciones.length})`}
      </p>
      {asignaciones.length === 0 ? (
        <p className="text-ink-300 text-[12px]">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {asignaciones.map((a) => (
            <span
              key={a.id}
              draggable={editable}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', a.id)}
              title={`${a.horarioTexto}${a.observaciones ? ' — ' + a.observaciones : ''}`}
              className={`px-2 py-1 rounded-full text-[12px] font-semibold ${estilo.text} bg-white border ${
                estilo.border
              } ${editable ? 'cursor-grab' : ''} ${a.esPersonaNueva ? 'ring-2 ring-amber-400' : ''}`}
            >
              {a.esPersonaNueva && '⚠ '}
              {a.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
