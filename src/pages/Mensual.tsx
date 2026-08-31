import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CalendarRange, Loader2, Printer, FileSpreadsheet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useOrgStore } from '../lib/store'
import { OrganizacionGenerada, Puesto } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { exportarExcel } from '../lib/excelExport'
import CarteleraView from '../components/CarteleraView'

/** Parte el rango de fechas en semanas (lunes a domingo) para mostrarlas por separado. */
function agruparPorSemana(fechas: string[]): string[][] {
  const ordenadas = [...fechas].sort()
  const semanas: string[][] = []
  let semanaActual: string[] = []

  for (const fecha of ordenadas) {
    const dow = new Date(fecha + 'T00:00:00').getDay() // 0 = domingo
    if (dow === 1 && semanaActual.length > 0) {
      semanas.push(semanaActual)
      semanaActual = []
    }
    semanaActual.push(fecha)
  }
  if (semanaActual.length > 0) semanas.push(semanaActual)
  return semanas
}

export default function Mensual() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const actual = useOrgStore((s) => s.actual)
  const setActual = useOrgStore((s) => s.setActual)

  const [org, setOrg] = useState<OrganizacionGenerada | null>(actual?.tipo === 'mensual' ? actual : null)
  const [cargando, setCargando] = useState(!!id)
  const [puestos, setPuestos] = useState<Puesto[]>([])

  useEffect(() => {
    supabase
      .from('puestos')
      .select('*')
      .eq('activo', true)
      .then(({ data }) => data && setPuestos(data as Puesto[]))
  }, [])

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
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Organización mensual</h1>
          <p className="text-ink-500 mt-1">
            Del {formatFechaLarga(org.fechaInicio)} al {formatFechaLarga(org.fechaFin)} · {semanas.length} semana
            {semanas.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportarExcel(org.asignaciones, puestos, 'Organización mensual de Alimentos', org.fechaInicio, org.fechaFin)}
            className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
          >
            <FileSpreadsheet size={15} />
            Descargar Excel
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-ink-700 transition-colors"
          >
            <Printer size={15} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {semanas.map((fechas, i) => (
          <div key={i}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2 no-print">
              Semana {i + 1} — {formatFechaLarga(fechas[0])} al {formatFechaLarga(fechas[fechas.length - 1])}
            </p>
            <CarteleraView
              titulo={`Semana ${i + 1}`}
              fechaInicio={fechas[0]}
              fechaFin={fechas[fechas.length - 1]}
              asignaciones={org.asignaciones.filter((a) => fechas.includes(a.fecha))}
              puestos={puestos}
              notasPorDia={org.notasPorDia}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
