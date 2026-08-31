import { FormEvent, useEffect, useState } from 'react'
import { Settings2, Plus, Trash2, X, Loader2, Power } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Puesto, Grupo, GRUPO_LABEL, GRUPO_ORDEN, GRUPO_COLOR_CLASSES, Color } from '../lib/types'

const COLOR_POR_GRUPO: Record<Grupo, Color> = {
  manana: 'verde',
  office: 'azul',
  menu: 'naranja',
  noche: 'violeta',
}

export default function Puestos() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [grupo, setGrupo] = useState<Grupo>('manana')

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('puestos').select('*').order('grupo').order('sort_order')
    if (data) setPuestos(data as Puesto[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirForm() {
    setNombre('')
    setGrupo('manana')
    setMostrarForm(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setGuardando(true)
    setError(null)

    const maxOrden = Math.max(0, ...puestos.filter((p) => p.grupo === grupo).map((p) => p.sort_order))

    const { error } = await supabase.from('puestos').insert({
      nombre: nombre.trim(),
      grupo,
      color: COLOR_POR_GRUPO[grupo],
      sort_order: maxOrden + 1,
      activo: true,
    })

    setGuardando(false)
    if (error) {
      setError('No se pudo guardar. Puede que ya exista un puesto con ese nombre en ese bloque.')
      return
    }
    setMostrarForm(false)
    cargar()
  }

  async function toggleActivo(p: Puesto) {
    await supabase.from('puestos').update({ activo: !p.activo }).eq('id', p.id)
    cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este puesto? Si alguna persona lo tiene como preferencia, quedará sin definir.')) return
    await supabase.from('puestos').delete().eq('id', id)
    cargar()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Puestos</h1>
          <p className="text-ink-500 mt-1">
            Los puestos disponibles en cada bloque del día. Se usan para las preferencias de cada
            persona y para armar la cartelera.
          </p>
        </div>
        <button
          onClick={abrirForm}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors"
        >
          <Plus size={16} />
          Agregar puesto
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={guardar} className="bg-white rounded-xl2 shadow-card p-6 mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Nuevo puesto</h2>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-ink-500 hover:text-ink-900">
              <X size={18} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Cocina 8"
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Bloque del día</span>
              <select
                value={grupo}
                onChange={(e) => setGrupo(e.target.value as Grupo)}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              >
                {GRUPO_ORDEN.map((g) => (
                  <option key={g} value={g}>
                    {GRUPO_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors disabled:opacity-50"
            >
              {guardando && <Loader2 className="animate-spin" size={15} />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-ink-500 text-sm">Cargando…</p>
      ) : puestos.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-soft p-10 text-center flex flex-col items-center">
          <Settings2 className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">No hay puestos cargados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {GRUPO_ORDEN.map((g) => {
            const deEsteGrupo = puestos.filter((p) => p.grupo === g)
            if (deEsteGrupo.length === 0) return null
            const estilo = GRUPO_COLOR_CLASSES[g]
            return (
              <div key={g}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${estilo.text}`}>{GRUPO_LABEL[g]}</p>
                <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden">
                  {deEsteGrupo.map((p) => (
                    <div key={p.id} className={`flex items-center gap-4 px-5 py-3 ${!p.activo ? 'opacity-50' : ''}`}>
                      <p className="flex-1 font-medium text-ink-900 text-sm">{p.nombre}</p>
                      <button
                        onClick={() => toggleActivo(p)}
                        className="text-ink-500 hover:text-ink-900 shrink-0"
                        title={p.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={16} />
                      </button>
                      <button onClick={() => eliminar(p.id)} className="text-ink-500 hover:text-red-600 shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
