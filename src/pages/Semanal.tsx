import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  LayoutGrid,
  Table2,
  Printer,
  FileSpreadsheet,
  CalendarDays,
  Loader2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useOrgStore } from '../lib/store'
import { OrganizacionGenerada, Sector, SECTOR_LABEL } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { exportarExcel } from '../lib/excelExport'
import CarteleraView from '../components/CarteleraView'

const SECTOR_TINT: Record<Sector, string> = {
  cocina: 'bg-cocina-50 text-cocina-600',
  office: 'bg-office-50 text-office-600',
  menu: 'bg-menu-50 text-menu-600',
}

export default function Semanal() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const actual = useOrgStore((s) => s.actual)
  const setActual = useOrgStore((s) => s.setActual)

  const [org, setOrg] = useState<OrganizacionGenerada | null>(actual)
  const [cargando, setCargando] = useState(!!id)
  const [vista, setVista] = useState<'digital' | 'cartelera'>('digital')
  const [busqueda, setBusqueda] = useState('')
  const [filtroSector, setFiltroSector] = useState<Sector | 'todos'>('todos')

  useEffect(() => {
    if (!id) {
      setOrg(actual)
      return
    }
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

  const asignacionesFiltradas = useMemo(() => {
    if (!org) return []
    return org.asignaciones.filter((a) => {
      if (filtroSector !== 'todos' && a.sector !== filtroSector) return false
      if (busqueda.trim() && !a.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())) return false
      return true
    })
  }, [org, busqueda, filtroSector])

  const dias = useMemo(() => {
    if (!org) return []
    return Array.from(new Set(asignacionesFiltradas.map((a) => a.fecha).filter(Boolean))).sort() as string[]
  }, [org, asignacionesFiltradas])

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
          <CalendarDays className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">Todavía no generaste una organización</p>
          <p className="text-ink-500 text-sm mt-1 mb-4">Importá un Excel para ver acá la organización semanal.</p>
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
    <div className="p-8 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Organización semanal</h1>
          <p className="text-ink-500 mt-1">
            Semana del {formatFechaLarga(org.fechaInicio)} al {formatFechaLarga(org.fechaFin)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setVista(vista === 'digital' ? 'cartelera' : 'digital')}
            className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
          >
            {vista === 'digital' ? <LayoutGrid size={15} /> : <Table2 size={15} />}
            {vista === 'digital' ? 'Vista cartelera' : 'Vista digital'}
          </button>
          <button
            onClick={() => exportarExcel(org.asignaciones, 'Organización de Alimentos', org.fechaInicio, org.fechaFin)}
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

      <div className="flex flex-wrap gap-3 mb-6 no-print">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={15} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar persona…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-base-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cocina-400"
          />
        </div>
        <div className="flex gap-1.5">
          {(['todos', 'cocina', 'office', 'menu'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroSector(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filtroSector === s ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 border border-base-300'
              }`}
            >
              {s === 'todos' ? 'Todos' : SECTOR_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {vista === 'digital' ? (
        <div className="print:hidden">
          <VistaDigital dias={dias} asignaciones={asignacionesFiltradas} />
        </div>
      ) : (
        <CarteleraView
          titulo="Organización de Alimentos"
          fechaInicio={org.fechaInicio}
          fechaFin={org.fechaFin}
          asignaciones={asignacionesFiltradas}
        />
      )}

      {/* Siempre disponible para impresión, sin importar la vista elegida en pantalla */}
      <div id="cartelera-print" className="hidden print:block">
        <CarteleraView
          titulo="Organización de Alimentos"
          fechaInicio={org.fechaInicio}
          fechaFin={org.fechaFin}
          asignaciones={org.asignaciones}
        />
      </div>
    </div>
  )
}

function VistaDigital({ dias, asignaciones }: { dias: string[]; asignaciones: OrganizacionGenerada['asignaciones'] }) {
  if (dias.length === 0) {
    return <p className="text-ink-500 text-sm">No hay asignaciones que coincidan con la búsqueda.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {dias.map((fecha) => {
        const delDia = asignaciones.filter((a) => a.fecha === fecha)
        const horarios = Array.from(new Set(delDia.map((a) => a.horario ?? '(sin horario)'))).sort()

        return (
          <div key={fecha} className="bg-white rounded-xl2 shadow-soft overflow-hidden">
            <div className="bg-ink-900 text-white px-5 py-2.5">
              <p className="font-display font-semibold text-sm uppercase">{formatFechaLarga(fecha)}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 text-xs uppercase border-b border-base-200">
                  <th className="px-5 py-2 font-medium">Horario</th>
                  <th className="px-5 py-2 font-medium">Cocina</th>
                  <th className="px-5 py-2 font-medium">Office</th>
                  <th className="px-5 py-2 font-medium">Menú</th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((horario) => {
                  const fila = delDia.filter((a) => (a.horario ?? '(sin horario)') === horario)
                  const porSector: Record<Sector, string[]> = { cocina: [], office: [], menu: [] }
                  fila.forEach((a) => a.sector && porSector[a.sector].push(a.nombre))
                  return (
                    <tr key={horario} className="border-b border-base-100 last:border-0">
                      <td className="px-5 py-2.5 font-medium text-ink-900 whitespace-nowrap">{horario}</td>
                      <td className="px-5 py-2.5">
                        <NombresCelda nombres={porSector.cocina} tint={SECTOR_TINT.cocina} />
                      </td>
                      <td className="px-5 py-2.5">
                        <NombresCelda nombres={porSector.office} tint={SECTOR_TINT.office} />
                      </td>
                      <td className="px-5 py-2.5">
                        <NombresCelda nombres={porSector.menu} tint={SECTOR_TINT.menu} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function NombresCelda({ nombres, tint }: { nombres: string[]; tint: string }) {
  if (nombres.length === 0) return <span className="text-ink-300">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {nombres.map((n) => (
        <span key={n} className={`px-2 py-0.5 rounded-full text-xs font-medium ${tint}`}>
          {n}
        </span>
      ))}
    </div>
  )
}
