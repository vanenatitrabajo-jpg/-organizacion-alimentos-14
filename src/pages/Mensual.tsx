import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CalendarRange, Loader2, Printer, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useOrgStore } from '../lib/store'
import { OrganizacionGenerada } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { exportarExcelSemanal, Orientacion } from '../lib/excelExport'
import CarteleraView from '../components/CarteleraView'

function agruparPorSemana(fechas: string[]): string[][] {
  const ordenadas = [...fechas].sort()
  const semanas: string[][] = []
  let semanaActual: string[] = []

  for (const fecha of ordenadas) {
    const dow = new Date(fecha + 'T00:00:00').getDay()
    if (dow === 1 && semanaActual.length > 0) {
      semanas.push(semanaActual)
      semanaActual = []
    }
    semanaActual.push(fecha)
  }
  if (semanaActual.length > 0) semanas.push(semanaActual)
  return semanas
}

/** true si la semana NO arranca lunes o NO termina domingo (le faltan días del mes vecino). */
function semanaIncompleta(fechas: string[]): boolean {
  const primerDow = new Date(fechas[0] + 'T00:00:00').getDay()
  const ultimoDow = new Date(fechas[fechas.length - 1] + 'T00:00:00').getDay()
  return primerDow !== 1 || ultimoDow !== 0
}

export default function Mensual() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const actual = useOrgStore((s) => s.actual)
  const setActual = useOrgStore((s) => s.setActual)

  const [org, setOrg] = useState<OrganizacionGenerada | null>(actual?.tipo === 'mensual' ? actual : null)
  const [cargando, setCargando] = useState(!!id)
  const [orientacion, setOrientacion] = useState<Orientacion>('portrait')
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(0)

  useEffect(() => {
    if (!id) return
    setCargando(true)
    supabase
      .from('organizaciones')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          const cargada = data.datos as OrganizacionGenerada
          setOrg({ ...cargada, id: data.id })
          setActual({ ...cargada, id: data.id })
        }
        setCargando(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const semanas = useMemo(() => {
    if (!org) return []
    const fechas = Array.from(new Set(org.asignaciones.map((a) => a.fecha)))
    return agruparPorSemana(fechas)
  }, [org])

  const fechasSemana = semanas[semanaSeleccionada] ?? []
  const asignacionesSemana = org ? org.asignaciones.filter((a) => fechasSemana.includes(a.fecha)) : []
  const incompleta = fechasSemana.length > 0 && semanaIncompleta(fechasSemana)

  if (cargando) {
    return (
      <div className="p-8 flex items-center gap-2 text-ink-500 text-sm">
        <Loader2 className="animate-spin" size={16} />
        Cargando organización…
      </div>
    )
  }

  if (!org) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto mt-16 bg-white rounded-xl2 shadow-card p-10 text-center flex flex-col items-center">
          <CalendarRange className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">Todavía no generaste una organización mensual</p>
          <p className="text-ink-500 text-sm mt-1 mb-4">
            Importá el Excel del mes y elegí "Generar mensual" para verla acá.
          </p>
          <Link
            to="/importar"
            className="text-sm font-medium text-white bg-ink-900 px-4 py-2 rounded-lg hover:bg-ink-700 transition-colors"
          >
            Importar Excel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Organización mensual</h1>
          <p className="text-ink-500 mt-1">
            Del {formatFechaLarga(org.fechaInicio)} al {formatFechaLarga(org.fechaFin)} · {semanas.length} semana
            {semanas.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl2 shadow-soft p-4 mb-6 no-print flex flex-wrap items-center gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-500">Semana a ver / descargar</span>
          <select
            value={semanaSeleccionada}
            onChange={(e) => setSemanaSeleccionada(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-base-300 bg-white text-sm font-medium min-w-[220px]"
          >
            {semanas.map((fechas, i) => (
              <option key={i} value={i}>
                Semana {i + 1} — {formatFechaLarga(fechas[0])} al {formatFechaLarga(fechas[fechas.length - 1])}
                {semanaIncompleta(fechas) ? ' (incompleta)' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex rounded-lg border border-base-300 overflow-hidden">
          <button
            onClick={() => setOrientacion('portrait')}
            className={`px-2.5 py-2 text-xs font-medium transition-colors ${
              orientacion === 'portrait' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700'
            }`}
          >
            Vertical
          </button>
          <button
            onClick={() => setOrientacion('landscape')}
            className={`px-2.5 py-2 text-xs font-medium transition-colors ${
              orientacion === 'landscape' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700'
            }`}
          >
            Horizontal
          </button>
        </div>

        <button
          onClick={() =>
            exportarExcelSemanal(
              asignacionesSemana,
              `Organización de Alimentos — Semana ${semanaSeleccionada + 1}`,
              fechasSemana[0],
              fechasSemana[fechasSemana.length - 1],
              orientacion
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
        >
          <FileSpreadsheet size={15} />
          Descargar esta semana
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-ink-700 transition-colors"
        >
          <Printer size={15} />
          Imprimir esta semana / PDF
        </button>
      </div>

      {incompleta && (
        <div className="no-print mb-6 bg-amber-50 border border-amber-200 rounded-xl2 p-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            Esta semana no arranca lunes o no termina domingo — le faltan días de otro mes.{' '}
            <Link to="/importar" className="underline font-medium">
              Volvé a Importar
            </Link>{' '}
            y agregá el archivo del mes vecino para completarla.
          </div>
        </div>
      )}

      <div className="print:hidden">
        <CarteleraView
          titulo={`Semana ${semanaSeleccionada + 1}`}
          fechaInicio={fechasSemana[0]}
          fechaFin={fechasSemana[fechasSemana.length - 1]}
          asignaciones={asignacionesSemana}
          notasPorDia={org.notasPorDia}
        />
      </div>

      <div id="cartelera-print" className="hidden print:block">
        <CarteleraView
          titulo={`Semana ${semanaSeleccionada + 1}`}
          fechaInicio={fechasSemana[0]}
          fechaFin={fechasSemana[fechasSemana.length - 1]}
          asignaciones={asignacionesSemana}
          notasPorDia={org.notasPorDia}
        />
      </div>
    </div>
  )
}
