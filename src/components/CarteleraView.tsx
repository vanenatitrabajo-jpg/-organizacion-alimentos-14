import { Asignacion, Sector, SECTOR_LABEL, Turno, TURNO_LABEL } from '../lib/types'
import { formatFechaLarga, clasificarTurno } from '../lib/dateUtils'

const SECTOR_STYLE: Record<Sector, string> = {
  cocina: 'bg-cocina-50 border-cocina-100 text-cocina-600',
  office: 'bg-office-50 border-office-100 text-office-600',
  menu: 'bg-menu-50 border-menu-100 text-menu-600',
}

const TURNO_ORDEN: Turno[] = ['manana', 'tarde', 'noche']
const TURNO_ICONO: Record<Turno, string> = { manana: '☀', tarde: '🍽', noche: '🌙' }

export default function CarteleraView({
  titulo,
  fechaInicio,
  fechaFin,
  asignaciones,
}: {
  titulo: string
  fechaInicio: string
  fechaFin: string
  asignaciones: Asignacion[]
}) {
  const dias = Array.from(new Set(asignaciones.map((a) => a.fecha).filter(Boolean))).sort() as string[]

  return (
    <div className="bg-white p-6 print:p-0">
      <div className="mb-5 print:mb-4">
        <h2 className="font-display text-xl font-bold text-ink-900 uppercase tracking-tight">{titulo}</h2>
        <p className="text-ink-500 text-sm">
          Semana del {formatFechaLarga(fechaInicio)} al {formatFechaLarga(fechaFin)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4">
        {dias.map((fecha) => (
          <DiaCard key={fecha} fecha={fecha} asignaciones={asignaciones.filter((a) => a.fecha === fecha)} />
        ))}
      </div>
    </div>
  )
}

function DiaCard({ fecha, asignaciones }: { fecha: string; asignaciones: Asignacion[] }) {
  const porTurno: Record<Turno, Asignacion[]> = { manana: [], tarde: [], noche: [] }
  asignaciones.forEach((a) => {
    const t = a.turno ?? (a.horario ? clasificarTurno(a.horario) : 'manana')
    porTurno[t].push(a)
  })

  return (
    <div className="border border-base-200 rounded-xl2 overflow-hidden break-inside-avoid">
      <div className="bg-ink-900 text-white px-3.5 py-2">
        <p className="font-display font-bold text-sm uppercase tracking-wide">{formatFechaLarga(fecha)}</p>
      </div>
      <div className="p-3.5 flex flex-col gap-3.5">
        {TURNO_ORDEN.filter((t) => porTurno[t].length > 0).map((turno) => (
          <div key={turno}>
            <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1.5">
              {TURNO_ICONO[turno]} {TURNO_LABEL[turno]}
            </p>
            <BloquePorHorario asignaciones={porTurno[turno]} />
          </div>
        ))}
        {asignaciones.length === 0 && <p className="text-ink-500 text-xs">Sin asignaciones</p>}
      </div>
    </div>
  )
}

function BloquePorHorario({ asignaciones }: { asignaciones: Asignacion[] }) {
  const horarios = Array.from(new Set(asignaciones.map((a) => a.horario ?? '(sin horario)'))).sort()

  return (
    <div className="flex flex-col gap-2">
      {horarios.map((horario) => {
        const deEsteHorario = asignaciones.filter((a) => (a.horario ?? '(sin horario)') === horario)
        const porSector: Record<Sector, Asignacion[]> = { cocina: [], office: [], menu: [] }
        deEsteHorario.forEach((a) => {
          if (a.sector) porSector[a.sector].push(a)
        })

        return (
          <div key={horario}>
            <p className="text-xs font-semibold text-ink-900">{horario}</p>
            <div className="flex flex-col gap-1 mt-1">
              {(Object.keys(porSector) as Sector[])
                .filter((s) => porSector[s].length > 0)
                .map((sector) => (
                  <div key={sector} className={`rounded-lg border px-2 py-1 ${SECTOR_STYLE[sector]}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                      {SECTOR_LABEL[sector]}
                    </span>
                    <p className="text-[13px] font-semibold leading-snug">
                      {porSector[sector].map((a) => a.nombre).join(' · ')}
                    </p>
                  </div>
                ))}
              {deEsteHorario.some((a) => !a.sector) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Revisar</span>
                  <p className="text-[13px] font-semibold leading-snug text-amber-700">
                    {deEsteHorario.filter((a) => !a.sector).map((a) => a.nombre).join(' · ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
