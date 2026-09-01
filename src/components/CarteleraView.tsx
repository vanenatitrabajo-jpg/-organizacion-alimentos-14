import { AsignacionGenerada, CATEGORIA_COLOR_CLASSES, CATEGORIA_LABEL } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { compararHorarios } from '../lib/motor'

interface Props {
  titulo?: string
  fechaInicio: string
  fechaFin: string
  asignaciones: AsignacionGenerada[]
  notasPorDia?: Record<string, string>
  onNotaChange?: (fecha: string, texto: string) => void
}

export default function CarteleraView({
  titulo = 'Organización de Alimentos',
  fechaInicio,
  fechaFin,
  asignaciones,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-4 gap-3">
        {dias.map((fecha) => (
          <DiaCard
            key={fecha}
            fecha={fecha}
            asignaciones={asignaciones.filter((a) => a.fecha === fecha)}
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
  nota,
  onNotaChange,
}: {
  fecha: string
  asignaciones: AsignacionGenerada[]
  nota: string
  onNotaChange?: (texto: string) => void
}) {
  const horarios = Array.from(new Set(asignaciones.map((a) => a.horarioTexto))).sort(
    compararHorarios
  )

  return (
    <div className="border border-base-200 rounded-xl2 overflow-hidden break-inside-avoid flex flex-col">
      <div className="bg-ink-900 text-white px-3 py-1.5">
        <p className="font-display font-bold text-xs uppercase tracking-wide">{formatFechaLarga(fecha)}</p>
      </div>

      <div className="p-2 flex flex-col gap-1">
        {horarios.map((horario) => {
          const deEsteHorario = asignaciones.filter((a) => a.horarioTexto === horario)
          const categoria = deEsteHorario[0]?.categoria ?? 'menu'
          const estilo = CATEGORIA_COLOR_CLASSES[categoria]
          return (
            <div key={horario} className={`rounded-md border ${estilo.border} ${estilo.bg} px-2 py-1`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-ink-700 shrink-0">{horario}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${estilo.text} shrink-0`}>
                  {CATEGORIA_LABEL[categoria]}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-ink-900 mt-0.5">
                {deEsteHorario.map((a, i) => (
                  <span key={a.id} className={a.esPersonaNueva ? 'text-amber-600 font-semibold' : ''}>
                    {a.esPersonaNueva && '⚠ '}
                    {a.nombre}
                    {i < deEsteHorario.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
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
