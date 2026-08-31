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
  Undo2,
  Save,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useOrgStore } from '../lib/store'
import { OrganizacionGenerada, Puesto, GRUPO_LABEL, GRUPO_ORDEN, Grupo } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { exportarExcel } from '../lib/excelExport'
import CarteleraView from '../components/CarteleraView'

export default function Semanal() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const actual = useOrgStore((s) => s.actual)
  const setActual = useOrgStore((s) => s.setActual)

  const [org, setOrg] = useState<OrganizacionGenerada | null>(actual)
  const [historial, setHistorial] = useState<OrganizacionGenerada[]>([])
  const [cargando, setCargando] = useState(!!id)
  const [vista, setVista] = useState<'digital' | 'cartelera'>('cartelera')
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState<Grupo | 'todos'>('todos')
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [guardandoCambios, setGuardandoCambios] = useState(false)
  const [huboEdicion, setHuboEdicion] = useState(false)

  useEffect(() => {
    supabase
      .from('puestos')
      .select('*')
      .eq('activo', true)
      .then(({ data }) => data && setPuestos(data as Puesto[]))
  }, [])

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

  function moverAsignacion(asignacionId: string, nuevoPuestoId: string) {
    if (!org) return
    setHistorial((h) => [...h, org])
    setHuboEdicion(true)

    const puesto = puestos.find((p) => p.id === nuevoPuestoId)
    if (!puesto) return

    setOrg((prev) => {
      if (!prev) return prev
      const asigMovida = prev.asignaciones.find((a) => a.id === asignacionId)
      if (!asigMovida) return prev

      const nuevas = prev.asignaciones.map((a) => {
        // Si ya había alguien en el puesto destino ese día, lo deja "sin puesto".
        if (a.id !== asignacionId && a.fecha === asigMovida.fecha && a.puestoId === nuevoPuestoId) {
          return { ...a, puestoId: null, puestoNombre: null, grupo: null, conflicto: true }
        }
        if (a.id === asignacionId) {
          return {
            ...a,
            puestoId: puesto.id,
            puestoNombre: puesto.nombre,
            grupo: puesto.grupo,
            conflicto: false,
            preferenciaUsada: null,
            observaciones: 'Reasignado manualmente.',
          }
        }
        return a
      })
      const actualizada = { ...prev, asignaciones: nuevas }
      setActual(actualizada)
      return actualizada
    })
  }

  function deshacer() {
    setHistorial((h) => {
      if (h.length === 0) return h
      const anterior = h[h.length - 1]
      setOrg(anterior)
      setActual(anterior)
      return h.slice(0, -1)
    })
  }

  function cambiarNota(fecha: string, texto: string) {
    setOrg((prev) => {
      if (!prev) return prev
      const actualizada = { ...prev, notasPorDia: { ...(prev.notasPorDia ?? {}), [fecha]: texto } }
      setActual(actualizada)
      return actualizada
    })
  }

  async function guardarCambios() {
    if (!org?.id) return
    setGuardandoCambios(true)
    await supabase.from('organizaciones').update({ datos: org }).eq('id', org.id)
    setGuardandoCambios(false)
    setHuboEdicion(false)
  }

  const asignacionesFiltradas = useMemo(() => {
    if (!org) return []
    return org.asignaciones.filter((a) => {
      if (filtroGrupo !== 'todos' && a.grupo !== filtroGrupo) return false
      if (busqueda.trim() && !a.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())) return false
      return true
    })
  }, [org, busqueda, filtroGrupo])

  const dias = useMemo(() => {
    if (!org) return []
    return Array.from(new Set(asignacionesFiltradas.map((a) => a.fecha))).sort()
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
    <div className="p-8 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Organización semanal</h1>
          <p className="text-ink-500 mt-1">
            Semana del {formatFechaLarga(org.fechaInicio)} al {formatFechaLarga(org.fechaFin)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {huboEdicion && org.id && (
            <button
              onClick={guardarCambios}
              disabled={guardandoCambios}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3.5 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {guardandoCambios ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
              Guardar cambios
            </button>
          )}
          {historial.length > 0 && (
            <button
              onClick={deshacer}
              className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
            >
              <Undo2 size={15} />
              Deshacer
            </button>
          )}
          <button
            onClick={() => setVista(vista === 'digital' ? 'cartelera' : 'digital')}
            className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
          >
            {vista === 'digital' ? <LayoutGrid size={15} /> : <Table2 size={15} />}
            {vista === 'digital' ? 'Vista cartelera' : 'Vista digital'}
          </button>
          <button
            onClick={() => exportarExcel(org.asignaciones, puestos, 'Organización de Alimentos', org.fechaInicio, org.fechaFin)}
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
          {(['todos', ...GRUPO_ORDEN] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFiltroGrupo(g)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filtroGrupo === g ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 border border-base-300'
              }`}
            >
              {g === 'todos' ? 'Todos' : GRUPO_LABEL[g]}
            </button>
          ))}
        </div>
      </div>

      {vista === 'cartelera' ? (
        <div className="print:hidden">
          <CarteleraView
            fechaInicio={org.fechaInicio}
            fechaFin={org.fechaFin}
            asignaciones={asignacionesFiltradas}
            puestos={puestos}
            editable
            onMover={moverAsignacion}
            notasPorDia={org.notasPorDia}
            onNotaChange={cambiarNota}
          />
        </div>
      ) : (
        <div className="print:hidden">
          <VistaDigital dias={dias} asignaciones={asignacionesFiltradas} />
        </div>
      )}

      {/* Siempre disponible para impresión, sin importar la vista elegida en pantalla */}
      <div id="cartelera-print" className="hidden print:block">
        <CarteleraView
          fechaInicio={org.fechaInicio}
          fechaFin={org.fechaFin}
          asignaciones={org.asignaciones}
          puestos={puestos}
          notasPorDia={org.notasPorDia}
        />
      </div>
    </div>
  )
}

function VistaDigital({
  dias,
  asignaciones,
}: {
  dias: string[]
  asignaciones: OrganizacionGenerada['asignaciones']
}) {
  if (dias.length === 0) {
    return <p className="text-ink-500 text-sm">No hay asignaciones que coincidan con la búsqueda.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {dias.map((fecha) => {
        const delDia = asignaciones.filter((a) => a.fecha === fecha)
        return (
          <div key={fecha} className="bg-white rounded-xl2 shadow-soft overflow-hidden">
            <div className="bg-ink-900 text-white px-5 py-2.5">
              <p className="font-display font-semibold text-sm uppercase">{formatFechaLarga(fecha)}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 text-xs uppercase border-b border-base-200">
                  <th className="px-5 py-2 font-medium">Persona</th>
                  <th className="px-5 py-2 font-medium">Puesto</th>
                  <th className="px-5 py-2 font-medium">Bloque</th>
                  <th className="px-5 py-2 font-medium">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {delDia.map((a) => (
                  <tr key={a.id} className="border-b border-base-100 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink-900 whitespace-nowrap">{a.nombre}</td>
                    <td className="px-5 py-2.5">{a.puestoNombre ?? <span className="text-amber-600">Sin asignar</span>}</td>
                    <td className="px-5 py-2.5">{a.grupo ? GRUPO_LABEL[a.grupo] : '—'}</td>
                    <td className="px-5 py-2.5 text-ink-500 text-xs">{a.observaciones ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
